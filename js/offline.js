// Offline support: download every neural audio clip into the same cache the service worker reads from.
import { AUDIO } from '../data/audio-index.js';
import './clipdb.js'; // defines self.clipDB (shared with the service worker)
const OLD_CACHE = 'suomit-audio';
const clipDB = () => self.clipDB;
const pathOf = h => new URL(`audio/${h.slice(0, 2)}/${h}.mp3`, location.href).pathname;
export const offlineSupported = () => 'indexedDB' in window && 'serviceWorker' in navigator;
export const totalClips = () => AUDIO.size;
export async function cachedClips() {
  try { return await clipDB().count(); } catch { return 0; }
}
let running = null;
/** Download all missing clips. onProgress(done, total). Returns {done, failed}. */
export function downloadAllAudio(onProgress) {
  if (running) return running;
  running = (async () => {
    await migrateAudioCache();
    const have = new Set(await clipDB().keys().catch(() => []));
    const todo = [...AUDIO].map(pathOf).filter(p => !have.has(p));
    const total = AUDIO.size; let done = total - todo.length, failed = 0, i = 0;
    onProgress?.(done, total);
    const worker = async () => {
      let batch = [];
      const flush = async () => { if (batch.length) { const b = batch; batch = []; await clipDB().putAll(b).catch(() => { failed += b.length; }); } };
      while (i < todo.length) {
        const p = todo[i++];
        try { const r = await fetch(p); if (r.status === 200) batch.push([p, await r.blob()]); else failed++; } catch { failed++; }
        if (batch.length >= 20) await flush();
        done++; if (done % 25 === 0 || done === total) onProgress?.(done, total);
      }
      await flush();
    };
    await Promise.all(Array.from({ length: 12 }, worker));
    onProgress?.(done, total);
    running = null;
    return { done, failed };
  })();
  return running;
}
export async function clearAudio() { try { await clipDB().clear(); } catch { } if ('caches' in window) await caches.delete(OLD_CACHE); }

let migrating = null;
/** Older versions kept clips in Cache Storage, which made every cold start on iPhone slow. The service worker deletes
 *  that cache when it activates; this does the same from the page in case it is still there. */
export function migrateAudioCache() {
  return migrating ||= ('caches' in window ? caches.delete(OLD_CACHE) : Promise.resolve(false)).catch(() => false);
}

/** Is the app itself (every file of this version) saved for offline use? The service worker saves all of it at once
 *  when it installs; wait=true waits for that to finish (first visit / just after an update). */
export async function appReady(wait = false) {
  if (!('serviceWorker' in navigator)) return false;
  try {
    if (wait) await Promise.race([navigator.serviceWorker.ready, new Promise(r => setTimeout(r, 15000))]);
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg?.active) return false;
    const names = await caches.keys();
    return names.some(n => /^suomit-v\d+$/.test(n)) && !!navigator.serviceWorker.controller;
  } catch { return false; }
}
