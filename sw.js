/* Service Worker - Offline Support - v3 */
const CACHE_NAME = 'student-analyzer-v3';

const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/css/style.css',
    '/fonts/tajawal-local.css',
    '/fonts/tajawal-1.ttf',
    '/fonts/tajawal-2.ttf',
    '/fonts/tajawal-3.ttf',
    '/fonts/tajawal-4.ttf',
    '/fonts/tajawal-5.ttf',
    '/libs/xlsx.full.min.js',
    '/libs/chart.umd.min.js',
    '/libs/jspdf.umd.min.js',
    '/libs/html2canvas.min.js',
    '/js/db.js',
    '/js/excel.js',
    '/js/analyzer.js',
    '/js/charts.js',
    '/js/reports.js',
    '/js/groups.js',
    '/js/app.js',
    '/manifest.json',
    '/assets/icons/icon.svg'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(names =>
            Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) return cached;
            return fetch(event.request).then(response => {
                if (response && response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return response;
            }).catch(() => caches.match('/index.html'));
        })
    );
});
