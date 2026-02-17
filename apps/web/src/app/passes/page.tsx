'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

interface DrinkPass {
  id: string;
  code: string;
  status: 'ACTIVE' | 'REDEEMED' | 'EXPIRED' | 'CANCELLED';
  expiresAt: string;
  createdAt: string;
  reward: {
    name: string;
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

export default function PassesPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  
  const [passes, setPasses] = useState<DrinkPass[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'used'>('all');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth?redirect=/passes');
      return;
    }
    loadPasses();
  }, [isAuthenticated]);

  const loadPasses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/rewards/passes');
      setPasses(response.data);
    } catch (err) {
      console.error('Failed to load passes:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPasses = passes.filter(pass => {
    if (filter === 'active') return pass.status === 'ACTIVE';
    if (filter === 'used') return pass.status !== 'ACTIVE';
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-700';
      case 'REDEEMED': return 'bg-gray-100 text-gray-600';
      case 'EXPIRED': return 'bg-red-100 text-red-700';
      case 'CANCELLED': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(user?.language || 'en', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-pink-500 text-white p-6 pb-20">
        <button
          onClick={() => router.push('/')}
          className="mb-4 flex items-center gap-2 opacity-80 hover:opacity-100"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('common.back')}
        </button>
        
        <h1 className="text-2xl font-bold">{t('rewards.my_passes')}</h1>
        <p className="text-sm opacity-80 mt-1">
          {passes.filter(p => p.status === 'ACTIVE').length} {t('rewards.active_passes')}
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 -mt-12">
        <div className="bg-white rounded-xl p-1 flex gap-1 shadow-lg">
          {(['all', 'active', 'used'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                filter === tab
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t(`rewards.filter.${tab}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Passes List */}
      <div className="p-4 space-y-3">
        {filteredPasses.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
            </div>
            <p className="text-gray-500">{t('rewards.no_passes')}</p>
            <button
              onClick={() => router.push('/')}
              className="mt-4 text-indigo-600 font-medium hover:underline"
            >
              {t('rewards.start_quest')}
            </button>
          </div>
        ) : (
          filteredPasses.map((pass) => (
            <button
              key={pass.id}
              onClick={() => router.push(`/redeem?passId=${pass.id}`)}
              className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-left hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                {/* Sponsor Logo */}
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ 
                    backgroundColor: pass.reward.sponsor?.primaryColor 
                      ? `${pass.reward.sponsor.primaryColor}20` 
                      : '#f3f4f6' 
                  }}
                >
                  {pass.reward.sponsor?.logo ? (
                    <img 
                      src={pass.reward.sponsor.logo} 
                      alt={pass.reward.sponsor.name}
                      className="w-8 h-8 object-contain"
                    />
                  ) : (
                    <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  )}
                </div>

                {/* Pass Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {pass.reward.name}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(pass.status)}`}>
                      {t(`rewards.status.${pass.status.toLowerCase()}`)}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-500 truncate">
                    {pass.reward.sponsor?.name} • {pass.venue.name}
                  </p>
                  
                  <p className="text-xs text-gray-400 mt-1">
                    {pass.status === 'ACTIVE' 
                      ? `${t('rewards.expires')} ${formatDate(pass.expiresAt)}`
                      : formatDate(pass.createdAt)
                    }
                  </p>
                </div>

                {/* Arrow */}
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>

              {/* Active Pass Highlight */}
              {pass.status === 'ACTIVE' && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-sm font-mono text-gray-900 tracking-wider">
                    {pass.code.match(/.{1,4}/g)?.join(' ')}
                  </span>
                  <span className="text-xs text-indigo-600 font-medium">
                    {t('rewards.tap_to_view')}
                  </span>
                </div>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
