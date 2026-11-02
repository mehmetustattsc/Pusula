/* Pusula service worker: oyunu ilk açılıştan sonra internetsiz de çalıştırır.
 * Uygulama dosyaları önbellekte tutulur; her açılışta arka planda yenisi indirilir
 * ve bir sonraki açılışta yeni sürüm gelir. Yazı tipleri ilk kullanımda önbelleğe alınır.
 * __VERSION__ derleme sırasında (tools/build.js) içerik özetiyle değiştirilir. */
const CACHE = 'pusula-__VERSION__';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png', './icons/apple-touch-icon.png', './icons/favicon-64.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('pusula-') && k !== CACHE && k !== 'pusula-fonts').map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // Google yazı tipleri: önbellekte varsa oradan, yoksa indir ve sakla
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open('pusula-fonts').then(c => c.match(e.request).then(hit => hit || fetch(e.request).then(r => { c.put(e.request, r.clone()); return r; }))));
    return;
  }
  if (url.origin !== location.origin) return;
  // uygulama dosyaları: önbellekten hemen ver, arka planda yenile
  e.respondWith(caches.open(CACHE).then(c => c.match(e.request, { ignoreSearch: true }).then(hit => {
    const net = fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  })));
});
