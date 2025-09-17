
const CACHE_NAME = 'jadwalin-cache-v1.1'; // Bump version
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/jadwalin-icon.svg',
  '/index.tsx',

  // Core files in src
  '/src/App.tsx',
  '/src/types.ts',
  '/src/constants.ts',
  '/src/i18n.ts',
  '/src/utils.ts',
  
  // Services
  '/src/services/localScheduler.ts',
  '/src/services/exportStyles.ts',
  '/src/services/geminiService.ts',

  // Components
  '/src/components/common/index.tsx',
  '/src/components/dashboard/index.tsx',
  '/src/components/forms/index.tsx',
  '/src/components/layout/Header.tsx',
  '/src/components/modals/index.tsx',
  '/src/components/schedule/ArchivedScheduleViewer.tsx',
  '/src/components/schedule/index.tsx',
  '/src/components/HelpAndAboutPage.tsx',

  // CDNs
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css',
  
  // From importmap
  "https://aistudiocdn.com/react@^19.1.1",
  "https://aistudiocdn.com/react-dom@^19.1.1/client",
  "https://aistudiocdn.com/@google/genai@^1.17.0",
  "https://aistudiocdn.com/@dnd-kit/core@6.1.0",
  "https://aistudiocdn.com/@dnd-kit/sortable@7.0.2",
  "https://aistudiocdn.com/@dnd-kit/utilities@3.2.2"
];

// Install event: cache all essential assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        const cachePromises = URLS_TO_CACHE.map(url => {
            return cache.add(url).catch(err => {
                console.warn(`Failed to cache ${url}:`, err);
            });
        });
        return Promise.all(cachePromises);
      })
  );
  self.skipWaiting();
});

// Fetch event: serve from cache first, then network
self.addEventListener('fetch', event => {
  // We only cache GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Cache hit - return response
        if (cachedResponse) {
          return cachedResponse;
        }

        // Not in cache - fetch from network, then cache it
        return fetch(event.request).then(
          networkResponse => {
            // Check if we received a valid response
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }
            
            // IMPORTANT: Clone the response. A response is a stream
            // and because we want the browser to consume the response
            // as well as the cache consuming the response, we need
            // to clone it so we have two streams.
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        );
      })
  );
});

// Activate event: clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});
