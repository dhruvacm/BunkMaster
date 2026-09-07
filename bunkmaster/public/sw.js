const CACHE_NAME = 'bunkmaster-shell-v1';
const scope = self.registration.scope;
const SHELL_ASSETS = [
  scope,
  `${scope}index.html`,
  `${scope}manifest.json`,
  `${scope}favicon.svg`,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          if (
            response.ok &&
            new URL(event.request.url).origin === self.location.origin
          ) {
            const copy = response.clone();
            void caches.open(CACHE_NAME).then((cache) => {
              void cache.put(event.request, copy);
            });
          }
          return response;
        })
        .catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match(`${scope}index.html`);
          }
          return Response.error();
        });
    }),
  );
});