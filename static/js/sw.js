/*
 * Kirana Konnect service worker (served from /sw.js so it covers the whole app).
 *
 * Deliberately small and safe:
 *  - /static/* (CSS, fonts, icons, scripts): answered from the phone's cache
 *    at once and refreshed in the background, so screens open fast on weak
 *    Jio signal and cost less data.
 *  - Screens and /api/* are NEVER cached: shop data must always be live and
 *    private pages must not be shown after logout.
 *  - If a screen cannot be loaded because there is no internet, a friendly
 *    "No internet - Retry" page is shown instead of the browser error page.
 */
const CACHE = 'kk-static-v1';
const OFFLINE_URL = '/offline';

self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE).then(c => c.add(new Request(OFFLINE_URL, { cache: 'reload' }))).catch(() => {}));
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
        .then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
    const req = event.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);
    if (url.origin !== self.location.origin) return;

    if (url.pathname.startsWith('/static/')) {
        event.respondWith(caches.open(CACHE).then(async cache => {
            const hit = await cache.match(req);
            const fresh = fetch(req).then(res => { if (res && res.ok) cache.put(req, res.clone()); return res; }).catch(() => hit);
            return hit || fresh;
        }));
        return;
    }
    if (req.mode === 'navigate') {
        event.respondWith(fetch(req).catch(() => caches.match(OFFLINE_URL)));
    }
});
