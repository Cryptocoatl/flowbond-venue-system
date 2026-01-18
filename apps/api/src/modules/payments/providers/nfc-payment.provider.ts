import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IPaymentProvider,
  INFCPaymentProvider,
  PaymentProviderType,
  CreatePaymentDto,
  PaymentIntent,
  PaymentResult,
  RefundResult,
  WebhookResult,
  VenuePaymentConfig,
  NFCPaymentData,
  PaymentIntentStatus,
} from '../interfaces/payment-provider.interface';

interface NFCSession {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: 'WAITING' | 'CARD_DETECTED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: Date;
  expiresAt: Date;
  cardData?: {
    lastFour: string;
    brand: string;
  };
}

@Injectable()
export class NFCPaymentProvider implements INFCPaymentProvider {
  readonly providerType: PaymentProviderType = 'NFC';
  private readonly logger = new Logger(NFCPaymentProvider.name);

  // In-memory session storage (use Redis in production)
  private sessions: Map<string, NFCSession> = new Map();

  constructor(private configService: ConfigService) {}

  async createPaymentIntent(
    dto: CreatePaymentDto,
    config?: VenuePaymentConfig,
  ): Promise<PaymentIntent> {
    const sessionId = `nfc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create NFC session that waits for tap
    const session: NFCSession = {
      id: sessionId,
      orderId: dto.orderId,
      amount: dto.amount,
      currency: dto.currency || 'USD',
      status: 'WAITING',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minute timeout
    };

    this.sessions.set(sessionId, session);

    return {
      id: sessionId,
      provider: 'NFC',
      amount: dto.amount,
      currency: dto.currency || 'USD',
      status: 'PENDING',
      externalId: sessionId,
      metadata: {
        ...dto.metadata,
        sessionId,
        terminalId: config?.credentials?.nfcTerminalId,
        expiresAt: session.expiresAt.toISOString(),
        // WebSocket endpoint for real-time updates
        wsEndpoint: `/ws/nfc/${sessionId}`,
      },
    };
  }

  async processNFCPayment(
    nfcData: NFCPaymentData,
    dto: CreatePaymentDto,
    config?: VenuePaymentConfig,
  ): Promise<PaymentResult> {
    try {
      // Validate NFC token
      const isValid = await this.validateNFCToken(nfcData.cardToken);
      if (!isValid) {
        return {
          success: false,
          paymentId: dto.orderId,
          status: 'FAILED',
          error: 'Invalid NFC card data',
        };
      }

      // Process the payment through a payment processor
      // In production, this would integrate with a payment gateway that supports NFC/tap-to-pay
      const paymentResult = await this.processCardPayment(nfcData, dto, config);

      return paymentResult;
    } catch (error) {
      this.logger.error('NFC payment processing failed:', error);
      return {
        success: false,
        paymentId: dto.orderId,
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Payment processing failed',
      };
    }
  }

  async validateNFCToken(token: string): Promise<boolean> {
    // In production, validate the NFC token format and signature
    // This would check:
    // 1. Token format is valid
    // 2. Token hasn't expired
    // 3. Token signature is valid (if using secure NFC)
    if (!token || token.length < 16) {
      return false;
    }
    return true;
  }

  // Called when a card is tapped on the phone
  async handleCardTap(sessionId: string, cardData: NFCPaymentData): Promise<PaymentResult> {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return {
        success: false,
        paymentId: sessionId,
        status: 'FAILED',
        error: 'Session not found or expired',
      };
    }

    if (new Date() > session.expiresAt) {
      this.sessions.delete(sessionId);
      return {
        success: false,
        paymentId: sessionId,
        status: 'FAILED',
        error: 'Session expired',
      };
    }

    // Update session status
    session.status = 'CARD_DETECTED';
    session.cardData = {
      lastFour: cardData.cardLastFour,
      brand: cardData.cardBrand,
    };

    // Process payment
    session.status = 'PROCESSING';

    const result = await this.processNFCPayment(cardData, {
      orderId: session.orderId,
      amount: session.amount,
      currency: session.currency,
    });

    if (result.success) {
      session.status = 'COMPLETED';
    } else {
      session.status = 'FAILED';
    }

    return result;
  }

  async confirmPayment(
    paymentId: string,
    _config?: VenuePaymentConfig,
  ): Promise<PaymentResult> {
    const session = this.sessions.get(paymentId);

    if (!session) {
      return {
        success: false,
        paymentId,
        status: 'FAILED',
        error: 'Session not found',
      };
    }

    return {
      success: session.status === 'COMPLETED',
      paymentId,
      status: this.mapSessionStatus(session.status),
      metadata: session.cardData,
    };
  }

  async cancelPayment(
    paymentId: string,
    _config?: VenuePaymentConfig,
  ): Promise<PaymentResult> {
    this.sessions.delete(paymentId);
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
    // NFC refunds would go through the underlying payment processor
    this.logger.log(`NFC refund requested for ${paymentId}, amount: ${amount}`);

    return {
      success: true,
      refundId: `nfc_refund_${Date.now()}`,
      amount: amount || 0,
      status: 'PENDING',
    };
  }

  async handleWebhook(
    payload: any,
    _signature: string,
    _config?: VenuePaymentConfig,
  ): Promise<WebhookResult> {
    // Handle webhook from NFC/tap-to-pay provider
    return {
      valid: true,
      eventType: payload.type || 'nfc.event',
      paymentId: payload.sessionId,
      status: payload.status,
    };
  }

  async getPaymentStatus(
    paymentId: string,
    _config?: VenuePaymentConfig,
  ): Promise<PaymentIntent> {
    const session = this.sessions.get(paymentId);

    return {
      id: paymentId,
      provider: 'NFC',
      amount: session?.amount || 0,
      currency: session?.currency || 'USD',
      status: session ? this.mapSessionStatus(session.status) : 'FAILED',
      externalId: paymentId,
      metadata: session?.cardData,
    };
  }

  // Get session status for real-time updates
  getSessionStatus(sessionId: string): NFCSession | null {
    return this.sessions.get(sessionId) || null;
  }

  private async processCardPayment(
    cardData: NFCPaymentData,
    dto: CreatePaymentDto,
    _config?: VenuePaymentConfig,
  ): Promise<PaymentResult> {
    // In production, this would:
    // 1. Send card token to payment processor (Stripe, Square, etc.)
    // 2. Process the actual payment
    // 3. Return the result

    // For now, simulate successful payment
    this.logger.log(`Processing NFC payment for ${dto.amount} cents, card ending ${cardData.cardLastFour}`);

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      success: true,
      paymentId: dto.orderId,
      status: 'COMPLETED',
      transactionId: `nfc_txn_${Date.now()}`,
      metadata: {
        cardLastFour: cardData.cardLastFour,
        cardBrand: cardData.cardBrand,
      },
    };
  }

  private mapSessionStatus(status: NFCSession['status']): PaymentIntentStatus {
    const map: Record<NFCSession['status'], PaymentIntentStatus> = {
      WAITING: 'PENDING',
      CARD_DETECTED: 'PROCESSING',
      PROCESSING: 'PROCESSING',
      COMPLETED: 'COMPLETED',
      FAILED: 'FAILED',
    };
    return map[status];
  }
}
