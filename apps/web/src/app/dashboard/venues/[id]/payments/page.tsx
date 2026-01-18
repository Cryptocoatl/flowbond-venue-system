'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

type PaymentProviderType = 'MERCADO_PAGO' | 'STRIPE' | 'BANK_TRANSFER' | 'NFC';

interface PaymentMethod {
  type: PaymentProviderType;
  enabled: boolean;
  credentials?: Record<string, any>;
}

interface PaymentConfig {
  enabledMethods: PaymentProviderType[];
  defaultMethod?: PaymentProviderType;
  credentials: {
    mercadoPago?: {
      accessToken?: string;
      publicKey?: string;
    };
    stripe?: {
      accountId?: string;
      connected: boolean;
    };
    bankTransfer?: {
      bankName?: string;
      accountName?: string;
      accountNumber?: string;
      routingNumber?: string;
      cbu?: string;
      alias?: string;
    };
    nfc?: {
      terminalId?: string;
    };
  };
}

const PROVIDER_INFO: Record<PaymentProviderType, { name: string; description: string; icon: string }> = {
  MERCADO_PAGO: {
    name: 'Mercado Pago',
    description: 'Accept payments through Mercado Pago (Latin America)',
    icon: '💳',
  },
  STRIPE: {
    name: 'Stripe Connect',
    description: 'Connect your Stripe account to receive payments directly',
    icon: '💎',
  },
  BANK_TRANSFER: {
    name: 'Bank Transfer',
    description: 'Accept manual bank transfers with reference codes',
    icon: '🏦',
  },
  NFC: {
    name: 'Tap to Pay (NFC)',
    description: 'Accept contactless payments using phones as NFC readers',
    icon: '📱',
  },
};

export default function VenuePaymentsPage() {
  const params = useParams();
  const router = useRouter();
  const venueId = params.id as string;

  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeProvider, setActiveProvider] = useState<PaymentProviderType | null>(null);

  useEffect(() => {
    loadConfig();
  }, [venueId]);

  const loadConfig = async () => {
    try {
      const response = await api.get<PaymentConfig>(`/manage/venues/${venueId}/payments/config`);
      setConfig(response);
    } catch (err) {
      setError('Failed to load payment configuration');
    } finally {
      setLoading(false);
    }
  };

  const toggleProvider = async (provider: PaymentProviderType) => {
    if (!config) return;

    const isEnabled = config.enabledMethods.includes(provider);
    const newMethods = isEnabled
      ? config.enabledMethods.filter((m) => m !== provider)
      : [...config.enabledMethods, provider];

    setConfig({ ...config, enabledMethods: newMethods });
  };

  const saveConfig = async () => {
    if (!config) return;

    setSaving(true);
    try {
      await api.put(`/manage/venues/${venueId}/payments/config`, config);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const connectStripe = async () => {
    try {
      const response = await api.post<{ url: string }>(`/manage/venues/${venueId}/payments/stripe/connect`, {
        returnUrl: window.location.href,
      });
      window.location.href = response.url;
    } catch (err: any) {
      setError(err.message || 'Failed to start Stripe connection');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-32 bg-gray-200 rounded" />
          <div className="h-32 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Link href={`/dashboard/venues/${venueId}`} className="text-blue-600 hover:underline text-sm">
          ← Back to Venue
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Payment Settings</h1>
        <p className="text-gray-500">Configure how customers can pay at your venue</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Payment Methods */}
      <div className="space-y-4 mb-8">
        {(Object.keys(PROVIDER_INFO) as PaymentProviderType[]).map((provider) => {
          const info = PROVIDER_INFO[provider];
          const isEnabled = config?.enabledMethods.includes(provider) || false;

          return (
            <div
              key={provider}
              className={`border rounded-xl p-4 transition-all ${
                isEnabled ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{info.icon}</span>
                  <div>
                    <h3 className="font-medium text-gray-900">{info.name}</h3>
                    <p className="text-sm text-gray-500">{info.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveProvider(activeProvider === provider ? null : provider)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {activeProvider === provider ? 'Hide' : 'Configure'}
                  </button>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={() => toggleProvider(provider)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              {/* Provider Configuration Panel */}
              {activeProvider === provider && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  {provider === 'MERCADO_PAGO' && (
                    <MercadoPagoConfig
                      credentials={config?.credentials?.mercadoPago}
                      onChange={(creds) =>
                        setConfig((c) =>
                          c ? { ...c, credentials: { ...c.credentials, mercadoPago: creds } } : null
                        )
                      }
                    />
                  )}
                  {provider === 'STRIPE' && (
                    <StripeConfig
                      credentials={config?.credentials?.stripe}
                      onConnect={connectStripe}
                    />
                  )}
                  {provider === 'BANK_TRANSFER' && (
                    <BankTransferConfig
                      credentials={config?.credentials?.bankTransfer}
                      onChange={(creds) =>
                        setConfig((c) =>
                          c ? { ...c, credentials: { ...c.credentials, bankTransfer: creds } } : null
                        )
                      }
                    />
                  )}
                  {provider === 'NFC' && (
                    <NFCConfig
                      credentials={config?.credentials?.nfc}
                      onChange={(creds) =>
                        setConfig((c) =>
                          c ? { ...c, credentials: { ...c.credentials, nfc: creds } } : null
                        )
                      }
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={saveConfig}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

// Mercado Pago Configuration
function MercadoPagoConfig({
  credentials,
  onChange,
}: {
  credentials?: { accessToken?: string; publicKey?: string };
  onChange: (creds: { accessToken?: string; publicKey?: string }) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Enter your Mercado Pago API credentials. Get them from{' '}
        <a
          href="https://www.mercadopago.com/developers"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          Mercado Pago Developers
        </a>
      </p>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Access Token</label>
        <input
          type="password"
          value={credentials?.accessToken || ''}
          onChange={(e) => onChange({ ...credentials, accessToken: e.target.value })}
          placeholder="APP_USR-..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Public Key</label>
        <input
          type="text"
          value={credentials?.publicKey || ''}
          onChange={(e) => onChange({ ...credentials, publicKey: e.target.value })}
          placeholder="APP_USR-..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>
  );
}

// Stripe Configuration
function StripeConfig({
  credentials,
  onConnect,
}: {
  credentials?: { accountId?: string; connected: boolean };
  onConnect: () => void;
}) {
  if (credentials?.connected) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-green-600">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span className="font-medium">Stripe Connected</span>
        </div>
        <p className="text-sm text-gray-600">
          Account ID: <code className="bg-gray-100 px-2 py-1 rounded">{credentials.accountId}</code>
        </p>
        <p className="text-sm text-gray-500">
          Payments will go directly to your Stripe account with a 2% platform fee.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Connect your Stripe account to receive payments directly. You'll earn more with lower fees.
      </p>
      <button
        onClick={onConnect}
        className="px-4 py-2 bg-[#635BFF] text-white rounded-lg font-medium hover:bg-[#5851db] flex items-center gap-2"
      >
        <svg className="w-5 h-5" viewBox="0 0 32 32" fill="currentColor">
          <path d="M14.5 6.5h3v19h-3z" />
        </svg>
        Connect with Stripe
      </button>
    </div>
  );
}

// Bank Transfer Configuration
function BankTransferConfig({
  credentials,
  onChange,
}: {
  credentials?: {
    bankName?: string;
    accountName?: string;
    accountNumber?: string;
    routingNumber?: string;
    cbu?: string;
    alias?: string;
  };
  onChange: (creds: typeof credentials) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Enter your bank details. Customers will see these when they choose bank transfer.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
          <input
            type="text"
            value={credentials?.bankName || ''}
            onChange={(e) => onChange({ ...credentials, bankName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
          <input
            type="text"
            value={credentials?.accountName || ''}
            onChange={(e) => onChange({ ...credentials, accountName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
          <input
            type="text"
            value={credentials?.accountNumber || ''}
            onChange={(e) => onChange({ ...credentials, accountNumber: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Routing Number</label>
          <input
            type="text"
            value={credentials?.routingNumber || ''}
            onChange={(e) => onChange({ ...credentials, routingNumber: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">CBU (Argentina)</label>
          <input
            type="text"
            value={credentials?.cbu || ''}
            onChange={(e) => onChange({ ...credentials, cbu: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Alias (Argentina)</label>
          <input
            type="text"
            value={credentials?.alias || ''}
            onChange={(e) => onChange({ ...credentials, alias: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}

// NFC Configuration
function NFCConfig({
  credentials,
  onChange,
}: {
  credentials?: { terminalId?: string };
  onChange: (creds: typeof credentials) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Enable tap-to-pay using any phone with NFC capabilities as a payment terminal.
      </p>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Terminal ID (Optional)</label>
        <input
          type="text"
          value={credentials?.terminalId || ''}
          onChange={(e) => onChange({ ...credentials, terminalId: e.target.value })}
          placeholder="For tracking purposes"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">How it works</h4>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Customer chooses "Tap to Pay" at checkout</li>
          <li>Staff opens the payment screen on their phone</li>
          <li>Customer taps their card on the staff's phone</li>
          <li>Payment is processed instantly</li>
        </ol>
      </div>
    </div>
  );
}
