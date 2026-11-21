// Lets the game open with no internet (a car, a plane) once it has been opened online one time.
// Network first: whenever there is a connection the newest build wins, and the copy kept here is
// only used when the network fails. Nothing is ever served stale while online.
const CACHE = 'jontuka-v1';
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];
// keep the page and its icon from the first visit; a file that fails to fetch never blocks the install
const KEEP = ['index.html', 'icon-180.png', 'icon-512.png', 'manifest.json'];
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(KEEP.map(u => c.add(u).catch(() => {})))));
});
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || !(url.origin === self.location.origin || FONT_HOSTS.includes(url.hostname))) return;
  e.respondWith(
    fetch(req).then(res => {
      if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {}); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || Response.error()))
  );
});
