'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

interface VerifyResult {
  isValid: boolean;
  reason?: string;
  drinkPass?: {
    id: string;
    code: string;
    status: string;
    expiresAt: string;
  };
  user?: {
    id: string;
    email: string;
  };
  reward?: {
    name: string;
    description: string;
    sponsor: string;
  };
}

export default function StaffPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  
  const [code, setCode] = useState('');
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [recentRedemptions, setRecentRedemptions] = useState<any[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth?redirect=/staff');
      return;
    }
    
    if (user && !user.isStaff && !user.isAdmin) {
      router.push('/');
      return;
    }
  }, [isAuthenticated, user, router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setError('');
    setSuccess('');
    setVerifyResult(null);
    setLoading(true);

    try {
      const cleanCode = code.replace(/\s/g, '').toUpperCase();
      const result = await api.verifyPass(cleanCode);
      setVerifyResult(result);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError(t('staff.code_not_found'));
      } else {
        setError(err.response?.data?.message || t('staff.verify_error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async () => {
    if (!verifyResult?.drinkPass) return;

    setRedeeming(true);
    setError('');

    try {
      await api.redeemPass(verifyResult.drinkPass.id);
      setSuccess(t('staff.redeem_success'));
      setRecentRedemptions(prev => [{
        code: verifyResult.drinkPass!.code,
        reward: verifyResult.reward?.name,
        time: new Date().toLocaleTimeString(),
      }, ...prev.slice(0, 9)]);
      setVerifyResult(null);
      setCode('');
    } catch (err: any) {
      setError(err.response?.data?.message || t('staff.redeem_error'));
    } finally {
      setRedeeming(false);
    }
  };

  const getReasonText = (reason: string) => {
    switch (reason) {
      case 'EXPIRED': return t('staff.reason_expired');
      case 'REDEEMED': return t('staff.reason_redeemed');
      case 'CANCELLED': return t('staff.reason_cancelled');
      default: return reason;
    }
  };

  if (!user?.isStaff && !user?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">{t('staff.unauthorized')}</h1>
          <button onClick={() => router.push('/')} className="text-indigo-600 hover:underline">
            {t('common.go_home')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{t('staff.title')}</h1>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Code Input */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">{t('staff.enter_code')}</h2>
          
          <form onSubmit={handleVerify} className="space-y-4">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABCD 1234"
              className="w-full px-4 py-4 text-2xl font-mono text-center tracking-widest border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              maxLength={10}
              autoFocus
            />
            
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="w-full py-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('common.loading') : t('staff.verify')}
            </button>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-700 flex items-center gap-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {success}
          </div>
        )}

        {/* Verify Result */}
        {verifyResult && (
          <div className={`bg-white rounded-xl shadow-sm overflow-hidden ${
            verifyResult.isValid ? 'ring-2 ring-green-500' : 'ring-2 ring-red-500'
          }`}>
            {/* Status Banner */}
            <div className={`p-4 ${verifyResult.isValid ? 'bg-green-500' : 'bg-red-500'} text-white`}>
              <div className="flex items-center gap-3">
                {verifyResult.isValid ? (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <div>
                  <p className="text-lg font-bold">
                    {verifyResult.isValid ? t('staff.valid') : t('staff.invalid')}
                  </p>
                  {!verifyResult.isValid && verifyResult.reason && (
                    <p className="text-sm opacity-90">{getReasonText(verifyResult.reason)}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Pass Details */}
            <div className="p-6 space-y-4">
              {verifyResult.reward && (
                <div>
                  <p className="text-sm text-gray-500">{t('staff.reward')}</p>
                  <p className="text-xl font-semibold text-gray-900">{verifyResult.reward.name}</p>
                  <p className="text-sm text-gray-600">{verifyResult.reward.sponsor}</p>
                </div>
              )}

              {verifyResult.user && (
                <div>
                  <p className="text-sm text-gray-500">{t('staff.customer')}</p>
                  <p className="font-medium text-gray-900">{verifyResult.user.email || 'Guest User'}</p>
                </div>
              )}

              {verifyResult.drinkPass && (
                <div>
                  <p className="text-sm text-gray-500">{t('staff.expires')}</p>
                  <p className="font-medium text-gray-900">
                    {new Date(verifyResult.drinkPass.expiresAt).toLocaleString()}
                  </p>
                </div>
              )}

              {/* Redeem Button */}
              {verifyResult.isValid && (
                <button
                  onClick={handleRedeem}
                  disabled={redeeming}
                  className="w-full py-4 bg-green-600 text-white text-lg font-bold rounded-xl hover:bg-green-700 disabled:opacity-50 mt-4"
                >
                  {redeeming ? t('common.loading') : t('staff.redeem_now')}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Recent Redemptions */}
        {recentRedemptions.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">{t('staff.recent')}</h3>
            <div className="space-y-2">
              {recentRedemptions.map((r, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-mono text-sm text-gray-900">{r.code}</p>
                    <p className="text-xs text-gray-500">{r.reward}</p>
                  </div>
                  <p className="text-sm text-gray-500">{r.time}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <p className="text-3xl font-bold text-indigo-600">{recentRedemptions.length}</p>
            <p className="text-sm text-gray-500">{t('staff.session_redemptions')}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <p className="text-3xl font-bold text-green-600">✓</p>
            <p className="text-sm text-gray-500">{t('staff.status_online')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
