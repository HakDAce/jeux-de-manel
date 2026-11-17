// Mode hors-ligne : réseau d'abord (pour avoir la dernière version), sinon copie gardée sur la tablette.
const CACHE = 'atelier-magique-v2';
const FILES = [
  './',
  'index.html',
  'styles.css',
  'app.js',
  'coloriages.js',
  'characters-data.js',
  'manifest.json',
  'blocs/',
  'blocs/index.html',
  'blocs/blocs.css',
  'blocs/jeu.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok && new URL(e.request.url).origin === location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || caches.match('index.html')))
  );
});
