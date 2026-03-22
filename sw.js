const CACHE_NAME = 'eid-wish-v4';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './main.js',
  './favicon.png',
  './icon-512.png',
  'https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&family=Outfit:wght@300;400;600&family=Playfair+Display:ital,wght@0,600;1,600&display=swap'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
