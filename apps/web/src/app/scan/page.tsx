'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, AlertCircle, QrCode, Ticket, User } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useQRResolve } from '@/lib/hooks';
import { cn } from '@/lib/utils';

export default function ScanPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const { data: qrData, isLoading, isError, error: qrError } = useQRResolve(scannedCode || '', {
    enabled: !!scannedCode,
  });

  // Handle successful QR resolution
  useEffect(() => {
    if (qrData && !isLoading) {
      // Navigate to quest page with the resolved data
      const { venue, sponsor, availableQuests } = qrData;
      
      if (availableQuests.length > 0) {
        // Navigate to first available quest
        router.push(`/quest/${availableQuests[0].id}?venue=${venue.id}`);
      } else {
        // No quests available
        setError(t('quest.maxReached'));
        setScannedCode(null);
      }
    }
  }, [qrData, isLoading, router, t]);

  // Handle QR error
  useEffect(() => {
    if (isError) {
      setError(t('scan.invalidCode'));
      setScannedCode(null);
    }
  }, [isError, t]);

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
      setScanning(true);
    } catch (err) {
      setHasPermission(false);
      setError(t('scan.permissionDenied'));
    }
  };

  const handleScan = useCallback((code: string) => {
    if (code && !scannedCode) {
      setScannedCode(code);
      setScanning(false);
    }
  }, [scannedCode]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      setScannedCode(manualCode.trim().toUpperCase());
    }
  };

  const closeScanner = () => {
    setScanning(false);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 h-14">
          <h1 className="text-lg font-semibold">{t('scan.title')}</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/passes')}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="My Passes"
            >
              <Ticket className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => router.push('/profile')}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Profile"
            >
              <User className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      <main className="p-4">
        {/* Scanner Card */}
        <div className="card mb-4">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 mb-4">
              <QrCode className="w-8 h-8 text-primary-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">{t('scan.title')}</h2>
            <p className="text-gray-600 mb-6">{t('scan.instruction')}</p>
            
            <button
              onClick={requestCameraPermission}
              className="btn-primary btn-lg w-full flex items-center justify-center gap-2"
            >
              <Camera className="w-5 h-5" />
              {t('scan.title')}
            </button>
          </div>
        </div>

        {/* Manual Entry */}
        <div className="card">
          <h3 className="font-medium mb-3">Enter code manually</h3>
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              placeholder="Enter QR code"
              className="input flex-1 uppercase tracking-widest"
              maxLength={12}
            />
            <button
              type="submit"
              disabled={!manualCode.trim() || isLoading}
              className="btn-primary btn-md"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Go'
              )}
            </button>
          </form>
        </div>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-4 p-4 bg-error-50 border border-error-200 rounded-xl flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-error-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-error-700 font-medium">{error}</p>
                <p className="text-error-600 text-sm mt-1">{t('scan.tryAgain')}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-error-500 hover:text-error-700"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* QR Scanner Overlay */}
      <AnimatePresence>
        {scanning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="qr-scanner-overlay"
          >
            {/* Close button */}
            <button
              onClick={closeScanner}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Video placeholder - in real implementation would use react-qr-reader */}
            <div className="absolute inset-0 flex items-center justify-center">
              <video
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
            </div>

            {/* Viewfinder */}
            <div className="qr-scanner-viewfinder" />

            {/* Instructions */}
            <div className="absolute bottom-20 left-0 right-0 text-center">
              <p className="text-white text-lg">{t('scan.instruction')}</p>
              <p className="text-white/60 text-sm mt-2">{t('scan.scanning')}</p>
            </div>

            {/* Demo scan button - remove in production */}
            <div className="absolute bottom-8 left-0 right-0 flex justify-center">
              <button
                onClick={() => handleScan('DEMO123')}
                className="btn-primary btn-md"
              >
                Simulate Scan (Demo)
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
