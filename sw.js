// Minimal service worker — its only job is to exist and respond to fetches,
// which is one of Chrome's requirements before it will show the "Install app" option.
// It caches the app shell so the page also opens instantly (and works offline for the
// UI itself — though saving/loading results still needs an internet connection, since
// that part talks to Google Sheets).

const CACHE_NAME = 'result-system-v2';
const APP_SHELL = ['./', './index.html', './certificate.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(()=>{})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // network-first for everything, falling back to cache if offline —
  // this way the person always gets the latest deployed version when online.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(()=>{});
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
