// ============================================================
// GLOBO ÁGUA - Service Worker
// ============================================================
const CACHE_NAME = 'globo-agua-v1.0';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/images/logo.jpeg',
  '/images/mascote.jpeg'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.allSettled(
        STATIC_ASSETS.map(url =>
          cache.add(new Request(url, { cache: 'reload' })).catch(() => {})
        )
      );
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (request.url.includes('supabase.co')) return;
  if (request.url.includes('cdn.jsdelivr.net')) return;
  if (request.url.includes('googleapis.com')) return;

  event.respondWith(
    caches.match(request).then(cached => {
      const networkFetch = fetch(request)
        .then(response => {
          if (response && response.ok && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => null);
      return cached || networkFetch || new Response(
        '<!DOCTYPE html><html><body><h2 style="font-family:sans-serif;text-align:center;padding:40px;color:#1976D2">Globo Água<br><small style="color:#666">Sem conexão. Verifique sua internet.</small></body></html>',
        { headers: { 'Content-Type': 'text/html' } }
      );
    })
  );
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'Globo Água', {
      body: data.body || '',
      icon: '/images/logo.jpeg',
      badge: '/images/logo.jpeg',
      data: data.url || '/'
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data || '/')
  );
});
