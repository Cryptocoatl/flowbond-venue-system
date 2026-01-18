import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IPaymentProvider,
  PaymentProviderType,
  CreatePaymentDto,
  PaymentIntent,
  PaymentResult,
  RefundResult,
  WebhookResult,
  VenuePaymentConfig,
  PaymentIntentStatus,
} from '../interfaces/payment-provider.interface';

// Mercado Pago SDK types (install: npm install mercadopago)
interface MercadoPagoPreference {
  id: string;
  init_point: string;
  sandbox_init_point: string;
}

interface MercadoPagoPayment {
  id: number;
  status: string;
  status_detail: string;
  transaction_amount: number;
  currency_id: string;
  external_reference: string;
}

@Injectable()
export class MercadoPagoProvider implements IPaymentProvider {
  readonly providerType: PaymentProviderType = 'MERCADO_PAGO';
  private readonly logger = new Logger(MercadoPagoProvider.name);
  private readonly defaultAccessToken: string;
  private readonly isProduction: boolean;

  constructor(private configService: ConfigService) {
    this.defaultAccessToken = this.configService.get('MERCADO_PAGO_ACCESS_TOKEN') || '';
    this.isProduction = this.configService.get('NODE_ENV') === 'production';
  }

  private getAccessToken(config?: VenuePaymentConfig): string {
    return config?.credentials?.mercadoPagoAccessToken || this.defaultAccessToken;
  }

  async createPaymentIntent(
    dto: CreatePaymentDto,
    config?: VenuePaymentConfig,
  ): Promise<PaymentIntent> {
    const accessToken = this.getAccessToken(config);

    if (!accessToken) {
      throw new Error('Mercado Pago access token not configured');
    }

    try {
      // Create preference using Mercado Pago API
      const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          items: [
            {
              title: dto.description || 'Order Payment',
              quantity: 1,
              currency_id: dto.currency || 'USD',
              unit_price: dto.amount / 100, // Convert cents to dollars
            },
          ],
          payer: dto.customerEmail ? { email: dto.customerEmail } : undefined,
          external_reference: dto.orderId,
          back_urls: dto.returnUrl ? {
            success: `${dto.returnUrl}?status=success`,
            failure: `${dto.returnUrl}?status=failure`,
            pending: `${dto.returnUrl}?status=pending`,
          } : undefined,
          auto_return: 'approved',
          notification_url: `${this.configService.get('API_URL')}/api/payments/webhook/mercado-pago`,
          metadata: dto.metadata,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        this.logger.error('Mercado Pago error:', error);
        throw new Error(`Mercado Pago API error: ${error.message || 'Unknown error'}`);
      }

      const preference: MercadoPagoPreference = await response.json();

      return {
        id: preference.id,
        provider: 'MERCADO_PAGO',
        amount: dto.amount,
        currency: dto.currency || 'USD',
        status: 'PENDING',
        externalId: preference.id,
        checkoutUrl: this.isProduction ? preference.init_point : preference.sandbox_init_point,
        metadata: dto.metadata,
      };
    } catch (error) {
      this.logger.error('Failed to create Mercado Pago preference:', error);
      throw error;
    }
  }

  async confirmPayment(
    paymentId: string,
    config?: VenuePaymentConfig,
  ): Promise<PaymentResult> {
    const accessToken = this.getAccessToken(config);

    try {
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        return {
          success: false,
          paymentId,
          status: 'FAILED',
          error: 'Failed to confirm payment',
        };
      }

      const payment: MercadoPagoPayment = await response.json();
      const status = this.mapMercadoPagoStatus(payment.status);

      return {
        success: status === 'COMPLETED',
        paymentId,
        status,
        transactionId: payment.id.toString(),
      };
    } catch (error) {
      this.logger.error('Failed to confirm Mercado Pago payment:', error);
      return {
        success: false,
        paymentId,
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async cancelPayment(
    paymentId: string,
    config?: VenuePaymentConfig,
  ): Promise<PaymentResult> {
    const accessToken = this.getAccessToken(config);

    try {
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status: 'cancelled' }),
      });

      return {
        success: response.ok,
        paymentId,
        status: response.ok ? 'CANCELLED' : 'FAILED',
      };
    } catch (error) {
      this.logger.error('Failed to cancel Mercado Pago payment:', error);
      return {
        success: false,
        paymentId,
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async refund(
    paymentId: string,
    amount?: number,
    config?: VenuePaymentConfig,
  ): Promise<RefundResult> {
    const accessToken = this.getAccessToken(config);

    try {
      const body: any = {};
      if (amount) {
        body.amount = amount / 100; // Convert cents to dollars
      }

      const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}/refunds`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          refundId: '',
          amount: amount || 0,
          status: 'FAILED',
          error: error.message || 'Refund failed',
        };
      }

      const refund = await response.json();

      return {
        success: true,
        refundId: refund.id.toString(),
        amount: refund.amount * 100, // Convert back to cents
        status: 'COMPLETED',
      };
    } catch (error) {
      this.logger.error('Failed to refund Mercado Pago payment:', error);
      return {
        success: false,
        refundId: '',
        amount: amount || 0,
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async handleWebhook(
    payload: any,
    _signature: string,
    config?: VenuePaymentConfig,
  ): Promise<WebhookResult> {
    // Mercado Pago sends notification with action and data
    if (payload.type !== 'payment') {
      return {
        valid: true,
        eventType: payload.type,
      };
    }

    const accessToken = this.getAccessToken(config);

    try {
      // Fetch payment details
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${payload.data.id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        return { valid: false, eventType: 'payment' };
      }

      const payment: MercadoPagoPayment = await response.json();

      return {
        valid: true,
        eventType: 'payment',
        paymentId: payment.external_reference, // This is our orderId
        status: this.mapMercadoPagoStatus(payment.status),
        metadata: {
          mercadoPagoId: payment.id,
          statusDetail: payment.status_detail,
        },
      };
    } catch (error) {
      this.logger.error('Failed to process Mercado Pago webhook:', error);
      return { valid: false, eventType: 'payment' };
    }
  }

  async getPaymentStatus(
    paymentId: string,
    config?: VenuePaymentConfig,
  ): Promise<PaymentIntent> {
    const accessToken = this.getAccessToken(config);

    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get payment status');
    }

    const payment: MercadoPagoPayment = await response.json();

    return {
      id: paymentId,
      provider: 'MERCADO_PAGO',
      amount: payment.transaction_amount * 100,
      currency: payment.currency_id,
      status: this.mapMercadoPagoStatus(payment.status),
      externalId: payment.id.toString(),
    };
  }

  private mapMercadoPagoStatus(status: string): PaymentIntentStatus {
    const statusMap: Record<string, PaymentIntentStatus> = {
      pending: 'PENDING',
      approved: 'COMPLETED',
      authorized: 'PROCESSING',
      in_process: 'PROCESSING',
      in_mediation: 'PROCESSING',
      rejected: 'FAILED',
      cancelled: 'CANCELLED',
      refunded: 'REFUNDED',
      charged_back: 'REFUNDED',
    };
    return statusMap[status] || 'PENDING';
  }
}
