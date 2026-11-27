// Speech (pre-generated neural Finnish clips, device-voice fallback) + small synthesized sound effects.
import { state } from './store.js';
import { AUDIO } from '../data/audio-index.js';

let voices = [];
function loadVoices() { voices = (window.speechSynthesis?.getVoices() || []).filter(v => /^fi/i.test(v.lang)); }
if ('speechSynthesis' in window) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
export const finnishVoices = () => voices;
export const hasFinnishVoice = () => voices.length > 0;
/** Pre-generated neural clips (audio/, see tools/) are available for most strings. */
export const hasNeuralAudio = () => true;

// ---------- clip lookup: key = first 12 hex of SHA-1(UTF-8 of normalized text); must match tools/gen_audio.py
const norm = t => String(t).trim().replace(/\s+/g, ' ');
/** Small synchronous SHA-1 (keeps speak() synchronous, so it stays inside the tap's user gesture). */
function sha1hex(str) {
  const b = new TextEncoder().encode(str), n = ((b.length + 8) >> 6) + 1, w = new Uint32Array(n * 16);
  for (let i = 0; i < b.length; i++) w[i >> 2] |= b[i] << (24 - (i & 3) * 8);
  w[b.length >> 2] |= 0x80 << (24 - (b.length & 3) * 8);
  w[n * 16 - 1] = b.length * 8;
  let h0 = 0x67452301, h1 = 0xEFCDAB89, h2 = 0x98BADCFE, h3 = 0x10325476, h4 = 0xC3D2E1F0;
  const x = new Uint32Array(80), rol = (v, s) => (v << s) | (v >>> (32 - s));
  for (let o = 0; o < w.length; o += 16) {
    for (let t = 0; t < 80; t++) x[t] = t < 16 ? w[o + t] : rol(x[t - 3] ^ x[t - 8] ^ x[t - 14] ^ x[t - 16], 1);
    let a = h0, b2 = h1, c = h2, d = h3, e = h4;
    for (let t = 0; t < 80; t++) {
      const f = t < 20 ? (b2 & c) | (~b2 & d) : t < 40 ? b2 ^ c ^ d : t < 60 ? (b2 & c) | (b2 & d) | (c & d) : b2 ^ c ^ d;
      const k = t < 20 ? 0x5A827999 : t < 40 ? 0x6ED9EBA1 : t < 60 ? 0x8F1BBCDC : 0xCA62C1D6;
      const tmp = (rol(a, 5) + f + e + k + x[t]) | 0;
      e = d; d = c; c = rol(b2, 30); b2 = a; a = tmp;
    }
    h0 = (h0 + a) | 0; h1 = (h1 + b2) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0; h4 = (h4 + e) | 0;
  }
  return [h0, h1, h2, h3, h4].map(v => (v >>> 0).toString(16).padStart(8, '0')).join('');
}
const hashes = new Map();
function clipFor(text) {
  const k = norm(text);
  let h = hashes.get(k);
  if (h === undefined) { h = sha1hex(k).slice(0, 12); hashes.set(k, h); }
  return AUDIO.has(h) ? `audio/${h.slice(0, 2)}/${h}.mp3` : null;
}

// ---------- one reused <audio> element (iOS only lets an element that was started in a gesture play later)
const SILENT = 'data:audio/mpeg;base64,//NExAAAAANIAAAAAExBTUU0LjBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTQu//NExFMAAANIAAAAADBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTQu//NExKYAAANIAAAAADBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NExKwAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NExKwAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';
const el = typeof Audio === 'function' ? new Audio() : null;
let unlocked = false, playId = 0;
if (el) {
  el.preload = 'auto';
  const unlock = () => {
    if (unlocked) return off();
    if (!el.paused) return; // a clip started by this very gesture is already playing, leave it alone
    el.src = SILENT;
    el.play().then(() => { unlocked = true; off(); })
      // AbortError = a speak() in the same gesture replaced the silent clip, which unlocks just as well
      .catch(e => { if (e?.name === 'AbortError') { unlocked = true; off(); } });
  };
  const opts = { capture: true, passive: true };
  const on = () => ['pointerdown', 'touchend'].forEach(t => document.addEventListener(t, unlock, opts));
  const off = () => ['pointerdown', 'touchend'].forEach(t => document.removeEventListener(t, unlock, opts));
  on();
}
function stopClip() {
  playId++;
  if (el && !el.paused) el.pause();
}

// ---------- device voice (fallback)
function tts(text, rate, onend) {
  if (!('speechSynthesis' in window)) { onend?.(); return; }
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/\.\.\./g, ' '));
  u.lang = 'fi-FI';
  const p = state().profile;
  const v = voices.find(v => v.name === p.voice) || voices.find(v => /satu|onni|noora|harri|selma/i.test(v.name)) || voices[0];
  if (v) u.voice = v;
  u.rate = rate;
  if (onend) u.onend = onend;
  speechSynthesis.speak(u);
}

// ---------- clip plans: a whole clip, or recorded pieces (sentences → comma groups → words) played back to back.
// Random drill sentences (phone numbers, forecasts, big numbers) have no clip of their own, but their parts do.
const strip = t => t.replace(/[.,!?…:;]+$/, '');
const findClip = t => clipFor(t) || clipFor(strip(t)) || clipFor(strip(t).toLowerCase());
const LEVELS = [[/(?<=[.!?])\s+/, 260], [/(?<=,)\s+/, 160], [/\s+/, 30]]; // split pattern, pause after each piece (ms)
const plans = new Map();
/** [[src, pauseAfterMs], …] covering `text`, or null when some part has no recording. */
export function clipPlan(text) {
  const k = norm(text);
  if (plans.has(k)) return plans.get(k);
  const out = [];
  const cover = (t, lv) => {
    const c = findClip(t);
    if (c) { out.push([c, 0]); return true; }
    if (lv >= LEVELS.length) return false;
    const [re, pause] = LEVELS[lv], parts = t.split(re).filter(Boolean);
    if (parts.length < 2) return cover(t, lv + 1);
    return parts.every((p, i) => { if (!cover(p, lv + 1)) return false; if (i < parts.length - 1) out[out.length - 1][1] = Math.max(out[out.length - 1][1], pause); return true; });
  };
  const plan = k && cover(k, 0) ? out : null;
  plans.set(k, plan);
  return plan;
}

export function speak(text, { rate, onend } = {}) {
  stopClip();
  if (!text) { onend?.(); return; }
  const r = rate || state().profile.rate || 0.9;
  const plan = el && clipPlan(text);
  if (!plan) return tts(text, r, onend);
  window.speechSynthesis?.cancel();
  const id = playId, live = () => id === playId;
  const fallback = () => { if (!live()) return; playId++; tts(text, r, onend); }; // offline + not cached, blocked, etc.
  // Clips are recorded at the voice's natural pace; the device-voice rate 0.9 = 1×. Gentler than linear: 0.55 → ~0.7×.
  const speed = Math.min(2, Math.max(0.5, 1 + (r - 0.9) * 0.85));
  let i = 0;
  const play = () => {
    el.src = plan[i][0];
    el.playbackRate = el.defaultPlaybackRate = speed;
    el.preservesPitch = el.webkitPreservesPitch = el.mozPreservesPitch = true;
    el.play().catch(e => { if (e?.name !== 'AbortError') fallback(); });
  };
  el.onended = () => {
    if (!live()) return;
    const pause = plan[i][1] / speed;
    if (++i >= plan.length) { playId++; onend?.(); return; }
    setTimeout(() => { if (live()) play(); }, pause);
  };
  el.onerror = fallback;
  play(); // the first piece starts synchronously, inside the tap's gesture (iOS)
}
export const stopSpeaking = () => { stopClip(); window.speechSynthesis?.cancel(); };

// ---------- sfx
// iPhone: Web Audio is muted by the silent switch and can get cut off when a voice clip starts. The 'playback'
// audio session (Safari 17+) makes the sounds behave like the voice clips: they play like media does.
try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { }
let ctx, out;
const wake = () => {
  try {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      // one soft master chain: gentle low-pass + compressor, so no sound is ever sharp or loud
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 5200;
      const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 4;
      out = ctx.createGain(); out.gain.value = 0.9;
      out.connect(lp).connect(comp).connect(ctx.destination);
    }
    // 'suspended' before the first tap, 'interrupted' on iPhone after a call / another app / a voice clip
    if (ctx.state !== 'running') {
      ctx.resume();
      const b = ctx.createBuffer(1, 1, 22050), src = ctx.createBufferSource(); src.buffer = b; src.connect(ctx.destination); src.start(0);
    }
  } catch (e) { }
};
// iOS only lets a page start audio in touchend / click (pointerdown does not count), so wake on all of them
if (typeof document !== 'undefined') for (const t of ['pointerdown', 'touchend', 'click'])
  document.addEventListener(t, () => { if (state().profile.sound) wake(); }, { capture: true, passive: true });

/** One soft note: sine body + a quiet octave for shine, fast attack, smooth exponential tail. */
function note(freq, t0 = 0, dur = 0.18, gain = 0.09, bend = 0) {
  const c = ctx, t = c.currentTime + t0 + 0.005;
  for (const [mult, g0] of [[1, 1], [2, 0.18]]) {
    const o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(freq * mult, t);
    if (bend) o.frequency.exponentialRampToValueAtTime(freq * mult * bend, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain * g0, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(out); o.start(t); o.stop(t + dur + 0.03);
  }
}
/** A tiny filtered click, like a key on a phone keyboard. */
function click(gain = 0.05, freq = 2400) {
  const c = ctx, t = c.currentTime + 0.003, n = Math.floor(c.sampleRate * 0.012), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 6);
  const src = c.createBufferSource(), bp = c.createBiquadFilter(), g = c.createGain();
  src.buffer = b; bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = 1.4; g.gain.value = gain;
  src.connect(bp).connect(g).connect(out); src.start(t);
}
let lastTap = 0;
const SFX = {
  tap: () => { const n = performance.now(); if (n - lastTap < 80) return; lastTap = n; click(0.045); }, // one click per tap, however many handlers ask
  flip: () => click(0.05, 1600),
  ok: () => { note(1046.5, 0, 0.16, 0.07); note(1568, 0.075, 0.32, 0.075); },             // soft two-note "pling" (C6 → G6)
  combo: () => { note(1046.5, 0, 0.14, 0.06); note(1318.5, 0.07, 0.14, 0.06); note(1568, 0.14, 0.36, 0.07); },
  bad: () => { note(330, 0, 0.2, 0.09, 0.82); note(247, 0.09, 0.26, 0.07, 0.9); },          // low, round "dum-dum", never harsh
  coin: () => { note(1760, 0, 0.1, 0.05); note(2349, 0.06, 0.28, 0.05); },
  win: () => [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => note(f, i * 0.09, 0.42, 0.06)),
};
export function sfx(name) {
  if (!state().profile.sound) return;
  try { wake(); if (ctx.state === 'running' || ctx.state === 'suspended') SFX[name]?.(); } catch (e) { }
}

// ---------- haptics
// Android: the vibration API. iPhone (iOS 18+): Safari has no vibration API, but toggling a native switch control
// gives the system "tick" haptic, so we toggle an invisible one. Must run inside a tap (click / touchend).
let hapLabel = null;
function iosTick() {
  if (!hapLabel) {
    hapLabel = document.createElement('label'); hapLabel.setAttribute('aria-hidden', 'true'); hapLabel.style.display = 'none';
    const i = document.createElement('input'); i.type = 'checkbox'; i.setAttribute('switch', ''); i.tabIndex = -1;
    hapLabel.appendChild(i); document.body.appendChild(hapLabel);
  }
  hapLabel.click();
}
const isIOS = typeof navigator !== 'undefined' && (/iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
/** kind: 'light' (a tap), 'ok' (right answer), 'bad' (wrong: two ticks). Old callers pass a number of ms. */
export function buzz(kind = 'light') {
  if (!state().profile.haptics) return;
  try {
    const ms = typeof kind === 'number' ? (kind >= 50 ? 'bad' : 'light') : kind;
    if (isIOS) { iosTick(); if (ms === 'bad') setTimeout(iosTick, 90); return; } // the second tick may be skipped outside the tap; that's fine
    navigator.vibrate?.(ms === 'bad' ? [18, 60, 18] : ms === 'ok' ? 14 : 8);
  } catch (e) { }
}
