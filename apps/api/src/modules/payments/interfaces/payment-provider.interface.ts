export interface PaymentIntent {
  id: string;
  provider: PaymentProviderType;
  amount: number;
  currency: string;
  status: PaymentIntentStatus;
  clientSecret?: string;
  externalId?: string;
  checkoutUrl?: string;
  qrCode?: string;
  metadata?: Record<string, any>;
}

export interface PaymentResult {
  success: boolean;
  paymentId: string;
  status: PaymentIntentStatus;
  transactionId?: string;
  error?: string;
  metadata?: Record<string, any>;
}

export interface RefundResult {
  success: boolean;
  refundId: string;
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  error?: string;
}

export interface WebhookResult {
  valid: boolean;
  eventType: string;
  paymentId?: string;
  status?: PaymentIntentStatus;
  metadata?: Record<string, any>;
}

export interface NFCPaymentData {
  cardToken: string;
  cardLastFour: string;
  cardBrand: string;
  amount: number;
  currency: string;
}

export type PaymentProviderType =
  | 'MERCADO_PAGO'
  | 'STRIPE'
  | 'BANK_TRANSFER'
  | 'NFC'
  | 'MOCK';

export type PaymentIntentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'REQUIRES_ACTION'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface CreatePaymentDto {
  orderId: string;
  amount: number;
  currency?: string;
  description?: string;
  customerEmail?: string;
  metadata?: Record<string, any>;
  returnUrl?: string;
}

export interface VenuePaymentConfig {
  venueId: string;
  provider: PaymentProviderType;
  isEnabled: boolean;
  credentials: {
    // Mercado Pago
    mercadoPagoAccessToken?: string;
    mercadoPagoPublicKey?: string;
    // Stripe Connect
    stripeAccountId?: string;
    stripePublishableKey?: string;
    // Bank Transfer
    bankName?: string;
    accountNumber?: string;
    accountHolder?: string;
    routingNumber?: string;
    // NFC
    nfcTerminalId?: string;
  };
}

export interface IPaymentProvider {
  readonly providerType: PaymentProviderType;

  createPaymentIntent(
    dto: CreatePaymentDto,
    config?: VenuePaymentConfig,
  ): Promise<PaymentIntent>;

  confirmPayment(
    paymentId: string,
    config?: VenuePaymentConfig,
  ): Promise<PaymentResult>;

  cancelPayment(
    paymentId: string,
    config?: VenuePaymentConfig,
  ): Promise<PaymentResult>;

  refund(
    paymentId: string,
    amount?: number,
    config?: VenuePaymentConfig,
  ): Promise<RefundResult>;

  handleWebhook(
    payload: any,
    signature: string,
    config?: VenuePaymentConfig,
  ): Promise<WebhookResult>;

  getPaymentStatus(
    paymentId: string,
    config?: VenuePaymentConfig,
  ): Promise<PaymentIntent>;
}

export interface INFCPaymentProvider extends IPaymentProvider {
  processNFCPayment(
    nfcData: NFCPaymentData,
    dto: CreatePaymentDto,
    config?: VenuePaymentConfig,
  ): Promise<PaymentResult>;

  validateNFCToken(token: string): Promise<boolean>;
}
