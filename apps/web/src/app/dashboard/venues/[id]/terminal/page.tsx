'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

interface PendingOrder {
  id: string;
  orderNumber: string;
  totalAmount: number;
  items: Array<{
    id: string;
    menuItem: {
      name: string;
    };
    quantity: number;
    unitPrice: number;
  }>;
  user?: {
    name?: string;
  };
  createdAt: string;
}

type TerminalState = 'IDLE' | 'ORDER_SELECTED' | 'WAITING_TAP' | 'PROCESSING' | 'SUCCESS' | 'FAILED';

export default function NFCTerminalPage() {
  const params = useParams();
  const venueId = params.id as string;

  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<PendingOrder | null>(null);
  const [state, setState] = useState<TerminalState>('IDLE');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isNFCSupported, setIsNFCSupported] = useState<boolean | null>(null);
  const [result, setResult] = useState<{ cardLastFour: string; transactionId: string } | null>(null);

  // Check NFC support
  useEffect(() => {
    setIsNFCSupported('NDEFReader' in window);
  }, []);

  // Load pending orders
  useEffect(() => {
    const loadOrders = async () => {
      try {
        const response = await api.get<PendingOrder[]>(`/manage/venues/${venueId}/orders?status=PENDING_PAYMENT`);
        setOrders(response);
      } catch (err) {
        console.error('Failed to load orders', err);
      }
    };

    loadOrders();
    const interval = setInterval(loadOrders, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [venueId]);

  const selectOrder = (order: PendingOrder) => {
    setSelectedOrder(order);
    setState('ORDER_SELECTED');
    setError(null);
    setResult(null);
  };

  const startNFCPayment = async () => {
    if (!selectedOrder) return;

    setState('WAITING_TAP');

    try {
      // Create NFC session
      const response = await api.post<{ id: string; metadata: any }>('/payments/nfc/session', {
        orderId: selectedOrder.id,
        venueId,
      });

      setSessionId(response.id);

      // Start NFC reader
      // @ts-ignore
      const ndef = new window.NDEFReader();
      await ndef.scan();

      ndef.addEventListener('reading', async ({ serialNumber }: any) => {
        setState('PROCESSING');

        try {
          const paymentResult = await api.post<{
            success: boolean;
            transactionId?: string;
            error?: string;
            metadata?: { cardLastFour: string; cardBrand: string };
          }>('/payments/nfc/tap', {
            sessionId: response.id,
            cardToken: serialNumber || `nfc_${Date.now()}`,
            cardLastFour: '****',
            cardBrand: 'CARD',
          });

          if (paymentResult.success) {
            setState('SUCCESS');
            setResult({
              cardLastFour: paymentResult.metadata?.cardLastFour || '****',
              transactionId: paymentResult.transactionId || '',
            });

            // Remove from list
            setOrders((prev) => prev.filter((o) => o.id !== selectedOrder.id));
          } else {
            setState('FAILED');
            setError(paymentResult.error || 'Payment failed');
          }
        } catch (err: any) {
          setState('FAILED');
          setError(err.message || 'Payment processing failed');
        }
      });

      ndef.addEventListener('readingerror', () => {
        setState('FAILED');
        setError('Error reading card. Please try again.');
      });
    } catch (err: any) {
      setState('FAILED');
      if (err.name === 'NotAllowedError') {
        setError('NFC permission denied. Please enable NFC in your browser settings.');
      } else {
        setError(err.message || 'Failed to start NFC reader');
      }
    }
  };

  const reset = () => {
    setSelectedOrder(null);
    setState('IDLE');
    setSessionId(null);
    setError(null);
    setResult(null);
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  // NFC not supported
  if (isNFCSupported === false) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">📵</div>
          <h1 className="text-2xl font-bold mb-4">NFC Not Available</h1>
          <p className="text-gray-400 mb-6">
            This device doesn't support NFC or Web NFC is not enabled. Please use a compatible Android device with Chrome.
          </p>
          <Link
            href={`/dashboard/venues/${venueId}`}
            className="text-blue-400 hover:underline"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 p-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">NFC Terminal</h1>
          <p className="text-gray-400 text-sm">Tap to Pay</p>
        </div>
        <Link
          href={`/dashboard/venues/${venueId}`}
          className="text-gray-400 hover:text-white"
        >
          Exit
        </Link>
      </header>

      {/* Main Content */}
      <div className="p-4">
        {/* IDLE State - Show Orders */}
        {state === 'IDLE' && (
          <div>
            <h2 className="text-lg font-medium mb-4">
              Pending Orders ({orders.length})
            </h2>
            {orders.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-4">📋</div>
                <p>No pending orders</p>
                <p className="text-sm">Orders will appear here when customers checkout</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => selectOrder(order)}
                    className="w-full bg-gray-800 rounded-xl p-4 text-left hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-mono font-bold text-lg">{order.orderNumber}</p>
                        {order.user?.name && (
                          <p className="text-gray-400 text-sm">{order.user.name}</p>
                        )}
                      </div>
                      <p className="text-xl font-bold text-green-400">
                        {formatAmount(order.totalAmount)}
                      </p>
                    </div>
                    <div className="text-gray-400 text-sm">
                      {order.items.map((item) => (
                        <span key={item.id} className="mr-2">
                          {item.quantity}× {item.menuItem.name}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ORDER_SELECTED State */}
        {state === 'ORDER_SELECTED' && selectedOrder && (
          <div className="max-w-md mx-auto">
            <div className="bg-gray-800 rounded-xl p-6 mb-6">
              <div className="text-center mb-6">
                <p className="text-gray-400">Order</p>
                <p className="text-2xl font-mono font-bold">{selectedOrder.orderNumber}</p>
              </div>

              <div className="space-y-2 mb-6">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-400">
                      {item.quantity}× {item.menuItem.name}
                    </span>
                    <span>{formatAmount(item.unitPrice * item.quantity)}</span>
                  </div>
                ))}
                <div className="border-t border-gray-700 pt-2 mt-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-green-400">
                      {formatAmount(selectedOrder.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={startNFCPayment}
                className="w-full py-4 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 transition-colors"
              >
                Start NFC Payment
              </button>
            </div>

            <button
              onClick={reset}
              className="w-full py-3 text-gray-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
        )}

        {/* WAITING_TAP State */}
        {state === 'WAITING_TAP' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="relative w-48 h-48 mb-8">
              {/* Animated ripples */}
              <div className="absolute inset-0 rounded-full bg-green-500 opacity-20 animate-ping" />
              <div className="absolute inset-4 rounded-full bg-green-500 opacity-30 animate-ping animation-delay-200" />
              <div className="absolute inset-8 rounded-full bg-green-500 opacity-40 animate-ping animation-delay-400" />

              <div className="absolute inset-0 flex items-center justify-center bg-green-900 rounded-full">
                <div className="text-center">
                  <div className="text-6xl mb-2">💳</div>
                  <p className="text-green-400 font-bold">TAP CARD</p>
                </div>
              </div>
            </div>

            <p className="text-2xl font-bold text-white mb-2">
              {formatAmount(selectedOrder?.totalAmount || 0)}
            </p>
            <p className="text-gray-400 mb-8">
              Hold customer's card to the back of this device
            </p>

            <button
              onClick={reset}
              className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        )}

        {/* PROCESSING State */}
        {state === 'PROCESSING' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-24 h-24 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-8" />
            <p className="text-xl font-bold text-white mb-2">Processing Payment</p>
            <p className="text-gray-400">Please wait...</p>
          </div>
        )}

        {/* SUCCESS State */}
        {state === 'SUCCESS' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-32 h-32 bg-green-900 rounded-full flex items-center justify-center mb-8">
              <svg className="w-16 h-16 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <p className="text-2xl font-bold text-green-400 mb-2">Payment Complete!</p>
            <p className="text-gray-400 mb-2">
              {formatAmount(selectedOrder?.totalAmount || 0)} charged
            </p>
            {result && (
              <p className="text-gray-500 text-sm mb-8">
                Card ending in {result.cardLastFour}
              </p>
            )}
            <button
              onClick={reset}
              className="px-8 py-4 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700"
            >
              Next Order
            </button>
          </div>
        )}

        {/* FAILED State */}
        {state === 'FAILED' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-32 h-32 bg-red-900 rounded-full flex items-center justify-center mb-8">
              <svg className="w-16 h-16 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <p className="text-2xl font-bold text-red-400 mb-2">Payment Failed</p>
            <p className="text-gray-400 mb-8">{error || 'Unknown error'}</p>
            <div className="flex gap-4">
              <button
                onClick={() => setState('ORDER_SELECTED')}
                className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
              >
                Try Again
              </button>
              <button
                onClick={reset}
                className="px-6 py-3 bg-red-700 text-white rounded-lg hover:bg-red-600"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
