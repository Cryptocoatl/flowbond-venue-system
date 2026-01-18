'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

type NFCSessionStatus = 'WAITING' | 'CARD_DETECTED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

interface NFCSession {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: NFCSessionStatus;
  expiresAt: string;
  cardData?: {
    lastFour: string;
    brand: string;
  };
}

interface NFCReaderInterfaceProps {
  orderId: string;
  venueId: string;
  amount: number;
  currency?: string;
  onSuccess: (result: { transactionId: string; cardLastFour: string }) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

export function NFCReaderInterface({
  orderId,
  venueId,
  amount,
  currency = 'USD',
  onSuccess,
  onError,
  onCancel,
}: NFCReaderInterfaceProps) {
  const [session, setSession] = useState<NFCSession | null>(null);
  const [isNFCSupported, setIsNFCSupported] = useState<boolean | null>(null);
  const [nfcReader, setNfcReader] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes

  // Check NFC support
  useEffect(() => {
    const checkNFCSupport = async () => {
      if ('NDEFReader' in window) {
        setIsNFCSupported(true);
      } else {
        setIsNFCSupported(false);
      }
    };
    checkNFCSupport();
  }, []);

  // Create NFC session on mount
  useEffect(() => {
    const createSession = async () => {
      try {
        const response = await api.post<{ id: string; metadata: any }>('/payments/nfc/session', {
          orderId,
          venueId,
        });

        setSession({
          id: response.id,
          orderId,
          amount,
          currency,
          status: 'WAITING',
          expiresAt: response.metadata?.expiresAt || new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        });
      } catch (err) {
        onError('Failed to create payment session');
      }
    };

    createSession();
  }, [orderId, venueId, amount, currency, onError]);

  // Start NFC reader when session is ready
  useEffect(() => {
    if (!session || !isNFCSupported || session.status !== 'WAITING') return;

    const startNFCReader = async () => {
      try {
        // @ts-ignore - NDEFReader is not in TypeScript types yet
        const ndef = new window.NDEFReader();
        await ndef.scan();

        ndef.addEventListener('reading', async ({ message, serialNumber }: any) => {
          // Card detected
          setSession((prev) => prev ? { ...prev, status: 'CARD_DETECTED' } : null);

          // In a real implementation, this would read card data from NFC
          // For tap-to-pay, we'd use Web Payment Request API or a payment terminal SDK
          const cardToken = serialNumber || `nfc_${Date.now()}`;

          await processNFCPayment(cardToken);
        });

        ndef.addEventListener('readingerror', () => {
          onError('Error reading card. Please try again.');
        });

        setNfcReader(ndef);
      } catch (err: any) {
        if (err.name === 'NotAllowedError') {
          onError('NFC permission denied. Please enable NFC access.');
        } else if (err.name === 'NotSupportedError') {
          setIsNFCSupported(false);
        } else {
          onError('Failed to start NFC reader');
        }
      }
    };

    startNFCReader();

    return () => {
      // Cleanup NFC reader
      if (nfcReader) {
        // NDEFReader doesn't have a stop method, it's controlled by permissions
      }
    };
  }, [session, isNFCSupported]);

  // Countdown timer
  useEffect(() => {
    if (!session || session.status !== 'WAITING') return;

    const interval = setInterval(() => {
      const expires = new Date(session.expiresAt).getTime();
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expires - now) / 1000));

      setTimeLeft(remaining);

      if (remaining === 0) {
        setSession((prev) => prev ? { ...prev, status: 'FAILED' } : null);
        onError('Session expired. Please try again.');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session, onError]);

  const processNFCPayment = useCallback(async (cardToken: string) => {
    if (!session) return;

    setSession((prev) => prev ? { ...prev, status: 'PROCESSING' } : null);

    try {
      const result = await api.post<{
        success: boolean;
        transactionId?: string;
        error?: string;
        metadata?: { cardLastFour: string; cardBrand: string };
      }>('/payments/nfc/tap', {
        sessionId: session.id,
        cardToken,
        cardLastFour: '****', // Would come from NFC data
        cardBrand: 'UNKNOWN',
      });

      if (result.success) {
        setSession((prev) => prev ? {
          ...prev,
          status: 'COMPLETED',
          cardData: result.metadata ? {
            lastFour: result.metadata.cardLastFour,
            brand: result.metadata.cardBrand,
          } : undefined,
        } : null);

        onSuccess({
          transactionId: result.transactionId || '',
          cardLastFour: result.metadata?.cardLastFour || '****',
        });
      } else {
        setSession((prev) => prev ? { ...prev, status: 'FAILED' } : null);
        onError(result.error || 'Payment failed');
      }
    } catch (err) {
      setSession((prev) => prev ? { ...prev, status: 'FAILED' } : null);
      onError('Payment processing failed');
    }
  }, [session, onSuccess, onError]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount / 100);
  };

  // NFC not supported fallback
  if (isNFCSupported === false) {
    return (
      <div className="p-6 bg-yellow-50 rounded-xl text-center">
        <div className="text-4xl mb-4">📱</div>
        <h3 className="font-semibold text-yellow-800 mb-2">
          NFC Not Available
        </h3>
        <p className="text-yellow-700 text-sm mb-4">
          Your device doesn't support NFC payments. Please select another payment method.
        </p>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
        >
          Choose Another Method
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
      {/* Amount Display */}
      <div className="text-center mb-6">
        <p className="text-gray-500 text-sm">Amount to Pay</p>
        <p className="text-3xl font-bold text-gray-900">
          {formatAmount(amount, currency)}
        </p>
      </div>

      {/* NFC Animation Area */}
      <div className="relative mx-auto w-48 h-48 mb-6">
        {/* Ripple Effect */}
        {session?.status === 'WAITING' && (
          <>
            <div className="absolute inset-0 rounded-full bg-blue-400 opacity-20 animate-ping" />
            <div className="absolute inset-4 rounded-full bg-blue-400 opacity-30 animate-ping animation-delay-200" />
            <div className="absolute inset-8 rounded-full bg-blue-400 opacity-40 animate-ping animation-delay-400" />
          </>
        )}

        {/* Center Icon */}
        <div className={`absolute inset-0 flex items-center justify-center rounded-full ${
          session?.status === 'WAITING' ? 'bg-blue-100' :
          session?.status === 'CARD_DETECTED' ? 'bg-yellow-100' :
          session?.status === 'PROCESSING' ? 'bg-blue-100' :
          session?.status === 'COMPLETED' ? 'bg-green-100' :
          'bg-red-100'
        }`}>
          {session?.status === 'WAITING' && (
            <div className="text-center">
              <div className="text-5xl mb-2">📲</div>
              <p className="text-blue-600 text-sm font-medium">Tap Card Here</p>
            </div>
          )}
          {session?.status === 'CARD_DETECTED' && (
            <div className="text-center">
              <div className="text-5xl mb-2">💳</div>
              <p className="text-yellow-600 text-sm font-medium">Card Detected</p>
            </div>
          )}
          {session?.status === 'PROCESSING' && (
            <div className="text-center">
              <div className="text-5xl mb-2 animate-bounce">⏳</div>
              <p className="text-blue-600 text-sm font-medium">Processing...</p>
            </div>
          )}
          {session?.status === 'COMPLETED' && (
            <div className="text-center">
              <div className="text-5xl mb-2">✅</div>
              <p className="text-green-600 text-sm font-medium">Payment Complete!</p>
            </div>
          )}
          {session?.status === 'FAILED' && (
            <div className="text-center">
              <div className="text-5xl mb-2">❌</div>
              <p className="text-red-600 text-sm font-medium">Payment Failed</p>
            </div>
          )}
        </div>
      </div>

      {/* Status Text */}
      <div className="text-center mb-6">
        {session?.status === 'WAITING' && (
          <>
            <p className="text-gray-700 font-medium">
              Hold card near the back of your phone
            </p>
            <p className="text-gray-500 text-sm mt-1">
              Session expires in {formatTime(timeLeft)}
            </p>
          </>
        )}
        {session?.status === 'CARD_DETECTED' && (
          <p className="text-yellow-700 font-medium">
            Card detected, hold steady...
          </p>
        )}
        {session?.status === 'PROCESSING' && (
          <p className="text-blue-700 font-medium">
            Processing payment...
          </p>
        )}
        {session?.status === 'COMPLETED' && session.cardData && (
          <p className="text-green-700 font-medium">
            Paid with {session.cardData.brand} •••• {session.cardData.lastFour}
          </p>
        )}
      </div>

      {/* Cancel Button */}
      {(session?.status === 'WAITING' || session?.status === 'FAILED') && (
        <button
          onClick={onCancel}
          className="w-full py-3 text-gray-600 hover:text-gray-800 transition-colors"
        >
          {session?.status === 'FAILED' ? 'Try Another Method' : 'Cancel'}
        </button>
      )}
    </div>
  );
}
