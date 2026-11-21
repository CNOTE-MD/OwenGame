// Lets the game open with no internet (a car, a plane) once it has been opened online one time.
// Network first: whenever there is a connection the newest build wins, and the copy kept here is
// only used when the network fails. Nothing is ever served stale while online.
const CACHE = 'jontuka-v1';
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];
const KEEP = ['index.html', 'icon-180.png', 'icon-512.png', 'manifest.json'];
const MARK = '<canvas id="g"';                      // only the game's own page has this
// Some hosts put a notice page in front of the game now and then. A web page is only kept if it
// really is the game, so a notice can never replace the offline copy.
function keep(req, res) {
  if (!res || !(res.ok || res.type === 'opaque')) return Promise.resolve();
  const copy = res.clone(), put = () => caches.open(CACHE).then(c => c.put(req, copy));
  const html = res.type !== 'opaque' && (res.headers.get('content-type') || '').includes('text/html');
  return (html ? copy.clone().text().then(t => (t.includes(MARK) ? put() : null)) : put()).catch(() => {});
}
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(Promise.all(KEEP.map(u => fetch(u).then(res => keep(u, res)).catch(() => {}))));
});
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || !(url.origin === self.location.origin || FONT_HOSTS.includes(url.hostname))) return;
  e.respondWith(
    fetch(req).then(res => { keep(req, res); return res; })
      .catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || Response.error()))
  );
});
