// Voice clips live in IndexedDB, not in the Cache API. Safari opens the whole Cache Storage of a site before the
// service worker can answer the first request, and with thousands of clips in it that took seconds: a black screen
// on every cold start. Plain script (no import/export): the service worker loads it with importScripts and the page
// with a <script> tag via offline.js, so both use exactly the same code.
/* global self */
(function (g) {
  const DB = 'suomit-clips', ST = 'clips';
  let dbp = null;
  const db = () => dbp || (dbp = new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(ST);
    r.onsuccess = () => { const d = r.result; d.onversionchange = () => { d.close(); dbp = null; }; res(d); };
    r.onerror = () => { dbp = null; rej(r.error); };
    r.onblocked = () => { dbp = null; rej(new Error('blocked')); };
  }));
  const run = (mode, fn) => db().then(d => new Promise((res, rej) => {
    const t = d.transaction(ST, mode), s = t.objectStore(ST), r = fn(s);
    t.oncomplete = () => res(r && 'result' in r ? r.result : undefined);
    t.onerror = t.onabort = () => rej(t.error);
  }));
  g.clipDB = {
    get: k => run('readonly', s => s.get(k)),
    put: (k, blob) => run('readwrite', s => s.put(blob, k)),
    /** several [key, blob] pairs in one transaction (much faster than one by one) */
    putAll: pairs => run('readwrite', s => { for (const [k, b] of pairs) s.put(b, k); }),
    keys: () => run('readonly', s => s.getAllKeys()),
    count: () => run('readonly', s => s.count()),
    clear: () => run('readwrite', s => s.clear()),
  };
})(typeof self !== 'undefined' ? self : globalThis);
