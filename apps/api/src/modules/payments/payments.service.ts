import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PaymentStatus, PaymentProvider as PrismaPaymentProvider } from '@prisma/client';
import {
  IPaymentProvider,
  PaymentProviderType,
  CreatePaymentDto,
  PaymentIntent,
  PaymentResult,
  RefundResult,
  VenuePaymentConfig,
} from './interfaces/payment-provider.interface';
import { MercadoPagoProvider } from './providers/mercado-pago.provider';
import { StripeConnectProvider } from './providers/stripe-connect.provider';
import { BankTransferProvider } from './providers/bank-transfer.provider';
import { NFCPaymentProvider } from './providers/nfc-payment.provider';
import { MockPaymentProvider } from './providers/mock.provider';

@Injectable()
export class PaymentsService {
  private providers: Map<PaymentProviderType, IPaymentProvider>;

  constructor(
    private prisma: PrismaService,
    private mercadoPagoProvider: MercadoPagoProvider,
    private stripeConnectProvider: StripeConnectProvider,
    private bankTransferProvider: BankTransferProvider,
    private nfcPaymentProvider: NFCPaymentProvider,
    private mockProvider: MockPaymentProvider,
  ) {
    this.providers = new Map([
      ['MERCADO_PAGO', mercadoPagoProvider],
      ['STRIPE', stripeConnectProvider],
      ['BANK_TRANSFER', bankTransferProvider],
      ['NFC', nfcPaymentProvider],
      ['MOCK', mockProvider],
    ]);
  }

  private getProvider(type: PaymentProviderType): IPaymentProvider {
    const provider = this.providers.get(type);
    if (!provider) {
      throw new BadRequestException(`Payment provider ${type} not supported`);
    }
    return provider;
  }

  async getVenuePaymentConfig(venueId: string): Promise<VenuePaymentConfig[]> {
    const venue = await this.prisma.venue.findUnique({
      where: { id: venueId },
      select: {
        id: true,
        paymentConfig: true,
      },
    });

    if (!venue) {
      throw new NotFoundException('Venue not found');
    }

    // Parse payment config from venue metadata
    const config = venue.paymentConfig as any;
    if (!config || !config.providers) {
      return [];
    }

    return config.providers;
  }

  async initiatePayment(
    orderId: string,
    providerType: PaymentProviderType,
    options?: {
      returnUrl?: string;
      customerEmail?: string;
    },
  ): Promise<PaymentIntent> {
    // Get order
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        venue: true,
        user: { select: { email: true } },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== 'PENDING_PAYMENT' && order.status !== 'DRAFT') {
      throw new BadRequestException('Order is not awaiting payment');
    }

    // Get venue payment config for this provider
    const configs = order.venueId ? await this.getVenuePaymentConfig(order.venueId) : [];
    const venueConfig = configs.find((c) => c.provider === providerType && c.isEnabled);

    // Get provider
    const provider = this.getProvider(providerType);

    // Create payment intent
    const dto: CreatePaymentDto = {
      orderId: order.id,
      amount: order.total.toNumber(),
      currency: 'USD', // TODO: Make configurable per venue
      description: `Order ${order.orderNumber} at ${order.venue?.name || 'Venue'}`,
      customerEmail: options?.customerEmail || order.user?.email || undefined,
      returnUrl: options?.returnUrl,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        venueId: order.venueId,
        venueName: order.venue?.name || 'Venue',
      },
    };

    const paymentIntent = await provider.createPaymentIntent(dto, venueConfig);

    // Create payment record
    await this.prisma.payment.create({
      data: {
        orderId: order.id,
        provider: this.mapProviderToPrisma(providerType),
        providerPaymentId: paymentIntent.externalId || paymentIntent.id,
        amount: order.total,
        status: PaymentStatus.PENDING,
        providerData: {
          clientSecret: paymentIntent.clientSecret,
          checkoutUrl: paymentIntent.checkoutUrl,
          qrCode: paymentIntent.qrCode,
        },
      },
    });

    // Update order status
    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'PENDING_PAYMENT' },
    });

    return paymentIntent;
  }

  async confirmPayment(
    paymentId: string,
    providerType: PaymentProviderType,
  ): Promise<PaymentResult> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: { include: { venue: true } } },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const configs = payment.order.venueId
      ? await this.getVenuePaymentConfig(payment.order.venueId)
      : [];
    const venueConfig = configs.find((c) => c.provider === providerType);

    const provider = this.getProvider(providerType);
    const result = await provider.confirmPayment(payment.providerPaymentId || payment.id, venueConfig);

    // Update payment status
    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: result.success ? PaymentStatus.COMPLETED : PaymentStatus.FAILED,
        completedAt: result.success ? new Date() : null,
      },
    });

    // Update order status
    if (result.success) {
      await this.prisma.order.update({
        where: { id: payment.orderId },
        data: { status: 'PAID' },
      });
    }

    return result;
  }

  async processWebhook(
    providerType: PaymentProviderType,
    payload: any,
    signature: string,
    venueId?: string,
  ): Promise<{ processed: boolean }> {
    const provider = this.getProvider(providerType);

    let venueConfig: VenuePaymentConfig | undefined;
    if (venueId) {
      const configs = await this.getVenuePaymentConfig(venueId);
      venueConfig = configs.find((c) => c.provider === providerType);
    }

    const result = await provider.handleWebhook(payload, signature, venueConfig);

    if (!result.valid) {
      return { processed: false };
    }

    // Find payment by provider payment ID
    if (result.paymentId) {
      const payment = await this.prisma.payment.findFirst({
        where: { providerPaymentId: result.paymentId },
      });

      if (payment && result.status) {
        const newStatus = this.mapIntentStatusToPrisma(result.status);

        await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: newStatus,
            completedAt: newStatus === PaymentStatus.COMPLETED ? new Date() : null,
          },
        });

        // Update order status based on payment status
        if (newStatus === PaymentStatus.COMPLETED) {
          await this.prisma.order.update({
            where: { id: payment.orderId },
            data: { status: 'PAID' },
          });
        } else if (newStatus === PaymentStatus.FAILED) {
          await this.prisma.order.update({
            where: { id: payment.orderId },
            data: { status: 'CANCELLED' },
          });
        }
      }
    }

    return { processed: true };
  }

  async refundPayment(
    paymentId: string,
    amount?: number,
  ): Promise<RefundResult> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: { include: { venue: true } } },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException('Can only refund completed payments');
    }

    const providerType = this.mapPrismaToProvider(payment.provider);
    const configs = payment.order.venueId
      ? await this.getVenuePaymentConfig(payment.order.venueId)
      : [];
    const venueConfig = configs.find((c) => c.provider === providerType);

    const provider = this.getProvider(providerType);
    const result = await provider.refund(
      payment.providerPaymentId || payment.id,
      amount,
      venueConfig,
    );

    if (result.success) {
      await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.REFUNDED,
          refundedAmount: amount ? amount : payment.amount,
        },
      });
    }

    return result;
  }

  async getPaymentMethods(venueId: string): Promise<PaymentProviderType[]> {
    const configs = await this.getVenuePaymentConfig(venueId);
    return configs.filter((c) => c.isEnabled).map((c) => c.provider);
  }

  async updateVenuePaymentConfig(
    venueId: string,
    config: {
      enabledMethods: PaymentProviderType[];
      defaultMethod?: PaymentProviderType;
      credentials: Record<string, any>;
    },
  ): Promise<void> {
    const venue = await this.prisma.venue.findUnique({
      where: { id: venueId },
    });

    if (!venue) {
      throw new NotFoundException('Venue not found');
    }

    // Build providers array from config - serialize as plain objects
    const providers = config.enabledMethods.map((method) => ({
      provider: method,
      isEnabled: true,
      credentials: config.credentials[method.toLowerCase().replace('_', '')] || {},
    }));

    // Store as JSON-serializable object
    const paymentConfigData = {
      enabledMethods: config.enabledMethods,
      defaultMethod: config.defaultMethod,
      providers,
    };

    await this.prisma.venue.update({
      where: { id: venueId },
      data: {
        paymentConfig: paymentConfigData as any,
      },
    });
  }

  async createStripeConnectLink(
    venueId: string,
    returnUrl: string,
  ): Promise<{ url: string }> {
    const venue = await this.prisma.venue.findUnique({
      where: { id: venueId },
      select: { id: true, name: true, paymentConfig: true },
    });

    if (!venue) {
      throw new NotFoundException('Venue not found');
    }

    // Use Stripe Connect provider
    const stripeProvider = this.providers.get('STRIPE') as StripeConnectProvider;

    // Check if account already exists
    const config = venue.paymentConfig as any;
    let accountId = config?.credentials?.stripe?.accountId;

    if (!accountId) {
      // Create new Connect account - pass venue email or a generated one
      const venueEmail = config?.credentials?.stripe?.email || `venue-${venueId}@flowbond.app`;
      accountId = await stripeProvider.createConnectAccount(venueEmail, 'US');

      // Save account ID to venue config
      const updatedConfig = {
        ...config,
        credentials: {
          ...config?.credentials,
          stripe: {
            accountId,
            connected: false,
          },
        },
      };

      await this.prisma.venue.update({
        where: { id: venueId },
        data: { paymentConfig: updatedConfig },
      });
    }

    // Create account link for onboarding
    const refreshUrl = returnUrl; // Use same URL for refresh
    const linkUrl = await stripeProvider.createAccountLink(accountId, returnUrl, refreshUrl);

    return { url: linkUrl };
  }

  private mapProviderToPrisma(type: PaymentProviderType): PrismaPaymentProvider {
    const map: Record<PaymentProviderType, PrismaPaymentProvider> = {
      MERCADO_PAGO: PrismaPaymentProvider.MERCADO_PAGO,
      STRIPE: PrismaPaymentProvider.STRIPE,
      BANK_TRANSFER: PrismaPaymentProvider.BANK_TRANSFER,
      NFC: PrismaPaymentProvider.NFC,
      MOCK: PrismaPaymentProvider.MOCK,
    };
    return map[type];
  }

  private mapPrismaToProvider(provider: PrismaPaymentProvider): PaymentProviderType {
    // Map Prisma providers to our provider types
    // Some Prisma providers map to MOCK since we don't have dedicated providers for them
    switch (provider) {
      case PrismaPaymentProvider.MERCADO_PAGO:
        return 'MERCADO_PAGO';
      case PrismaPaymentProvider.STRIPE:
        return 'STRIPE';
      case PrismaPaymentProvider.BANK_TRANSFER:
        return 'BANK_TRANSFER';
      case PrismaPaymentProvider.NFC:
        return 'NFC';
      case PrismaPaymentProvider.MOCK:
      case PrismaPaymentProvider.SQUARE:
      case PrismaPaymentProvider.PAYPAL:
      case PrismaPaymentProvider.CASH:
      case PrismaPaymentProvider.COMP:
      case PrismaPaymentProvider.PROMOTION:
        return 'MOCK'; // Fallback to mock for unsupported providers
      default:
        return 'MOCK';
    }
  }

  private mapIntentStatusToPrisma(status: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = {
      PENDING: PaymentStatus.PENDING,
      PROCESSING: PaymentStatus.PROCESSING,
      REQUIRES_ACTION: PaymentStatus.PENDING,
      COMPLETED: PaymentStatus.COMPLETED,
      FAILED: PaymentStatus.FAILED,
      CANCELLED: PaymentStatus.FAILED,
      REFUNDED: PaymentStatus.REFUNDED,
    };
    return map[status] || PaymentStatus.PENDING;
  }
}
