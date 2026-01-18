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

// Stripe types (install: npm install stripe)
interface StripePaymentIntent {
  id: string;
  client_secret: string;
  status: string;
  amount: number;
  currency: string;
  metadata: Record<string, string>;
}

interface StripeRefund {
  id: string;
  amount: number;
  status: string;
}

@Injectable()
export class StripeConnectProvider implements IPaymentProvider {
  readonly providerType: PaymentProviderType = 'STRIPE';
  private readonly logger = new Logger(StripeConnectProvider.name);
  private readonly platformSecretKey: string;
  private readonly webhookSecret: string;

  constructor(private configService: ConfigService) {
    this.platformSecretKey = this.configService.get('STRIPE_SECRET_KEY') || '';
    this.webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET') || '';
  }

  private getHeaders(config?: VenuePaymentConfig): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Bearer ${this.platformSecretKey}`,
    };

    // If venue has connected Stripe account, use it
    if (config?.credentials?.stripeAccountId) {
      headers['Stripe-Account'] = config.credentials.stripeAccountId;
    }

    return headers;
  }

  async createPaymentIntent(
    dto: CreatePaymentDto,
    config?: VenuePaymentConfig,
  ): Promise<PaymentIntent> {
    if (!this.platformSecretKey) {
      throw new Error('Stripe secret key not configured');
    }

    try {
      const params = new URLSearchParams({
        amount: dto.amount.toString(),
        currency: (dto.currency || 'usd').toLowerCase(),
        'automatic_payment_methods[enabled]': 'true',
        'metadata[orderId]': dto.orderId,
      });

      if (dto.description) {
        params.append('description', dto.description);
      }

      if (dto.customerEmail) {
        params.append('receipt_email', dto.customerEmail);
      }

      if (dto.metadata) {
        Object.entries(dto.metadata).forEach(([key, value]) => {
          params.append(`metadata[${key}]`, String(value));
        });
      }

      // If connected account, set application fee (platform takes a cut)
      if (config?.credentials?.stripeAccountId) {
        const applicationFee = Math.round(dto.amount * 0.02); // 2% platform fee
        params.append('application_fee_amount', applicationFee.toString());
      }

      const response = await fetch('https://api.stripe.com/v1/payment_intents', {
        method: 'POST',
        headers: this.getHeaders(config),
        body: params.toString(),
      });

      if (!response.ok) {
        const error = await response.json();
        this.logger.error('Stripe error:', error);
        throw new Error(`Stripe API error: ${error.error?.message || 'Unknown error'}`);
      }

      const paymentIntent: StripePaymentIntent = await response.json();

      return {
        id: paymentIntent.id,
        provider: 'STRIPE',
        amount: paymentIntent.amount,
        currency: paymentIntent.currency.toUpperCase(),
        status: this.mapStripeStatus(paymentIntent.status),
        externalId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        metadata: dto.metadata,
      };
    } catch (error) {
      this.logger.error('Failed to create Stripe payment intent:', error);
      throw error;
    }
  }

  async confirmPayment(
    paymentId: string,
    config?: VenuePaymentConfig,
  ): Promise<PaymentResult> {
    try {
      const response = await fetch(`https://api.stripe.com/v1/payment_intents/${paymentId}`, {
        headers: this.getHeaders(config),
      });

      if (!response.ok) {
        return {
          success: false,
          paymentId,
          status: 'FAILED',
          error: 'Failed to retrieve payment',
        };
      }

      const paymentIntent: StripePaymentIntent = await response.json();
      const status = this.mapStripeStatus(paymentIntent.status);

      return {
        success: status === 'COMPLETED',
        paymentId,
        status,
        transactionId: paymentIntent.id,
      };
    } catch (error) {
      this.logger.error('Failed to confirm Stripe payment:', error);
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
    try {
      const response = await fetch(`https://api.stripe.com/v1/payment_intents/${paymentId}/cancel`, {
        method: 'POST',
        headers: this.getHeaders(config),
      });

      return {
        success: response.ok,
        paymentId,
        status: response.ok ? 'CANCELLED' : 'FAILED',
      };
    } catch (error) {
      this.logger.error('Failed to cancel Stripe payment:', error);
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
    try {
      const params = new URLSearchParams({
        payment_intent: paymentId,
      });

      if (amount) {
        params.append('amount', amount.toString());
      }

      const response = await fetch('https://api.stripe.com/v1/refunds', {
        method: 'POST',
        headers: this.getHeaders(config),
        body: params.toString(),
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          refundId: '',
          amount: amount || 0,
          status: 'FAILED',
          error: error.error?.message || 'Refund failed',
        };
      }

      const refund: StripeRefund = await response.json();

      return {
        success: true,
        refundId: refund.id,
        amount: refund.amount,
        status: refund.status === 'succeeded' ? 'COMPLETED' : 'PENDING',
      };
    } catch (error) {
      this.logger.error('Failed to refund Stripe payment:', error);
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
    signature: string,
    _config?: VenuePaymentConfig,
  ): Promise<WebhookResult> {
    // In production, verify webhook signature
    // const crypto = require('crypto');
    // const expectedSignature = crypto.createHmac('sha256', this.webhookSecret)
    //   .update(JSON.stringify(payload))
    //   .digest('hex');
    // if (signature !== expectedSignature) {
    //   return { valid: false, eventType: '' };
    // }

    const event = payload;

    if (!event.type?.startsWith('payment_intent')) {
      return {
        valid: true,
        eventType: event.type,
      };
    }

    const paymentIntent = event.data?.object as StripePaymentIntent;

    return {
      valid: true,
      eventType: event.type,
      paymentId: paymentIntent?.metadata?.orderId || paymentIntent?.id,
      status: this.mapStripeStatus(paymentIntent?.status || ''),
      metadata: {
        stripeId: paymentIntent?.id,
      },
    };
  }

  async getPaymentStatus(
    paymentId: string,
    config?: VenuePaymentConfig,
  ): Promise<PaymentIntent> {
    const response = await fetch(`https://api.stripe.com/v1/payment_intents/${paymentId}`, {
      headers: this.getHeaders(config),
    });

    if (!response.ok) {
      throw new Error('Failed to get payment status');
    }

    const paymentIntent: StripePaymentIntent = await response.json();

    return {
      id: paymentId,
      provider: 'STRIPE',
      amount: paymentIntent.amount,
      currency: paymentIntent.currency.toUpperCase(),
      status: this.mapStripeStatus(paymentIntent.status),
      externalId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
    };
  }

  // Stripe Connect specific methods
  async createConnectAccount(email: string, country: string = 'US'): Promise<string> {
    const params = new URLSearchParams({
      type: 'express',
      country,
      email,
      'capabilities[card_payments][requested]': 'true',
      'capabilities[transfers][requested]': 'true',
    });

    const response = await fetch('https://api.stripe.com/v1/accounts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${this.platformSecretKey}`,
      },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error('Failed to create Stripe Connect account');
    }

    const account = await response.json();
    return account.id;
  }

  async createAccountLink(accountId: string, returnUrl: string, refreshUrl: string): Promise<string> {
    const params = new URLSearchParams({
      account: accountId,
      type: 'account_onboarding',
      return_url: returnUrl,
      refresh_url: refreshUrl,
    });

    const response = await fetch('https://api.stripe.com/v1/account_links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${this.platformSecretKey}`,
      },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error('Failed to create account link');
    }

    const link = await response.json();
    return link.url;
  }

  private mapStripeStatus(status: string): PaymentIntentStatus {
    const statusMap: Record<string, PaymentIntentStatus> = {
      requires_payment_method: 'PENDING',
      requires_confirmation: 'PENDING',
      requires_action: 'REQUIRES_ACTION',
      processing: 'PROCESSING',
      requires_capture: 'PROCESSING',
      canceled: 'CANCELLED',
      succeeded: 'COMPLETED',
    };
    return statusMap[status] || 'PENDING';
  }
}
