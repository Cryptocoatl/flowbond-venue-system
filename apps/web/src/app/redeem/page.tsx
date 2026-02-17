'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

interface DrinkPass {
  id: string;
  code: string;
  status: 'ACTIVE' | 'REDEEMED' | 'EXPIRED' | 'CANCELLED';
  expiresAt: string;
  reward: {
    name: string;
    description: string;
    sponsor: {
      name: string;
      logo: string;
      primaryColor: string;
    };
  };
  venue: {
    name: string;
  };
}

export default function RedeemPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  
  const questId = searchParams.get('questId');
  const passId = searchParams.get('passId');
  
  const [drinkPass, setDrinkPass] = useState<DrinkPass | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState('');
  const [showCode, setShowCode] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth?redirect=' + encodeURIComponent(window.location.pathname + window.location.search));
      return;
    }

    if (passId) {
      loadExistingPass();
    } else if (questId) {
      claimReward();
    } else {
      router.push('/passes');
    }
  }, [isAuthenticated, questId, passId]);

  const loadExistingPass = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/rewards/passes/${passId}`);
      setDrinkPass(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load drink pass');
    } finally {
      setLoading(false);
    }
  };

  const claimReward = async () => {
    try {
      setClaiming(true);
      setLoading(true);
      
      // Get venue from localStorage or use default
      const venueId = localStorage.getItem('currentVenueId');
      
      const response = await api.post('/rewards/claim', {
        questId,
        venueId,
      });
      
      setDrinkPass(response.data.drinkPass);
    } catch (err: any) {
      if (err.response?.status === 409) {
        // Already claimed - redirect to passes
        router.push('/passes');
      } else {
        setError(err.response?.data?.message || 'Failed to claim reward');
      }
    } finally {
      setClaiming(false);
      setLoading(false);
    }
  };

  const cancelPass = async () => {
    if (!drinkPass || !confirm(t('rewards.cancel_confirm'))) return;
    
    try {
      await api.post(`/rewards/cancel/${drinkPass.id}`);
      router.push('/passes');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to cancel pass');
    }
  };

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return t('rewards.expired');
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${t('rewards.remaining')}`;
    }
    return `${minutes}m ${t('rewards.remaining')}`;
  };

  const formatCode = (code: string) => {
    // Add spaces for readability: ABCD1234 -> ABCD 1234
    return code.match(/.{1,4}/g)?.join(' ') || code;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-600 to-pink-500 p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mb-4"></div>
        <p className="text-white text-lg">
          {claiming ? t('rewards.claiming') : t('common.loading')}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-xl">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">{t('errors.something_wrong')}</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700"
          >
            {t('common.go_home')}
          </button>
        </div>
      </div>
    );
  }

  if (!drinkPass) {
    return null;
  }

  const isActive = drinkPass.status === 'ACTIVE';
  const isRedeemed = drinkPass.status === 'REDEEMED';
  const isExpired = drinkPass.status === 'EXPIRED' || new Date(drinkPass.expiresAt) < new Date();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-pink-500 p-4">
      <div className="max-w-md mx-auto pt-8">
        {/* Back Button */}
        <button
          onClick={() => router.push('/passes')}
          className="mb-6 flex items-center gap-2 text-white/80 hover:text-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('rewards.my_passes')}
        </button>

        {/* Drink Pass Card */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-2xl">
          {/* Header */}
          <div 
            className="p-6 text-white text-center"
            style={{ 
              background: drinkPass.reward.sponsor?.primaryColor 
                ? `linear-gradient(135deg, ${drinkPass.reward.sponsor.primaryColor} 0%, #ec4899 100%)`
                : 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)' 
            }}
          >
            {drinkPass.reward.sponsor?.logo && (
              <img 
                src={drinkPass.reward.sponsor.logo} 
                alt={drinkPass.reward.sponsor.name}
                className="w-16 h-16 rounded-xl bg-white p-2 mx-auto mb-4"
              />
            )}
            <h1 className="text-2xl font-bold mb-1">{drinkPass.reward.name}</h1>
            <p className="text-sm opacity-90">{drinkPass.reward.sponsor?.name}</p>
          </div>

          {/* Status Badge */}
          <div className="flex justify-center -mt-4">
            <div className={`px-6 py-2 rounded-full font-semibold text-sm ${
              isActive ? 'bg-green-500 text-white' :
              isRedeemed ? 'bg-gray-500 text-white' :
              'bg-red-500 text-white'
            }`}>
              {isActive ? t('rewards.status.active') :
               isRedeemed ? t('rewards.status.redeemed') :
               t('rewards.status.expired')}
            </div>
          </div>

          {/* Code Display */}
          <div className="p-6">
            {isActive && (
              <>
                <p className="text-center text-gray-600 mb-4">
                  {t('rewards.show_to_staff')}
                </p>
                
                <button
                  onClick={() => setShowCode(!showCode)}
                  className="w-full py-6 bg-gray-100 rounded-2xl mb-4 transition-all hover:bg-gray-200"
                >
                  {showCode ? (
                    <span className="text-4xl font-mono font-bold tracking-wider text-gray-900">
                      {formatCode(drinkPass.code)}
                    </span>
                  ) : (
                    <span className="text-lg text-gray-500">
                      {t('rewards.tap_to_reveal')}
                    </span>
                  )}
                </button>

                {/* Timer */}
                <div className="flex items-center justify-center gap-2 text-amber-600 mb-6">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">{formatTimeRemaining(drinkPass.expiresAt)}</span>
                </div>
              </>
            )}

            {isRedeemed && (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-gray-600">{t('rewards.already_redeemed')}</p>
              </div>
            )}

            {isExpired && !isRedeemed && (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-600">{t('rewards.pass_expired')}</p>
              </div>
            )}

            {/* Venue Info */}
            <div className="pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500 text-center">
                {t('rewards.valid_at')} <span className="font-medium text-gray-700">{drinkPass.venue.name}</span>
              </p>
            </div>
          </div>

          {/* Actions */}
          {isActive && (
            <div className="px-6 pb-6">
              <button
                onClick={cancelPass}
                className="w-full py-3 text-red-600 border border-red-200 rounded-xl hover:bg-red-50"
              >
                {t('rewards.cancel_pass')}
              </button>
            </div>
          )}
        </div>

        {/* Instructions */}
        {isActive && (
          <div className="mt-6 bg-white/10 backdrop-blur rounded-xl p-4 text-white">
            <h3 className="font-semibold mb-2">{t('rewards.how_to_redeem')}</h3>
            <ol className="text-sm space-y-2 opacity-90">
              <li>1. {t('rewards.step_1')}</li>
              <li>2. {t('rewards.step_2')}</li>
              <li>3. {t('rewards.step_3')}</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
