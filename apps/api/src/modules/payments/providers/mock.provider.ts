import { Injectable } from '@nestjs/common';
import {
  IPaymentProvider,
  PaymentProviderType,
  CreatePaymentDto,
  PaymentIntent,
  PaymentResult,
  RefundResult,
  WebhookResult,
  VenuePaymentConfig,
} from '../interfaces/payment-provider.interface';

@Injectable()
export class MockPaymentProvider implements IPaymentProvider {
  readonly providerType: PaymentProviderType = 'MOCK';

  async createPaymentIntent(
    dto: CreatePaymentDto,
    _config?: VenuePaymentConfig,
  ): Promise<PaymentIntent> {
    const id = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      id,
      provider: 'MOCK',
      amount: dto.amount,
      currency: dto.currency || 'USD',
      status: 'PENDING',
      externalId: id,
      clientSecret: `mock_secret_${id}`,
      metadata: dto.metadata,
    };
  }

  async confirmPayment(
    paymentId: string,
    _config?: VenuePaymentConfig,
  ): Promise<PaymentResult> {
    // Mock always succeeds
    return {
      success: true,
      paymentId,
      status: 'COMPLETED',
      transactionId: `mock_txn_${Date.now()}`,
    };
  }

  async cancelPayment(
    paymentId: string,
    _config?: VenuePaymentConfig,
  ): Promise<PaymentResult> {
    return {
      success: true,
      paymentId,
      status: 'CANCELLED',
    };
  }

  async refund(
    paymentId: string,
    amount?: number,
    _config?: VenuePaymentConfig,
  ): Promise<RefundResult> {
    return {
      success: true,
      refundId: `mock_refund_${Date.now()}`,
      amount: amount || 0,
      status: 'COMPLETED',
    };
  }

  async handleWebhook(
    payload: any,
    _signature: string,
    _config?: VenuePaymentConfig,
  ): Promise<WebhookResult> {
    return {
      valid: true,
      eventType: payload.type || 'mock.event',
      paymentId: payload.paymentId,
      status: 'COMPLETED',
    };
  }

  async getPaymentStatus(
    paymentId: string,
    _config?: VenuePaymentConfig,
  ): Promise<PaymentIntent> {
    return {
      id: paymentId,
      provider: 'MOCK',
      amount: 0,
      currency: 'USD',
      status: 'COMPLETED',
      externalId: paymentId,
    };
  }
}
