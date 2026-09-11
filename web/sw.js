/**
 * sw.js — offline shell and notification click handling.
 *
 * Cache-first for everything: Kundala has no remote data, so once the shell is
 * cached the app is fully functional with the radio off. The only reason to hit
 * the network at all is to pick up a new version.
 */

const CACHE = 'kundala-v1.0.0';

const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './styles/app.css',
  './js/app.js',
  './js/astro.js',
  './js/schedule.js',
  './js/store.js',
  './js/views.js',
  './js/format.js',
  './js/packs.js',
  './js/codes.js',
  './js/entitlements.js',
  './js/billing.js',
  './js/notifications.js',
  './js/content/protocol.js',
  './js/content/prep.js',
  './js/content/vedic.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
  './icons/badge-72.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;

  e.respondWith(
    caches.match(request, { ignoreSearch: true }).then((hit) => {
      if (hit) {
        // Refresh in the background so the next launch is current.
        fetch(request)
          .then((res) => res.ok && caches.open(CACHE).then((c) => c.put(request, res.clone())))
          .catch(() => {});
        return hit;
      }
      return fetch(request)
        .then((res) => {
          if (res.ok && new URL(request.url).origin === self.location.origin) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = e.notification.data?.url || './';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(self.registration.scope)) {
          client.focus();
          return client.navigate(url).catch(() => {});
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
