'use client';

import { useState } from 'react';

interface BankTransferInstructionsProps {
  reference: string;
  amount: number;
  currency: string;
  bankDetails: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    routingNumber?: string;
    cbu?: string;
    alias?: string;
  };
  expiresAt: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function BankTransferInstructions({
  reference,
  amount,
  currency,
  bankDetails,
  expiresAt,
  onConfirm,
  onCancel,
}: BankTransferInstructionsProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount / 100);
  };

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const expiresDate = new Date(expiresAt);
  const hoursLeft = Math.max(0, Math.ceil((expiresDate.getTime() - Date.now()) / (1000 * 60 * 60)));

  return (
    <div className="p-6 bg-white rounded-xl border border-gray-200">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">🏦</div>
        <h3 className="text-xl font-semibold text-gray-900">Bank Transfer</h3>
        <p className="text-gray-500 text-sm">
          Transfer the exact amount and include the reference code
        </p>
      </div>

      {/* Amount to Transfer */}
      <div className="bg-blue-50 rounded-lg p-4 mb-6 text-center">
        <p className="text-sm text-blue-600 mb-1">Amount to Transfer</p>
        <p className="text-3xl font-bold text-blue-900">
          {formatAmount(amount, currency)}
        </p>
      </div>

      {/* Reference Code - Most Important */}
      <div className="bg-yellow-50 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-yellow-700 font-medium">Reference Code (REQUIRED)</p>
            <p className="text-xl font-mono font-bold text-yellow-900">{reference}</p>
          </div>
          <button
            onClick={() => copyToClipboard(reference, 'reference')}
            className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded-lg text-sm hover:bg-yellow-300"
          >
            {copied === 'reference' ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p className="text-xs text-yellow-600 mt-2">
          ⚠️ Include this code in your transfer description to identify your payment
        </p>
      </div>

      {/* Bank Details */}
      <div className="space-y-3 mb-6">
        <h4 className="font-medium text-gray-700">Bank Details</h4>

        <DetailRow
          label="Bank"
          value={bankDetails.bankName}
          onCopy={() => copyToClipboard(bankDetails.bankName, 'bank')}
          copied={copied === 'bank'}
        />

        <DetailRow
          label="Account Name"
          value={bankDetails.accountName}
          onCopy={() => copyToClipboard(bankDetails.accountName, 'name')}
          copied={copied === 'name'}
        />

        <DetailRow
          label="Account Number"
          value={bankDetails.accountNumber}
          onCopy={() => copyToClipboard(bankDetails.accountNumber, 'account')}
          copied={copied === 'account'}
        />

        {bankDetails.routingNumber && (
          <DetailRow
            label="Routing Number"
            value={bankDetails.routingNumber}
            onCopy={() => copyToClipboard(bankDetails.routingNumber!, 'routing')}
            copied={copied === 'routing'}
          />
        )}

        {bankDetails.cbu && (
          <DetailRow
            label="CBU"
            value={bankDetails.cbu}
            onCopy={() => copyToClipboard(bankDetails.cbu!, 'cbu')}
            copied={copied === 'cbu'}
          />
        )}

        {bankDetails.alias && (
          <DetailRow
            label="Alias"
            value={bankDetails.alias}
            onCopy={() => copyToClipboard(bankDetails.alias!, 'alias')}
            copied={copied === 'alias'}
          />
        )}
      </div>

      {/* Expiration Warning */}
      <div className="bg-gray-50 rounded-lg p-3 mb-6 text-center">
        <p className="text-sm text-gray-600">
          Complete transfer within <span className="font-semibold">{hoursLeft} hours</span>
        </p>
        <p className="text-xs text-gray-500">
          Expires: {expiresDate.toLocaleString()}
        </p>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={onConfirm}
          className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
        >
          I've Made the Transfer
        </button>
        <button
          onClick={onCancel}
          className="w-full py-3 text-gray-600 hover:text-gray-800"
        >
          Choose Another Method
        </button>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  onCopy,
  copied,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100">
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="font-medium text-gray-900">{value}</p>
      </div>
      <button
        onClick={onCopy}
        className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
      >
        {copied ? '✓' : 'Copy'}
      </button>
    </div>
  );
}
