const CACHE = 'sangha-rota-v1'

// Cache the shell pages on install so the app opens when offline
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(cache =>
      cache.addAll(['/', '/dashboard', '/rota'])
    )
  )
  self.skipWaiting()
})

self.addEventListener('activate', () => {
  self.clients.claim()
})

// Network-first: always try the network; fall back to cache when offline
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone()
        caches.open(CACHE).then(cache => cache.put(e.request, copy))
        return res
      })
      .catch(() => caches.match(e.request))
  )
})
