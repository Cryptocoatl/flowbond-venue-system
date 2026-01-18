'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

type PaymentMethod = {
  type: 'MERCADO_PAGO' | 'STRIPE' | 'BANK_TRANSFER' | 'NFC';
  name: string;
  description: string;
  enabled: boolean;
  icon: string;
};

interface PaymentMethodSelectorProps {
  venueId: string;
  onSelect: (method: PaymentMethod['type']) => void;
  selectedMethod?: PaymentMethod['type'];
}

const METHOD_ICONS: Record<PaymentMethod['type'], string> = {
  MERCADO_PAGO: '💳',
  STRIPE: '💎',
  BANK_TRANSFER: '🏦',
  NFC: '📱',
};

const METHOD_NAMES: Record<PaymentMethod['type'], string> = {
  MERCADO_PAGO: 'Mercado Pago',
  STRIPE: 'Credit/Debit Card',
  BANK_TRANSFER: 'Bank Transfer',
  NFC: 'Tap to Pay',
};

const METHOD_DESCRIPTIONS: Record<PaymentMethod['type'], string> = {
  MERCADO_PAGO: 'Pay securely with Mercado Pago',
  STRIPE: 'Pay with your credit or debit card',
  BANK_TRANSFER: 'Manual bank transfer with reference',
  NFC: 'Tap your card on the device',
};

export function PaymentMethodSelector({
  venueId,
  onSelect,
  selectedMethod,
}: PaymentMethodSelectorProps) {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMethods() {
      try {
        const response = await api.get<PaymentMethod[]>(`/payments/methods/${venueId}`);
        setMethods(response.filter((m) => m.enabled));
      } catch (err) {
        setError('Failed to load payment methods');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadMethods();
  }, [venueId]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg">
        {error}
      </div>
    );
  }

  if (methods.length === 0) {
    return (
      <div className="p-4 bg-yellow-50 text-yellow-700 rounded-lg">
        No payment methods available for this venue
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-medium text-gray-900">Select Payment Method</h3>
      {methods.map((method) => (
        <button
          key={method.type}
          onClick={() => onSelect(method.type)}
          className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
            selectedMethod === method.type
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-4">
            <span className="text-2xl">
              {METHOD_ICONS[method.type] || '💳'}
            </span>
            <div>
              <p className="font-medium text-gray-900">
                {METHOD_NAMES[method.type] || method.name}
              </p>
              <p className="text-sm text-gray-500">
                {METHOD_DESCRIPTIONS[method.type] || method.description}
              </p>
            </div>
            {selectedMethod === method.type && (
              <div className="ml-auto">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
