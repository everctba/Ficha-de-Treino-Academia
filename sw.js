/*
  Service Worker — Ficha de Treino / Graciele Personal Trainer
  Funciona em GitHub Pages (HTTPS) usando apenas caminhos relativos.
  Estratégia:
    - Navegação: network-first com fallback para o index.html em cache (offline).
    - Arquivos locais e CDNs: stale-while-revalidate (abre rápido e atualiza sozinho).
*/

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `gra-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `gra-runtime-${CACHE_VERSION}`;

const INDEX_URL = new URL('./index.html', self.location.href).href;

// Arquivos do próprio site (obrigatórios para funcionar offline).
const CORE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './pwa.js',
  './manifest.json',
  './logo-gra-horizontal.png',
  './logo-gra.png',
  './favicon-96x96.png',
  './favicon.svg',
  './favicon.ico',
  './fita.png',
  './grunge-topo.png',
  './noise.png',
  './refresh.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
  './icons/favicon-16.png'
];

// Bibliotecas externas usadas pelo app (cache best-effort: se falhar, o app segue online).
const CDN_ASSETS = [
  'https://cdn.tailwindcss.com?plugins=forms,container-queries',
  'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js',
  'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Roboto+Condensed:wght@300;400;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap'
];

async function precache(cache, url, options) {
  try {
    const request = new Request(url, options);
    const response = await fetch(request);
    if (response && (response.ok || response.type === 'opaque')) {
      await cache.put(url, response);
    }
  } catch (error) {
    // Item opcional: segue sem ele.
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);

      // Essenciais: tenta todos, mas não impede a instalação se um falhar.
      await Promise.allSettled(
        CORE_ASSETS.map((url) => precache(cache, url, { cache: 'reload' }))
      );

      // CDNs: no-cors para poderem ser servidos como <script>/<link> offline.
      await Promise.allSettled(
        CDN_ASSETS.map((url) => precache(cache, url, { mode: 'no-cors', cache: 'reload' }))
      );
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

async function networkFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(INDEX_URL, response.clone());
      return response;
    }
    // Servidor fora do ar / erro 5xx: usa a versão em cache.
    if (response && response.status >= 500) {
      const cached = (await cache.match(request)) || (await cache.match(INDEX_URL));
      if (cached) return cached;
    }
    return response;
  } catch (error) {
    return (
      (await cache.match(request)) ||
      (await cache.match(INDEX_URL)) ||
      (await cache.match('./')) ||
      Response.error()
    );
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const network = fetch(request)
    .then((response) => {
      if (response && (response.ok || response.type === 'opaque')) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);

  return cached || network;
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  const isSameOrigin = url.origin === self.location.origin;
  event.respondWith(
    staleWhileRevalidate(request, isSameOrigin ? STATIC_CACHE : RUNTIME_CACHE)
  );
});
