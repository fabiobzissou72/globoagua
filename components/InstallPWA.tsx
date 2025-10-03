'use client';

import { useEffect, useState } from 'react';
import { Button } from './ui/Button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Verificar se já está instalado
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!standalone) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Instala automaticamente sem pedir confirmação adicional
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowBanner(false);
    }
  };

  // Não mostrar se já está instalado ou não montado
  if (!mounted || isStandalone) return null;

  return (
    <>
      {/* Banner fixo no rodapé quando disponível */}
      {showBanner && (
        <div className="fixed bottom-0 left-0 right-0 bg-primary text-white p-4 shadow-lg z-50 animate-in slide-in-from-bottom">
          <div className="container-custom flex items-center justify-between flex-wrap gap-4">
            <div className="flex-1">
              <p className="font-semibold">📱 Instale nosso app!</p>
              <p className="text-sm opacity-90">
                Acesse rápido e use offline. Adicione à tela inicial!
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBanner(false)}
                className="text-white border border-white hover:bg-white/10"
              >
                Agora não
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleInstallClick}
              >
                Instalar App
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Botão flutuante sempre visível */}
      {!showBanner && (
        <button
          onClick={handleInstallClick}
          className="fixed bottom-6 right-6 bg-primary text-white p-4 rounded-full shadow-lg hover:bg-primary-dark transition-all z-40 flex items-center gap-2"
          title="Instalar PWA"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-sm font-semibold">Instalar</span>
        </button>
      )}
    </>
  );
}
