// SuomiT service worker: offline-first app shell. Bump VERSION on every release.
const VERSION = 'suomit-v17';
importScripts('js/clipdb.js'); // self.clipDB: voice clips in IndexedDB
// Speech clips (audio/<xx>/<hash>.mp3) are immutable (content-addressed). They are kept in IndexedDB (js/clipdb.js),
// filled as clips are played, never precached. Older versions kept them in this cache: js/offline.js moves them over
// and deletes it (thousands of entries in Cache Storage made every cold start on iPhone take seconds).
const AUDIO_CACHE = 'suomit-audio';
const SHELL = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/app.css',
  'css/practice.css',
  'css/shop.css',
  'js/app.js',
  'js/audio.js',
  'js/calendar.js',
  'js/chest.js',
  'js/exercises.js',
  'js/fi.js',
  'js/gamify.js',
  'js/icons.js',
  'js/lexicon.js',
  'js/mascots.js',
  'js/offline.js',
  'js/viewport.js',
  'js/views/twisters.js',
  'data/twisters.js',
  'js/plan.js',
  'js/practice.js',
  'js/session.js',
  'js/srs.js',
  'js/store.js',
  'js/ui.js',
  'js/views/home.js',
  'js/views/me.js',
  'js/views/path.js',
  'js/views/read.js',
  'js/views/words.js',
  'js/i18n.js',
  'js/clipdb.js',
  'js/tutorial.js',
  'js/sentences.js',
  'data/glossary.js',
  'i18n/nl/index.js',
  'i18n/nl/ui.js',
  'i18n/nl/words.js',
  'i18n/nl/readings.js',
  'i18n/nl/course.js',
  'i18n/nl/practice-m1a.js',
  'i18n/nl/practice-m1b.js',
  'i18n/nl/practice-m2.js',
  'i18n/nl/practice-m34.js',
  'i18n/es/index.js',
  'i18n/es/ui.js',
  'i18n/es/words.js',
  'i18n/es/readings.js',
  'i18n/es/course.js',
  'i18n/es/practice-m1a.js',
  'i18n/es/practice-m1b.js',
  'i18n/es/practice-m2.js',
  'i18n/es/practice-m34.js',
  'data/audio-index.js',
  'data/course.js',
  'data/grammar.js',
  'data/readings.js',
  'data/resources.js',
  'data/verbs.js',
  'data/vocab.js',
  'data/practice/index.js',
  'data/practice/tr.js',
  'data/practice/m1a.js',
  'data/practice/m1b.js',
  'data/practice/m2.js',
  'data/practice/m34.js',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-180.png',
  'icons/favicon-32.png'];
// cache: 'reload' so a new version never precaches a stale copy from the browser's HTTP cache
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION && k !== AUDIO_CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
function ranged(req, res) {
  const m = /bytes=(\d*)-(\d*)/.exec(req.headers.get('range') || '');
  if (!m || res.status !== 200) return res;
  return res.arrayBuffer().then(buf => {
    const size = buf.byteLength;
    const start = m[1] ? +m[1] : Math.max(0, size - +m[2]), end = m[1] && m[2] ? Math.min(+m[2], size - 1) : size - 1;
    return new Response(buf.slice(start, end + 1), { status: 206, headers: {
      'Content-Type': 'audio/mpeg', 'Content-Length': String(end - start + 1), 'Content-Range': `bytes ${start}-${end}/${size}`, 'Accept-Ranges': 'bytes' } });
  });
}
// Our own files: cache first (see below). Fonts: cache-first.
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (u.origin === location.origin && /\/audio\/[0-9a-f]{2}\/[0-9a-f]{12}\.mp3$/.test(u.pathname)) {
    // Stored clip first (IndexedDB, then the old cache while it is being moved), else the network, which is kept.
    // Always the whole clip (status 200); Safari's Range requests get a 206 cut from it.
    const key = u.pathname, mp3 = b => new Response(b, { headers: { 'Content-Type': 'audio/mpeg' } });
    e.respondWith(self.clipDB.get(key).catch(() => null)
      .then(b => b ? mp3(b) : caches.has(AUDIO_CACHE).then(old => old ? caches.open(AUDIO_CACHE).then(c => c.match(key)) : null))
      .then(r => r || fetch(key).then(res => {
        if (res.status === 200) e.waitUntil(res.clone().blob().then(b => self.clipDB.put(key, b)).catch(() => { }));
        return res;
      }))
      .then(r => ranged(e.request, r)));
  } else if (u.origin === location.origin) {
    // App files: cache first, so the app opens instantly (also offline and on slow mobile data). Every release has
    // a new VERSION, whose install step downloads the new files; the page then reloads into it (js/app.js).
    e.respondWith(caches.open(VERSION).then(c => c.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request).then(r => {
      if (r.ok && r.type === 'basic') c.put(e.request, r.clone());
      return r;
    }).catch(() => e.request.mode === 'navigate' ? c.match('index.html') : Response.error()))));
  } else if (/fonts\.(googleapis|gstatic)\.com/.test(u.host)) {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => { const c = res.clone(); caches.open(VERSION).then(x => x.put(e.request, c)); return res; })));
  }
});
