// Offline support: download every neural audio clip into the same cache the service worker reads from.
import { AUDIO } from '../data/audio-index.js';
const CACHE = 'suomit-audio';
const pathOf = h => new URL(`audio/${h.slice(0, 2)}/${h}.mp3`, location.href).pathname;
export const offlineSupported = () => 'caches' in window && 'serviceWorker' in navigator;
export const totalClips = () => AUDIO.size;
export async function cachedClips() {
  if (!('caches' in window)) return 0;
  const c = await caches.open(CACHE), keys = await c.keys();
  return keys.length;
}
let running = null;
/** Download all missing clips. onProgress(done, total). Returns {done, failed}. */
export function downloadAllAudio(onProgress) {
  if (running) return running;
  running = (async () => {
    const c = await caches.open(CACHE);
    const have = new Set((await c.keys()).map(r => new URL(r.url).pathname));
    const todo = [...AUDIO].map(pathOf).filter(p => !have.has(p));
    const total = AUDIO.size; let done = total - todo.length, failed = 0, i = 0;
    onProgress?.(done, total);
    const worker = async () => {
      while (i < todo.length) {
        const p = todo[i++];
        try { const r = await fetch(p); if (r.status === 200) await c.put(p, r); else failed++; } catch { failed++; }
        done++; if (done % 25 === 0 || done === total) onProgress?.(done, total);
      }
    };
    await Promise.all(Array.from({ length: 12 }, worker));
    onProgress?.(done, total);
    running = null;
    return { done, failed };
  })();
  return running;
}
export async function clearAudio() { if ('caches' in window) await caches.delete(CACHE); }
