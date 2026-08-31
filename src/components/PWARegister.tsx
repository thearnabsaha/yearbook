'use client';

import { useEffect, useState } from 'react';
import { Download, WifiOff } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWARegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if running as standalone PWA
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    ) {
      setIsInstalled(true);
    }

    // Register Service Worker
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('PWA Service Worker registered:', reg.scope);
        })
        .catch((err) => {
          console.warn('PWA Service Worker registration failed:', err);
        });
    }

    // Handle BeforeInstallPrompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Online / Offline listeners
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    if (!navigator.onLine) setIsOffline(true);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setIsInstalled(true);
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  return (
    <>
      {/* Offline Pill Alert */}
      {isOffline && (
        <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-full bg-amber-500/90 px-4 py-2 text-xs font-medium text-black backdrop-blur-md shadow-lg shadow-amber-500/20 animate-pulse">
          <WifiOff className="h-4 w-4" />
          <span>Offline Mode — All edits and photos save locally</span>
        </div>
      )}

      {/* PWA Install Banner if prompt available and not yet installed */}
      {!isInstalled && deferredPrompt && showBanner && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-2xl border border-indigo-500/30 bg-slate-900/90 p-3.5 text-white backdrop-blur-xl shadow-2xl shadow-indigo-500/20 max-w-sm transition-all duration-300">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-bold">
            PF
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-100">Install PixelForge</p>
            <p className="text-[11px] text-slate-400 truncate">Add to home screen for native offline editing</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 transition-colors cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              Install
            </button>
            <button
              onClick={() => setShowBanner(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:text-slate-200 text-xs"
              title="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}
