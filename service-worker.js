self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('solivage-cache-v1').then(cache => {
      return cache.addAll([
        '/',
        '/Solivage.html',
        '/styles.css',
        '/solivage.js',
        '/back3-optimized.webp',
        '/manifest.json'
      ]);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
