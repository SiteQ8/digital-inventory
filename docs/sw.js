// Keeps a copy of the page on the device so it opens with no connection.
// It answers only for this site's own files and never asks another host for anything.
// VERSION and FILES are written by scripts/stamp.mjs and checked by the tests.

const VERSION = '0d1887459a17';
const FILES = [
  './',
  'assets/css/app.css',
  'assets/fonts/markazi-ar.woff2',
  'assets/fonts/markazi-lat.woff2',
  'assets/fonts/tajawal-400-ar.woff2',
  'assets/fonts/tajawal-400-lat.woff2',
  'assets/fonts/tajawal-500-ar.woff2',
  'assets/fonts/tajawal-500-lat.woff2',
  'assets/fonts/tajawal-700-ar.woff2',
  'assets/fonts/tajawal-700-lat.woff2',
  'assets/img/icon.svg',
  'assets/js/app.js',
  'assets/js/engine/brand.js',
  'assets/js/engine/catalog.js',
  'assets/js/engine/i18n.js',
  'assets/js/engine/model.js',
  'assets/js/engine/vault.js',
  'index.html',
  'manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((name) => name !== VERSION).map((name) => caches.delete(name))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((kept) => kept || fetch(event.request)),
  );
});
