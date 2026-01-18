'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import { NFCReaderInterface } from './NFCReaderInterface';
import { BankTransferInstructions } from './BankTransferInstructions';

type PaymentProviderType = 'MERCADO_PAGO' | 'STRIPE' | 'BANK_TRANSFER' | 'NFC';

interface CheckoutFlowProps {
  orderId: string;
  venueId: string;
  amount: number;
  currency?: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
  onSuccess?: (paymentId: string) => void;
  onCancel?: () => void;
}

type CheckoutStep = 'SELECT_METHOD' | 'PROCESS_PAYMENT' | 'BANK_TRANSFER' | 'NFC' | 'SUCCESS' | 'ERROR';

export function CheckoutFlow({
  orderId,
  venueId,
  amount,
  currency = 'USD',
  items,
  onSuccess,
  onCancel,
}: CheckoutFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState<CheckoutStep>('SELECT_METHOD');
  const [selectedMethod, setSelectedMethod] = useState<PaymentProviderType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bankTransferData, setBankTransferData] = useState<any>(null);
  const [paymentResult, setPaymentResult] = useState<any>(null);

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount / 100);
  };

  const handleMethodSelect = async (method: PaymentProviderType) => {
    setSelectedMethod(method);
    setError(null);

    // For NFC, go directly to NFC interface
    if (method === 'NFC') {
      setStep('NFC');
      return;
    }

    // For other methods, initiate payment
    setLoading(true);
    try {
      const response = await api.post<{
        id: string;
        status: string;
        redirectUrl?: string;
        clientSecret?: string;
        metadata?: any;
      }>('/payments/initiate', {
        orderId,
        provider: method,
        returnUrl: `${window.location.origin}/checkout/success?orderId=${orderId}`,
      });

      if (method === 'MERCADO_PAGO' && response.redirectUrl) {
        // Redirect to Mercado Pago checkout
        window.location.href = response.redirectUrl;
        return;
      }

      if (method === 'STRIPE' && response.clientSecret) {
        // Handle Stripe payment (would integrate with @stripe/react-stripe-js)
        // For now, redirect to Stripe checkout
        if (response.redirectUrl) {
          window.location.href = response.redirectUrl;
        }
        return;
      }

      if (method === 'BANK_TRANSFER') {
        // Show bank transfer instructions
        setBankTransferData({
          reference: response.metadata?.reference,
          bankDetails: response.metadata?.bankDetails,
          expiresAt: response.metadata?.expiresAt,
          paymentId: response.id,
        });
        setStep('BANK_TRANSFER');
        return;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  const handleNFCSuccess = (result: { transactionId: string; cardLastFour: string }) => {
    setPaymentResult(result);
    setStep('SUCCESS');
    onSuccess?.(result.transactionId);
  };

  const handleNFCError = (errorMessage: string) => {
    setError(errorMessage);
    setStep('SELECT_METHOD');
  };

  const handleBankTransferConfirm = async () => {
    // Mark that user claims to have made the transfer
    // The actual confirmation happens when staff verifies
    setPaymentResult({ pending: true });
    setStep('SUCCESS');
    onSuccess?.(bankTransferData.paymentId);
  };

  const handleCancel = () => {
    if (step === 'SELECT_METHOD') {
      onCancel?.();
    } else {
      setStep('SELECT_METHOD');
      setSelectedMethod(null);
      setError(null);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      {/* Order Summary - Always visible */}
      <div className="bg-gray-50 rounded-xl p-4 mb-6">
        <h3 className="font-medium text-gray-900 mb-3">Order Summary</h3>
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-gray-600">
                {item.name} × {item.quantity}
              </span>
              <span className="text-gray-900">
                {formatAmount(item.unitPrice * item.quantity, currency)}
              </span>
            </div>
          ))}
          <div className="border-t border-gray-200 pt-2 mt-2">
            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span>{formatAmount(amount, currency)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Step Content */}
      {step === 'SELECT_METHOD' && (
        <>
          <PaymentMethodSelector
            venueId={venueId}
            selectedMethod={selectedMethod || undefined}
            onSelect={handleMethodSelect}
          />
          {loading && (
            <div className="mt-4 text-center text-gray-500">
              <div className="animate-spin inline-block w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full mb-2" />
              <p>Initiating payment...</p>
            </div>
          )}
          {onCancel && (
            <button
              onClick={handleCancel}
              className="w-full mt-4 py-3 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          )}
        </>
      )}

      {step === 'NFC' && (
        <NFCReaderInterface
          orderId={orderId}
          venueId={venueId}
          amount={amount}
          currency={currency}
          onSuccess={handleNFCSuccess}
          onError={handleNFCError}
          onCancel={handleCancel}
        />
      )}

      {step === 'BANK_TRANSFER' && bankTransferData && (
        <BankTransferInstructions
          reference={bankTransferData.reference}
          amount={amount}
          currency={currency}
          bankDetails={bankTransferData.bankDetails}
          expiresAt={bankTransferData.expiresAt}
          onConfirm={handleBankTransferConfirm}
          onCancel={handleCancel}
        />
      )}

      {step === 'SUCCESS' && (
        <div className="text-center p-8 bg-green-50 rounded-xl">
          <div className="text-5xl mb-4">✅</div>
          <h3 className="text-xl font-semibold text-green-800 mb-2">
            {paymentResult?.pending ? 'Transfer Initiated' : 'Payment Successful!'}
          </h3>
          <p className="text-green-600 mb-6">
            {paymentResult?.pending
              ? 'Your order will be confirmed once we verify your bank transfer.'
              : `Your order #${orderId} has been paid.`}
          </p>
          {paymentResult?.cardLastFour && (
            <p className="text-sm text-green-700 mb-4">
              Paid with card ending in {paymentResult.cardLastFour}
            </p>
          )}
          <button
            onClick={() => router.push(`/orders/${orderId}`)}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
          >
            View Order
          </button>
        </div>
      )}
    </div>
  );
}
