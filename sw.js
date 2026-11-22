/* Offline launch for the Home Screen app. The app works without this file; it only lets the page open with no network.
   Network first (a new version arrives on the next online open). The cached copy is used when the network fails, is
   slow (4 s), answers with an error, or answers with a page that is not this app (a Wi-Fi login page).
   Only the app page itself is cached and served: other addresses in the folder pass through untouched.
   The cache key is the bare address: the part after # (her setup) is never stored in it.
   IF YOU RENAME THE APP: change MARK here in the same upload, or the new page will be taken for a foreign page. */
const CACHE = 'app-shell-v1', MARK = '<title>Bloom</title>';
const ROOT = new URL('./', self.location).href;
const isApp = r => { const u = r.url.split('#')[0].split('?')[0]; return u === ROOT || u === ROOT + 'index.html'; };
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.add(new Request(ROOT, { cache: 'reload' }))).catch(() => {})); });
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
async function fresh(r) {
  const res = await fetch(r);
  if (!res.ok || res.redirected) throw new Error('bad answer');
  const txt = await res.clone().text(); if (!txt.includes(MARK)) throw new Error('not this app');
  const copy = res.clone(); caches.open(CACHE).then(c => c.put(ROOT, copy)).catch(() => {});
  return res;
}
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || !isApp(r)) return;                       /* everything else: the browser's own handling */
  const slow = new Promise((_, no) => setTimeout(() => no(new Error('slow')), 4000));
  e.respondWith(Promise.race([fresh(r), slow]).catch(() => caches.match(ROOT).then(m => m || fetch(r))));
});
