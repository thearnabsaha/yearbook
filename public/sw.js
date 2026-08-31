const CACHE_NAME = 'pixelforge-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Pre-cache error (ignorable during first run):', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignore non-http/https or chrome-extension requests
  if (!url.protocol.startsWith('http')) return;

  // Handle PWA Web Share Target POST request
  if (event.request.method === 'POST' && url.pathname === '/') {
    event.respondWith(
      (async () => {
        try {
          const formData = await event.request.formData();
          const files = formData.getAll('photos');
          const title = formData.get('name') || '';
          const text = formData.get('description') || '';

          // Open IndexedDB directly inside Service Worker or save to temp cache
          // And notify open clients or store in IndexedDB
          // Redirect back to main page with share flag
          return Response.redirect('/?shared=true', 303);
        } catch (err) {
          console.error('Service worker share target handling error:', err);
          return Response.redirect('/', 303);
        }
      })()
    );
    return;
  }

  // Stale-while-revalidate for static assets & pages
  if (event.request.method === 'GET') {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (
              networkResponse &&
              networkResponse.status === 200 &&
              networkResponse.type === 'basic'
            ) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
  }
});
