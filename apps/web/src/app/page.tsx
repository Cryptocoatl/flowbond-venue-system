'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, Globe, ChevronRight, Sparkles } from 'lucide-react';
import { useTranslation, LANGUAGES, type Language } from '@/lib/i18n';
import { useAuthStore } from '@/lib/auth';
import { cn } from '@/lib/utils';

export default function HomePage() {
  const router = useRouter();
  const { t, language, setLanguage } = useTranslation();
  const { isAuthenticated, loginAsGuest, isLoading } = useAuthStore();
  const [showLanguageSelector, setShowLanguageSelector] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(language);

  useEffect(() => {
    // If already authenticated, redirect to scan page
    if (isAuthenticated) {
      router.push('/scan');
    }
  }, [isAuthenticated, router]);

  const handleLanguageSelect = (lang: Language) => {
    setSelectedLanguage(lang);
    setLanguage(lang);
  };

  const handleContinue = async () => {
    setShowLanguageSelector(false);
  };

  const handleGuestContinue = async () => {
    try {
      await loginAsGuest(selectedLanguage);
      router.push('/scan');
    } catch (error) {
      console.error('Guest login failed:', error);
    }
  };

  const handleSignIn = () => {
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-900 via-primary-800 to-primary-900 flex flex-col">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-64 h-64 bg-accent-500/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-primary-400/20 rounded-full blur-3xl animate-pulse-slow delay-1000" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10">
        <AnimatePresence mode="wait">
          {showLanguageSelector ? (
            <motion.div
              key="language"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-sm"
            >
              {/* Logo */}
              <motion.div
                className="text-center mb-12"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm mb-4">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">FlowBond × DANZ</h1>
                <p className="text-primary-200">{t('onboarding.welcome')}</p>
              </motion.div>

              {/* Language selector */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-center gap-2 text-primary-200 mb-4">
                  <Globe className="w-4 h-4" />
                  <span className="text-sm">{t('onboarding.selectLanguage')}</span>
                </div>

                <div className="space-y-2">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageSelect(lang.code)}
                      className={cn(
                        'w-full p-4 rounded-xl text-left transition-all duration-200',
                        'border-2',
                        selectedLanguage === lang.code
                          ? 'bg-white/20 border-white/40 text-white'
                          : 'bg-white/5 border-white/10 text-primary-100 hover:bg-white/10'
                      )}
                    >
                      <span className="font-medium">{lang.nativeName}</span>
                      <span className="text-primary-300 ml-2">({lang.name})</span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleContinue}
                  className="w-full mt-6 btn-primary btn-lg flex items-center justify-center gap-2"
                >
                  {t('common.next')}
                  <ChevronRight className="w-5 h-5" />
                </button>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="action"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-sm"
            >
              {/* Logo */}
              <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm mb-4">
                  <QrCode className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">FlowBond × DANZ</h1>
                <p className="text-primary-200">{t('scan.instruction')}</p>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={handleGuestContinue}
                  disabled={isLoading}
                  className="w-full btn-primary btn-lg flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <QrCode className="w-5 h-5" />
                      {t('onboarding.continueAsGuest')}
                    </>
                  )}
                </button>

                <p className="text-center text-primary-300 text-sm">
                  {t('onboarding.guestNote')}
                </p>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/20" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-primary-900 text-primary-300">or</span>
                  </div>
                </div>

                <button
                  onClick={handleSignIn}
                  className="w-full btn-ghost btn-lg text-white border border-white/20 hover:bg-white/10"
                >
                  {t('onboarding.signIn')}
                </button>
              </div>

              {/* Change language button */}
              <button
                onClick={() => setShowLanguageSelector(true)}
                className="mt-8 mx-auto flex items-center gap-2 text-primary-300 hover:text-white transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span className="text-sm">
                  {LANGUAGES.find((l) => l.code === selectedLanguage)?.nativeName}
                </span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="pb-8 text-center relative z-10">
        <p className="text-primary-400 text-xs">
          Powered by FlowBond Technology
        </p>
      </div>
    </div>
  );
}
