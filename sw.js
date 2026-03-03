// ============================================================
// GLOBO AGUA - Service Worker
// ============================================================
const CACHE_NAME = 'globo-agua-v9.12';

const STATIC_ASSETS = [
  'manifest.json',
  'images/logo.jpeg',
  'images/mascote.jpeg'
];

function offlineHtmlResponse() {
  return new Response(
    '<!DOCTYPE html><html><body><h2 style="font-family:sans-serif;text-align:center;padding:40px;color:#1976D2">Globo Agua<br><small style="color:#666">Sem conexao. Verifique sua internet.</small></h2></body></html>',
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => Promise.allSettled(
      STATIC_ASSETS.map((url) => cache.add(new Request(url, { cache: 'reload' })).catch(() => {}))
    ))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// Messages from app
self.addEventListener('message', (event) => {
  if (event.data === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys()
        .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
        .then(() => caches.open(CACHE_NAME))
        .then((cache) => Promise.allSettled(
          STATIC_ASSETS.map((url) => cache.add(new Request(url, { cache: 'reload' })).catch(() => {}))
        ))
    );
  }

  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Strategy: NETWORK-FIRST (network first, cache only when offline)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (request.url.includes('supabase.co')) return;
  if (request.url.includes('cdn.jsdelivr.net')) return;
  if (request.url.includes('googleapis.com')) return;
  if (request.url.includes('viacep.com.br')) return;

  // For HTML pages: always network first to deliver updates immediately in PWA
  const isHtml = request.url.endsWith('/')
    || request.url.endsWith('index.html')
    || request.headers.get('accept')?.includes('text/html');

  if (isHtml) {
    event.respondWith(
      fetch(request, { cache: 'no-store' }).catch(() =>
        caches.match(request).then((cached) => cached || offlineHtmlResponse())
      )
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.ok && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || offlineHtmlResponse()))
  );
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'Globo Agua', {
      body: data.body || '',
      icon: '/images/logo.jpeg',
      badge: '/images/logo.jpeg',
      data: data.url || '/'
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data || '/'));
});
