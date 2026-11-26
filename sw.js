// SuomiT service worker: offline-first app shell. Bump VERSION on every release.
const VERSION = 'suomit-v2';
// Speech clips (audio/<xx>/<hash>.mp3) are immutable (content-addressed), so they live in their own cache that
// survives version bumps and fills up as clips are played. They are never precached.
const AUDIO_CACHE = 'suomit-audio';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'css/app.css',
  'js/app.js', 'js/fi.js', 'js/srs.js', 'js/store.js', 'js/audio.js', 'js/ui.js', 'js/lexicon.js', 'js/exercises.js', 'js/plan.js', 'js/session.js', 'js/gamify.js',
  'js/views/home.js', 'js/views/path.js', 'js/views/words.js', 'js/views/read.js', 'js/views/me.js',
  'data/vocab.js', 'data/verbs.js', 'data/grammar.js', 'data/course.js', 'data/readings.js', 'data/resources.js', 'data/audio-index.js',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-180.png', 'icons/favicon-32.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
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
// Network-first for our own files (so updates arrive), cache fallback offline. Fonts: cache-first.
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (u.origin === location.origin && /\/audio\/[0-9a-f]{2}\/[0-9a-f]{12}\.mp3$/.test(u.pathname)) {
    // Cache-first. Always fetch/store the whole clip (status 200); Safari's Range requests get a 206 cut from it.
    e.respondWith(caches.open(AUDIO_CACHE).then(c => c.match(u.pathname).then(hit => hit || fetch(u.pathname).then(r => {
      if (r.status === 200) c.put(u.pathname, r.clone());
      return r;
    }))).then(r => ranged(e.request, r)));
  } else if (u.origin === location.origin) {
    e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(VERSION).then(x => x.put(e.request, c)); return r; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
  } else if (/fonts\.(googleapis|gstatic)\.com/.test(u.host)) {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => { const c = res.clone(); caches.open(VERSION).then(x => x.put(e.request, c)); return res; })));
  }
});
