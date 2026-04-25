'use client';

import { useState, useEffect } from 'react';
import { Download, X, Rocket } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'cosmogov-pwa-dismissed';
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      const dismissedAt = localStorage.getItem(DISMISS_KEY);
      if (dismissedAt && Date.now() - parseInt(dismissedAt, 10) < DISMISS_DURATION) {
        return;
      }
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if already installed
    window.addEventListener('appinstalled', () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        toast({
          title: '🚀 CosmoGov Installed!',
          description: 'Welcome aboard, cosmic citizen. Launch from your home screen anytime.',
        });
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    } catch {
      // Silently handle errors
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setShowPrompt(false);
  };

  if (!showPrompt || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div className="relative glass-card p-4 rounded-2xl border border-gradient max-w-[280px]"
        style={{
          background: 'linear-gradient(135deg, rgba(4,5,11,0.95), rgba(13,17,28,0.95))',
          borderColor: 'rgba(46,230,199,0.2)',
        }}
      >
        {/* Gradient border glow */}
        <div className="absolute -inset-[1px] rounded-2xl opacity-50 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(46,230,199,0.3), rgba(45,107,255,0.3), rgba(139,92,246,0.3))',
            filter: 'blur(1px)',
            zIndex: -1,
          }}
        />

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors border border-white/10"
          aria-label="Dismiss install prompt"
        >
          <X className="w-3 h-3 text-cosmic-muted" />
        </button>

        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cosmic-teal to-cosmic-violet flex items-center justify-center flex-shrink-0">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">Install CosmoGov</p>
            <p className="text-xs text-cosmic-muted mt-0.5">Add to home screen for the full cosmic experience</p>
          </div>
        </div>

        <button
          onClick={handleInstall}
          className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: 'linear-gradient(135deg, #2EE6C7, #2D6BFF)',
            color: '#fff',
          }}
        >
          <Download className="w-4 h-4" />
          Install App
        </button>
      </div>
    </div>
  );
}
