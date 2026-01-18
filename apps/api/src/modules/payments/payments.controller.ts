import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Headers,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentsService } from './payments.service';
import { NFCPaymentProvider } from './providers/nfc-payment.provider';
import { PaymentProviderType, NFCPaymentData } from './interfaces/payment-provider.interface';

@Controller('payments')
export class PaymentsController {
  constructor(
    private paymentsService: PaymentsService,
    private nfcProvider: NFCPaymentProvider,
  ) {}

  // Get available payment methods for a venue
  @Get('methods/:venueId')
  async getPaymentMethods(@Param('venueId') venueId: string) {
    return this.paymentsService.getPaymentMethods(venueId);
  }

  // Initiate a payment for an order
  @Post('initiate')
  @UseGuards(JwtAuthGuard)
  async initiatePayment(
    @Body() body: {
      orderId: string;
      provider: PaymentProviderType;
      returnUrl?: string;
    },
    @Request() req: any,
  ) {
    return this.paymentsService.initiatePayment(body.orderId, body.provider, {
      returnUrl: body.returnUrl,
      customerEmail: req.user?.email,
    });
  }

  // Confirm a payment (for client-confirmed flows)
  @Post(':id/confirm')
  @UseGuards(JwtAuthGuard)
  async confirmPayment(
    @Param('id') paymentId: string,
    @Body() body: { provider: PaymentProviderType },
  ) {
    return this.paymentsService.confirmPayment(paymentId, body.provider);
  }

  // Request a refund
  @Post(':id/refund')
  @UseGuards(JwtAuthGuard)
  async refundPayment(
    @Param('id') paymentId: string,
    @Body() body: { amount?: number },
  ) {
    return this.paymentsService.refundPayment(paymentId, body.amount);
  }

  // Webhooks
  @Post('webhook/mercado-pago')
  async mercadoPagoWebhook(
    @Body() payload: any,
    @Headers('x-signature') signature: string,
    @Query('venueId') venueId?: string,
  ) {
    return this.paymentsService.processWebhook('MERCADO_PAGO', payload, signature, venueId);
  }

  @Post('webhook/stripe')
  async stripeWebhook(
    @Body() payload: any,
    @Headers('stripe-signature') signature: string,
    @Query('venueId') venueId?: string,
  ) {
    return this.paymentsService.processWebhook('STRIPE', payload, signature, venueId);
  }

  // NFC-specific endpoints
  @Post('nfc/session')
  @UseGuards(JwtAuthGuard)
  async createNFCSession(
    @Body() body: {
      orderId: string;
      venueId: string;
    },
  ) {
    return this.paymentsService.initiatePayment(body.orderId, 'NFC');
  }

  @Get('nfc/session/:sessionId')
  async getNFCSessionStatus(@Param('sessionId') sessionId: string) {
    const status = this.nfcProvider.getSessionStatus(sessionId);
    if (!status) {
      return { error: 'Session not found' };
    }
    return status;
  }

  @Post('nfc/tap')
  async handleNFCTap(
    @Body() body: {
      sessionId: string;
      cardToken: string;
      cardLastFour: string;
      cardBrand: string;
    },
  ) {
    const cardData: NFCPaymentData = {
      cardToken: body.cardToken,
      cardLastFour: body.cardLastFour,
      cardBrand: body.cardBrand,
      amount: 0, // Will be filled from session
      currency: 'USD',
    };

    return this.nfcProvider.handleCardTap(body.sessionId, cardData);
  }
}

// Venue payment configuration controller
@Controller('manage/venues/:venueId/payments')
@UseGuards(JwtAuthGuard)
export class VenuePaymentConfigController {
  constructor(private paymentsService: PaymentsService) {}

  @Get('config')
  async getPaymentConfig(@Param('venueId') venueId: string) {
    return this.paymentsService.getVenuePaymentConfig(venueId);
  }

  @Put('config')
  async updatePaymentConfig(
    @Param('venueId') venueId: string,
    @Body() body: {
      enabledMethods: ('MERCADO_PAGO' | 'STRIPE' | 'BANK_TRANSFER' | 'NFC')[];
      defaultMethod?: 'MERCADO_PAGO' | 'STRIPE' | 'BANK_TRANSFER' | 'NFC';
      credentials: Record<string, any>;
    },
  ) {
    await this.paymentsService.updateVenuePaymentConfig(venueId, body);
    return { success: true };
  }

  @Get('methods')
  async getEnabledMethods(@Param('venueId') venueId: string) {
    return this.paymentsService.getPaymentMethods(venueId);
  }

  @Post('stripe/connect')
  async connectStripe(
    @Param('venueId') venueId: string,
    @Body() body: { returnUrl: string },
  ) {
    return this.paymentsService.createStripeConnectLink(venueId, body.returnUrl);
  }
}
