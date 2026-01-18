'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QrCode,
  MapPin,
  Search,
  ChevronRight,
  Sparkles,
  User,
  LogIn,
  Globe
} from 'lucide-react';
import { useTranslation, LANGUAGES, type Language } from '@/lib/i18n';
import { useAuthStore } from '@/lib/auth';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

interface Venue {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  city: string | null;
}

export default function V3nPage() {
  const router = useRouter();
  const { t, language, setLanguage } = useTranslation();
  const { isAuthenticated, user, loginAsGuest, isLoading } = useAuthStore();

  const [step, setStep] = useState<'welcome' | 'auth' | 'venues'>('welcome');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingVenues, setLoadingVenues] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(language);

  // Fetch venues
  useEffect(() => {
    if (step === 'venues') {
      fetchVenues();
    }
  }, [step]);

  const fetchVenues = async () => {
    setLoadingVenues(true);
    try {
      const data = await api.getVenues();
      setVenues(data);
    } catch (error) {
      console.error('Failed to fetch venues:', error);
    } finally {
      setLoadingVenues(false);
    }
  };

  const handleLanguageSelect = (lang: Language) => {
    setSelectedLanguage(lang);
    setLanguage(lang);
  };

  const handleContinueAsGuest = async () => {
    try {
      await loginAsGuest(selectedLanguage);
      setStep('venues');
    } catch (error) {
      console.error('Guest login failed:', error);
    }
  };

  const handleSignIn = () => {
    router.push('/auth?redirect=/v3n');
  };

  const handleVenueSelect = (venue: Venue) => {
    router.push(`/v3n/${venue.slug}`);
  };

  const filteredVenues = venues.filter(venue =>
    venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    venue.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-900 via-primary-800 to-primary-900">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-64 h-64 bg-accent-500/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-primary-400/20 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-white" />
            <span className="text-white font-bold">FlowBond</span>
          </div>
          {isAuthenticated && (
            <button
              onClick={() => router.push('/profile')}
              className="p-2 rounded-full bg-white/10 text-white"
            >
              <User className="w-5 h-5" />
            </button>
          )}
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center p-6">
          <AnimatePresence mode="wait">
            {step === 'welcome' && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full max-w-sm text-center"
              >
                {/* Logo */}
                <div className="mb-8">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-sm mb-6">
                    <QrCode className="w-12 h-12 text-white" />
                  </div>
                  <h1 className="text-4xl font-bold text-white mb-3">FlowBond</h1>
                  <p className="text-primary-200 text-lg">Scan. Quest. Earn Rewards.</p>
                </div>

                {/* Language Selector */}
                <div className="mb-8">
                  <div className="flex items-center justify-center gap-2 text-primary-300 mb-4">
                    <Globe className="w-4 h-4" />
                    <span className="text-sm">Select Language</span>
                  </div>
                  <div className="flex justify-center gap-2">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => handleLanguageSelect(lang.code)}
                        className={cn(
                          'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                          selectedLanguage === lang.code
                            ? 'bg-white text-primary-900'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        )}
                      >
                        {lang.nativeName}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <button
                    onClick={() => setStep('auth')}
                    className="w-full py-4 bg-white text-primary-900 font-semibold rounded-2xl hover:bg-white/90 transition-all flex items-center justify-center gap-2"
                  >
                    Get Started
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'auth' && (
              <motion.div
                key="auth"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full max-w-sm"
              >
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-white mb-2">How would you like to continue?</h2>
                  <p className="text-primary-200">Choose an option to get started</p>
                </div>

                <div className="space-y-4">
                  {/* Guest Continue */}
                  <button
                    onClick={handleContinueAsGuest}
                    disabled={isLoading}
                    className="w-full p-4 bg-white text-primary-900 font-semibold rounded-2xl hover:bg-white/90 transition-all flex items-center justify-center gap-3"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-primary-300 border-t-primary-900 rounded-full animate-spin" />
                    ) : (
                      <>
                        <QrCode className="w-5 h-5" />
                        Continue as Guest
                      </>
                    )}
                  </button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/20" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="px-4 bg-primary-800 text-primary-300 text-sm">or</span>
                    </div>
                  </div>

                  {/* Sign In */}
                  <button
                    onClick={handleSignIn}
                    className="w-full p-4 border-2 border-white/30 text-white font-semibold rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center gap-3"
                  >
                    <LogIn className="w-5 h-5" />
                    Sign In / Register
                  </button>
                </div>

                <p className="text-center text-primary-300 text-sm mt-6">
                  Guest accounts can complete quests and earn rewards.
                  <br />Sign in to save your progress across devices.
                </p>

                <button
                  onClick={() => setStep('welcome')}
                  className="mt-6 mx-auto flex items-center gap-2 text-primary-300 hover:text-white transition-colors"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                  Back
                </button>
              </motion.div>
            )}

            {step === 'venues' && (
              <motion.div
                key="venues"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full max-w-md"
              >
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">Find Your Venue</h2>
                  <p className="text-primary-200">Select a venue to start your quest</p>
                </div>

                {/* Search */}
                <div className="relative mb-6">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-400" />
                  <input
                    type="text"
                    placeholder="Search venues..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-white/30"
                  />
                </div>

                {/* Venue List */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {loadingVenues ? (
                    <div className="flex justify-center py-8">
                      <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                  ) : filteredVenues.length > 0 ? (
                    filteredVenues.map((venue) => (
                      <button
                        key={venue.id}
                        onClick={() => handleVenueSelect(venue)}
                        className="w-full p-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-left transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-white font-semibold">{venue.name}</h3>
                            {venue.city && (
                              <div className="flex items-center gap-1 text-primary-300 text-sm mt-1">
                                <MapPin className="w-3 h-3" />
                                {venue.city}
                              </div>
                            )}
                          </div>
                          <ChevronRight className="w-5 h-5 text-primary-400 group-hover:text-white transition-colors" />
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-8 text-primary-300">
                      <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No venues found</p>
                    </div>
                  )}
                </div>

                {/* Manual QR Entry */}
                <div className="mt-6 pt-6 border-t border-white/10">
                  <button
                    onClick={() => router.push('/scan')}
                    className="w-full p-4 border border-white/30 text-white rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                  >
                    <QrCode className="w-5 h-5" />
                    Scan QR Code Instead
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="p-4 text-center">
          <p className="text-primary-400 text-xs">
            flowbond.tech
          </p>
        </footer>
      </div>
    </div>
  );
}
