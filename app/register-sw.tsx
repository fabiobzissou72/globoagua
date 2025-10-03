'use client';

import { useEffect } from 'react';

export function RegisterSW() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registrado:', registration);
        })
        .catch((error) => {
          console.log('Erro ao registrar Service Worker:', error);
        });
    }
  }, []);

  return null;
}
