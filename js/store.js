// SuomiT state: persistence, derived stats (XP, coins, streak), sync codes, merging.
import { review, isLearned, isMature, DAY } from './srs.js';

const KEY = 'suomit.v1';
export const today = (d = new Date()) => {
  const z = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
};
export const dayOffset = (k, n) => { const [y, m, d] = k.split('-').map(Number); return today(new Date(y, m - 1, d + n)); };

const fresh = () => ({
  v: 1, created: Date.now(), updated: Date.now(),
  profile: { name: '', goal: 50, sound: true, haptics: true, rate: 0.9, voice: '', strictDots: false, theme: 'talviyo', autoSpeak: true, updated: 0 },
  mascot: { hat: null, face: null, neck: null, color: 'grey' },
  days: {},      // 'YYYY-MM-DD' → { xp, coins, ans, ok, new, rev, listen, best, q: {questId: progress}, qc: {questId:1}, read }
  frozen: {},    // days saved by a streak freeze
  spent: {},     // purchaseId → coins
  owned: { 'theme:talviyo': 1, 'color:grey': 1 },
  cards: {},     // itemId → FSRS card
  skills: {},    // skillId → FSRS card + acc
  lessons: {},   // lessonId → { stars, learned, best, sessions }
  res: {},       // resource url → timestamp watched
  reads: {},     // reading id → best score
  lists: [{ id: 'mine', name: 'My words', items: [], created: 1 }],
  custom: {},    // 'c:…' → {fi,en}
  ach: {},       // achievement id → ts
  best: { combo: 0, speed: 0, match: 0 },
});

let S = load();
const subs = new Set();
/** Fill in defaults, including NESTED ones (an old save without profile.goal must not break the streak). */
function hydrate(raw) {
  const f = fresh(), out = Object.assign(f, raw);
  for (const k of ['profile', 'mascot', 'best', 'owned']) out[k] = { ...fresh()[k], ...(raw?.[k] || {}) };
  for (const k of ['days', 'frozen', 'spent', 'cards', 'skills', 'lessons', 'res', 'reads', 'custom', 'ach']) if (!out[k] || typeof out[k] !== 'object') out[k] = {};
  if (!Array.isArray(out.lists) || !out.lists.length) out.lists = fresh().lists;
  return out;
}
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return hydrate(JSON.parse(raw));
  } catch (e) { /* private mode etc. */ }
  return fresh();
}
let saveT = null;
const write = () => { saveT = null; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } };
export function save() {
  S.updated = Date.now();
  clearTimeout(saveT);
  saveT = setTimeout(write, 120);
  subs.forEach(f => f(S));
}
/** Write a pending save immediately (the debounced write would be lost if the tab is closed within 120 ms). */
export function flush() { if (saveT) { clearTimeout(saveT); write(); } }
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('pagehide', flush);
  window.addEventListener('visibilitychange', () => { if (typeof document !== 'undefined' && document.visibilityState === 'hidden') flush(); });
}
export const state = () => S;
export const subscribe = f => (subs.add(f), () => subs.delete(f));
export function replace(next) { S = hydrate(next); save(); }
export function resetAll() { S = fresh(); save(); }

// ------------------------------------------------------------ day log
export function dayRec(k = today()) { return (S.days[k] ||= { xp: 0, coins: 0, ans: 0, ok: 0, new: 0, rev: 0, listen: 0, best: 0, q: {}, qc: {} }); }
export function addXp(n) {
  const d = dayRec(); const before = d.xp;
  d.xp += n;
  // 1 coin ("markka") per 10 XP
  d.coins += Math.floor(d.xp / 10) - Math.floor(before / 10);
  // remember that the goal was met that day, so raising the goal later does not break an existing streak
  if (d.xp >= S.profile.goal) d.met = 1;
  save();
}
export function addCoins(n) { dayRec().coins += n; save(); }
export const totalXp = () => Object.values(S.days).reduce((a, d) => a + (d.xp || 0), 0);
export const coins = () => Object.values(S.days).reduce((a, d) => a + (d.coins || 0), 0) - Object.values(S.spent).reduce((a, b) => a + b, 0);
export function spend(id, price) { if (coins() < price) return false; S.spent[id] = price; save(); return true; }
export const level = (xp = totalXp()) => Math.floor(1 + Math.sqrt(xp / 60));
export const levelXp = l => 60 * (l - 1) ** 2;
export const RANKS = ['Aloittelija', 'Turisti', 'Kielikurssilainen', 'Kahvinjuoja', 'Saunoja', 'Mökkeilijä', 'Sisu-soturi', 'Revontuli', 'Kalevan sankari', 'Suomen mestari'];
export const rank = (l = level()) => RANKS[Math.min(RANKS.length - 1, Math.floor((l - 1) / 3))];

// ------------------------------------------------------------ streak
// realMet = you actually hit your goal; goalMet also includes frozen days (they keep a streak alive but don't add to it)
const realMet = k => !!S.days[k]?.met || (S.days[k]?.xp || 0) >= S.profile.goal;
const goalMet = k => realMet(k) || !!S.frozen[k];
export const goalMetOn = k => goalMet(k);
export const freezesOwned = () => Object.keys(S.spent).filter(k => k.startsWith('freeze:')).length - Object.keys(S.frozen).length;
/** Use streak freezes for missed days (called on app start). */
export function applyFreezes() {
  const t = today();
  let k = dayOffset(t, -1), missed = [];
  while (!goalMet(k) && missed.length < 7) { missed.push(k); k = dayOffset(k, -1); }
  // only save a streak that existed before the gap
  if (!missed.length || !goalMet(k)) return 0;
  // all-or-nothing: freezing only part of a gap would spend shields and still lose the streak
  if (freezesOwned() < missed.length) return 0;
  for (const m of missed) S.frozen[m] = 1;
  save();
  return missed.length;
}
export function streak() {
  const t = today();
  let n = 0, k = goalMet(t) ? t : dayOffset(t, -1);
  while (goalMet(k)) { if (realMet(k)) n++; k = dayOffset(k, -1); }
  return n;
}
export function bestStreak() {
  const keys = Object.keys({ ...S.days, ...S.frozen }).sort();
  let best = 0, run = 0, prev = null;
  for (const k of keys) {
    if (!goalMet(k)) { run = 0; prev = k; continue; }
    const cont = prev && dayOffset(prev, 1) === k && goalMet(prev);
    run = (cont ? run : 0) + (realMet(k) ? 1 : 0);
    best = Math.max(best, run); prev = k;
  }
  return best;
}

// ------------------------------------------------------------ cards
export function grade(id, g) {
  const was = S.cards[id];
  S.cards[id] = review(was, g);
  const d = dayRec();
  if (!was) d.new++; else d.rev++;
  save();
  return S.cards[id];
}
export function gradeSkill(id, acc) {
  const g = acc >= 0.95 ? 4 : acc >= 0.8 ? 3 : acc >= 0.6 ? 2 : 1;
  const was = S.skills[id];
  S.skills[id] = { ...review(was, g), acc: was?.acc == null ? acc : was.acc * 0.6 + acc * 0.4 };
  save();
}
export const card = id => S.cards[id];
export const learnedCount = () => Object.values(S.cards).filter(isLearned).length;
export const matureCount = () => Object.values(S.cards).filter(isMature).length;
export const dueIds = (now = Date.now()) => Object.entries(S.cards).filter(([, c]) => c.due <= now).sort((a, b) => a[1].due - b[1].due).map(([id]) => id);
export function forecast(days = 7) {
  const out = Array(days).fill(0), now = Date.now();
  for (const c of Object.values(S.cards)) {
    const i = Math.floor((c.due - now) / DAY) + 1;
    if (c.due <= now) out[0]++; else if (i < days) out[i]++;
  }
  return out;
}

// ------------------------------------------------------------ lists
export function inList(listId, item) { return !!S.lists.find(l => l.id === listId)?.items.includes(item); }
export function toggleList(listId, item) {
  const l = S.lists.find(x => x.id === listId); if (!l) return;
  const i = l.items.indexOf(item);
  if (i >= 0) l.items.splice(i, 1); else l.items.push(item);
  save();
  return i < 0;
}
export function newList(name) { const l = { id: 'l' + Date.now().toString(36), name, items: [], created: Date.now() }; S.lists.push(l); save(); return l; }
export function deleteList(id) { S.lists = S.lists.filter(l => l.id !== id || id === 'mine'); save(); }
export function renameList(id, name) { const l = S.lists.find(x => x.id === id); if (l) { l.name = name; save(); } }
export function addCustom(fi, en) {
  const id = 'c:' + fi.toLowerCase().trim();
  S.custom[id] = { fi: fi.trim(), en: en.trim() }; save(); return id;
}

// ------------------------------------------------------------ lessons & misc
export function lessonRec(id) { return (S.lessons[id] ||= { stars: 0, learned: false, best: 0, sessions: 0 }); }
export function setStars(id, n) { const r = lessonRec(id); r.stars = Math.max(r.stars, n); save(); }
export function unlockAch(id) { if (S.ach[id]) return false; S.ach[id] = Date.now(); save(); return true; }
export function setProfile(patch) { Object.assign(S.profile, patch, { updated: Date.now() }); save(); }

// ------------------------------------------------------------ sync codes (gzip + base64url)
const b64 = {
  enc: u8 => { let s = ''; u8.forEach(b => s += String.fromCharCode(b)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); },
  dec: str => { const s = atob(str.replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(s, c => c.charCodeAt(0)); },
};
async function pipe(data, stream) { return new Uint8Array(await new Response(new Blob([data]).stream().pipeThrough(stream)).arrayBuffer()); }
export async function exportCode() {
  const json = new TextEncoder().encode(JSON.stringify(S));
  if ('CompressionStream' in window) return 'SUOMIT1.' + b64.enc(await pipe(json, new CompressionStream('gzip')));
  return 'SUOMIT0.' + b64.enc(json);
}
export async function decodeCode(code) {
  code = code.trim().replace(/\s+/g, '');
  const [tag, body] = code.split('.');
  let bytes = b64.dec(body);
  if (tag === 'SUOMIT1') bytes = await pipe(bytes, new DecompressionStream('gzip'));
  else if (tag !== 'SUOMIT0') throw new Error('Not a SuomiT sync code');
  return JSON.parse(new TextDecoder().decode(bytes));
}
/** Merge another device's state into this one. Nothing is lost: union of history, newest card state wins. */
export function merge(o) {
  const a = S;
  const maxDay = (x = {}, y = {}) => {
    const r = { ...x };
    for (const [k, v] of Object.entries(y)) {
      if (k === 'q' || k === 'qc') { r[k] = { ...(x[k] || {}) }; for (const [q, p] of Object.entries(v || {})) r[k][q] = Math.max(r[k][q] || 0, p); }
      else r[k] = Math.max(x[k] || 0, v || 0);
    }
    return r;
  };
  for (const [k, d] of Object.entries(o.days || {})) a.days[k] = maxDay(a.days[k], d);
  Object.assign(a.frozen, o.frozen); Object.assign(a.spent, o.spent); Object.assign(a.owned, o.owned);
  Object.assign(a.custom, o.custom); Object.assign(a.res, o.res);
  for (const [k, v] of Object.entries(o.ach || {})) a.ach[k] = Math.min(a.ach[k] || Infinity, v);
  for (const coll of ['cards', 'skills']) for (const [k, c] of Object.entries(o[coll] || {}))
    if (!a[coll][k] || (c.last || 0) > (a[coll][k].last || 0)) a[coll][k] = c;
  for (const [k, l] of Object.entries(o.lessons || {})) {
    const m = a.lessons[k] ||= { stars: 0, learned: false, best: 0, sessions: 0 };
    m.stars = Math.max(m.stars, l.stars || 0); m.best = Math.max(m.best, l.best || 0);
    m.learned = m.learned || l.learned; m.sessions = Math.max(m.sessions, l.sessions || 0);
  }
  for (const [k, v] of Object.entries(o.reads || {})) a.reads[k] = Math.max(a.reads[k] || 0, v);
  for (const l of o.lists || []) {
    const m = a.lists.find(x => x.id === l.id);
    if (!m) a.lists.push({ ...l, items: [...new Set(l.items || [])] }); else m.items = [...new Set([...m.items, ...(l.items || [])])];
  }
  for (const k of Object.keys(a.best)) a.best[k] = Math.max(a.best[k] || 0, o.best?.[k] || 0);
  if ((o.profile?.updated || 0) > (a.profile.updated || 0)) { a.profile = { ...fresh().profile, ...o.profile }; a.mascot = { ...fresh().mascot, ...(o.mascot || a.mascot) }; }
  save();
}
