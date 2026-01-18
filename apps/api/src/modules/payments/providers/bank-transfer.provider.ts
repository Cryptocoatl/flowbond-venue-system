import { Injectable, Logger } from '@nestjs/common';
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
export class BankTransferProvider implements IPaymentProvider {
  readonly providerType: PaymentProviderType = 'BANK_TRANSFER';
  private readonly logger = new Logger(BankTransferProvider.name);

  async createPaymentIntent(
    dto: CreatePaymentDto,
    config?: VenuePaymentConfig,
  ): Promise<PaymentIntent> {
    const id = `bank_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Generate payment reference code for bank transfer
    const referenceCode = this.generateReferenceCode(dto.orderId);

    // Get bank details from venue config
    const bankDetails = config?.credentials ? {
      bankName: config.credentials.bankName || 'Not configured',
      accountNumber: config.credentials.accountNumber || 'Not configured',
      accountHolder: config.credentials.accountHolder || 'Not configured',
      routingNumber: config.credentials.routingNumber,
    } : null;

    return {
      id,
      provider: 'BANK_TRANSFER',
      amount: dto.amount,
      currency: dto.currency || 'USD',
      status: 'PENDING',
      externalId: referenceCode,
      metadata: {
        ...dto.metadata,
        referenceCode,
        bankDetails,
        instructions: bankDetails ? this.generateInstructions(bankDetails, dto.amount, referenceCode) : null,
      },
    };
  }

  async confirmPayment(
    paymentId: string,
    _config?: VenuePaymentConfig,
  ): Promise<PaymentResult> {
    // Bank transfers are manually confirmed by venue staff
    // This method is called when staff marks a transfer as received
    return {
      success: true,
      paymentId,
      status: 'COMPLETED',
      transactionId: `bank_txn_${Date.now()}`,
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
    // Bank transfer refunds need to be processed manually
    this.logger.log(`Bank transfer refund requested for ${paymentId}, amount: ${amount}`);

    return {
      success: true,
      refundId: `bank_refund_${Date.now()}`,
      amount: amount || 0,
      status: 'PENDING', // Manual refunds start as pending
    };
  }

  async handleWebhook(
    payload: any,
    _signature: string,
    _config?: VenuePaymentConfig,
  ): Promise<WebhookResult> {
    // Bank transfers don't have automated webhooks
    // This could be used for integration with banking APIs that support webhooks
    return {
      valid: true,
      eventType: payload.type || 'bank_transfer.manual',
      paymentId: payload.referenceCode,
      status: payload.status || 'PENDING',
    };
  }

  async getPaymentStatus(
    paymentId: string,
    _config?: VenuePaymentConfig,
  ): Promise<PaymentIntent> {
    // In a real implementation, this would check the database
    return {
      id: paymentId,
      provider: 'BANK_TRANSFER',
      amount: 0,
      currency: 'USD',
      status: 'PENDING',
      externalId: paymentId,
    };
  }

  // Manual confirmation method for venue staff
  async manuallyConfirmTransfer(
    referenceCode: string,
    confirmedAmount: number,
    confirmedBy: string,
  ): Promise<PaymentResult> {
    this.logger.log(`Bank transfer ${referenceCode} manually confirmed by ${confirmedBy} for ${confirmedAmount}`);

    return {
      success: true,
      paymentId: referenceCode,
      status: 'COMPLETED',
      transactionId: `bank_manual_${Date.now()}`,
      metadata: {
        confirmedBy,
        confirmedAmount,
        confirmedAt: new Date().toISOString(),
      },
    };
  }

  private generateReferenceCode(orderId: string): string {
    // Generate a short, easy-to-type reference code
    const timestamp = Date.now().toString(36).toUpperCase();
    const orderPart = orderId.slice(-4).toUpperCase();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `FB-${timestamp}-${orderPart}-${random}`;
  }

  private generateInstructions(
    bankDetails: {
      bankName: string;
      accountNumber: string;
      accountHolder: string;
      routingNumber?: string;
    },
    amount: number,
    referenceCode: string,
  ): string {
    const amountFormatted = (amount / 100).toFixed(2);

    let instructions = `
BANK TRANSFER INSTRUCTIONS
==========================

Amount: $${amountFormatted}
Reference Code: ${referenceCode}

IMPORTANT: Include the reference code in the transfer memo/description.

Bank Details:
- Bank: ${bankDetails.bankName}
- Account Holder: ${bankDetails.accountHolder}
- Account Number: ${bankDetails.accountNumber}`;

    if (bankDetails.routingNumber) {
      instructions += `\n- Routing Number: ${bankDetails.routingNumber}`;
    }

    instructions += `

After completing the transfer, your order will be processed once the payment is verified (usually within 1-2 business days).

For faster processing, please send a confirmation screenshot to the venue.
`;

    return instructions.trim();
  }
}
