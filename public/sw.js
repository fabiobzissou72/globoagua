const CACHE_NAME = 'globoagua-v1'
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

// Install event — cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Silently fail if some assets don't exist yet
      })
    })
  )
  self.skipWaiting()
})

// Activate event — clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  )
  self.clients.claim()
})

// Fetch event — network-first for API, cache-first for static
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Skip Supabase / external API calls
  if (url.hostname.includes('supabase.co') || url.hostname.includes('viacep.com.br')) return

  // API routes: network-first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .catch(() => new Response(JSON.stringify({ error: 'offline' }), {
          headers: { 'Content-Type': 'application/json' }
        }))
    )
    return
  }

  // Static assets: cache-first (somente assets de mídia, NÃO bundles JS/CSS do Next)
  if (url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico|woff2?)$/)) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached
        return fetch(request).then(response => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone))
          }
          return response
        }).catch(() => new Response('', { status: 503 }))
      })
    )
    return
  }

  // Navigation requests: network-first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone))
          return response
        })
        .catch(() =>
          caches.match(request).then(cached => {
            if (cached) return cached
            return caches.match('/offline.html').then(offlinePage => {
              if (offlinePage) return offlinePage
              return new Response(
                `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline · Globo Água</title>
                <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#EFF6FF;color:#1565C0;}
                .box{text-align:center;padding:2rem;}h1{font-size:2rem;margin-bottom:.5rem;}p{color:#64748b;}</style></head>
                <body><div class="box"><div style="font-size:4rem">💧</div><h1>Globo Água</h1><p>Você está offline. Verifique sua conexão.</p></div></body></html>`,
                { headers: { 'Content-Type': 'text/html' } }
              )
            })
          })
        )
    )
    return
  }
})

// Push notification handler
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {}
  const title = data.title || 'Globo Água'
  const options = {
    body: data.body || 'Você tem uma nova notificação',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: data.tag || 'globoagua-notification',
    data: { url: data.url || '/' },
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      const existing = clients.find(c => c.url.includes(self.location.origin))
      if (existing) {
        existing.focus()
        existing.navigate(url)
      } else {
        self.clients.openWindow(url)
      }
    })
  )
})
