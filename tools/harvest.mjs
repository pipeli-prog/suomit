#!/usr/bin/env node
// Harvest every Finnish string SuomiT can speak → tools/speech-strings.json (priority order).
// Run from the repo root:  node tools/harvest.mjs [--max-mb 60]
// Strings are keyed exactly like js/audio.js: text.trim().replace(/\s+/g, ' ').
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// ---------------------------------------------------------------- browser shims (modules import under Node)
const mem = new Map();
globalThis.window = globalThis;
globalThis.localStorage = { getItem: k => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, String(v)), removeItem: k => mem.delete(k) };
const el = () => ({ style: {}, classList: { add() { }, remove() { }, toggle() { } }, appendChild() { }, addEventListener() { }, setAttribute() { }, querySelector: () => null, querySelectorAll: () => [] });
globalThis.document = { addEventListener() { }, createElement: el, querySelector: () => null, querySelectorAll: () => [], getElementById: () => null, body: el(), documentElement: el() };
try { globalThis.navigator ??= {}; } catch { }

// Seeded Math.random: the generator samples (and so tools/speech-strings.json) are the same on every run.
let seed = 20251126;
Math.random = () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const imp = p => import(new URL('../' + p, import.meta.url));
const F = await imp('js/fi.js');
const { VOCAB } = await imp('data/vocab.js');
const { VERBS } = await imp('data/verbs.js');
const { READINGS } = await imp('data/readings.js');
const G = await imp('data/grammar.js');
const { LESSONS, MODULES } = await imp('data/course.js');
let EX = null;
try { EX = await imp('js/exercises.js'); } catch (e) { console.warn('! js/exercises.js failed to import, skipping generators:', e.message); }

const args = process.argv.slice(2);
const MAX_MB = args.includes('--max-mb') ? +args[args.indexOf('--max-mb') + 1] : 60;
const GEN_RUNS = 400;

// ---------------------------------------------------------------- collection
export const key = t => String(t).trim().replace(/\s+/g, ' ');
// Priority order: when the size cap bites, later categories are dropped first (generator samples
// are ordered by how often sampling hit them, so the rare ones go first).
const PRIORITY = ['vocab', 'readings', 'practice', 'phrases', 'numbers', 'learn', 'verb-drills', 'verbs', 'grammar', 'generators', 'tap-words', 'vocab-forms', 'answers'];
const BY = Object.fromEntries(PRIORITY.map(c => [c, new Map()])); // category → key → hits
function add(category, t) {
  if (t == null) return;
  const k = key(t);
  if (!k || !/[a-zåäö]/i.test(k)) return; // digits-only, symbols, empty
  const m = BY[category]; m.set(k, (m.get(k) || 0) + 1);
}
const each = (category, list) => list.forEach(t => add(category, t));
const tokens = s => (String(s || '').match(F.WORD_RE) || []);
const TOKEN_SRC = []; // texts whose single words are tappable (tap-to-translate popover speaks the word)

// 1. vocabulary
for (const w of VOCAB) {
  add('vocab', w.fi);
  if (w.ex?.fi) add('vocab', w.ex.fi);
  TOKEN_SRC.push(w.fi, w.ex?.fi);
}
for (const w of VOCAB) each('vocab-forms', [w.gen, w.part, w.pl]);

// 2. verbs
const cap = s => s[0].toUpperCase() + s.slice(1);
for (const v of VERBS) {
  add('verbs', v.inf);
  each('verbs', F.present(v));
  each('verbs', F.negative(v));
  each('verbs', F.past(v) || []);
  each('verbs', F.present(v).map(f => f + F.qSuffix(v.inf)));
}
// drill phrases the verb generators speak, enumerated (conjQ in js/exercises.js)
for (const v of VERBS) {
  if (v.inf === 'olla') continue;
  F.present(v).forEach((f, p) => add('verb-drills', `${F.PERSONS[p]} ${f}`));
  F.negative(v).forEach((f, p) => add('verb-drills', `${F.PERSONS[p]} ${f}`));
  [1, 2, 4].forEach(p => add('verb-drills', `${cap(F.present(v)[p] + F.qSuffix(v.inf))} ${F.PERSONS[p]}?`));
  (F.past(v) || []).forEach((f, p) => add('verb-drills', `Eilen ${F.PERSONS[p]} ${f}.`));
}

// 2b. in-app practice sets (rebuilt course resources)
{
  const { PRACTICE } = await imp('data/practice/index.js');
  const fiLike = t => typeof t === 'string' && /[a-zäöå]/i.test(t);
  for (const sets of Object.values(PRACTICE)) for (const st of sets) {
    const it = st.items || [];
    if (st.kind === 'pairs') it.forEach(([fi]) => add('practice', fi));
    if (st.kind === 'listen') it.forEach(q => add('practice', q.fi));
    if (st.kind === 'order') it.forEach(q => add('practice', q.fi));
    if (st.kind === 'tf') it.forEach(q => add('practice', q.s));
    if (st.kind === 'gap') it.forEach(q => { const a = Array.isArray(q.a) ? q.a[0] : q.a; add('practice', q.s.replace(/_{2,}/, a)); });
    if (st.kind === 'mc') it.forEach(q => { if (q.say) add('practice', q.say); });
    if (st.kind === 'read') { (st.text || []).forEach(([fi]) => add('practice', fi)); (st.q || []).forEach(q => { add('practice', q.q); (q.o || []).forEach(o => fiLike(o) && add('practice', o)); }); }
  }
}
// 3. readings
for (const r of READINGS) {
  add('readings', r.title);
  for (const s of r.s) add('readings', s[0]);
  for (const q of r.q || []) { add('readings', q.q); each('readings', q.o || []); }
  TOKEN_SRC.push(r.title, ...r.s.map(s => s[0]), ...(r.q || []).flatMap(q => [q.q, ...(q.o || [])]));
}

// 4. phrases & fixed app strings
add('phrases', 'Hyvää huomenta, mitä kuuluu?'); // settings "test voice"
if (EX) for (let i = 0; i < 300; i++) add('phrases', EX.SKILLS.phrases().say);

// 5. numbers 0..100
for (let n = 0; n <= 100; n++) { add('numbers', F.numWord(n)); each('numbers', F.numSpoken(n)); }

// 6. learn cards: *finnish* (not **bold**), as md() in js/ui.js renders them (per line / table cell)
const stripTags = s => s.replace(/<[^>]+>/g, '');
for (const l of LESSONS) {
  add('learn', l.fi); TOKEN_SRC.push(l.fi);
  for (const c of l.learn || []) {
    for (const raw of String(c.body || '').split('\n')) {
      const line = raw.trim();
      const cells = line.startsWith('|') ? line.replace(/^\||\|$/g, '').split('|') : [line];
      for (const cell of cells) {
        const s = cell.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
        for (const m of s.matchAll(/\*(.+?)\*/g)) { const t = stripTags(m[1]); add('learn', t); TOKEN_SRC.push(t); }
      }
    }
  }
}
for (const m of MODULES) { add('learn', m.fi); TOKEN_SRC.push(m.fi); }

// 7. grammar lists
for (const c of G.COUNTRIES) each('grammar', [c.fi, c.nat, c.from, c.lang, c.langPart, `Olen kotoisin ${c.from}.`, `Puhun ${c.langPart}.`]);
for (const p of G.PLACES) { const l = F.local(p); each('grammar', [p.fi, l.missa, l.mista, l.mihin]); }
for (const n of G.NAMES) each('grammar', [n.fi, n.gen, n.ade]);
for (const [, name] of G.LETTERS) add('grammar', name);
for (const [a, , b] of G.MINIMAL_PAIRS) each('grammar', [a, b]);
for (const [d, na] of G.DAYS) each('grammar', [d, na]);
for (const [m, ssa] of G.MONTHS) each('grammar', [m, ssa]);
for (const [s, lla] of G.SEASONS) each('grammar', [s, lla]);
for (const [r] of G.RELDAYS) add('grammar', r);
for (const [a, b] of G.OPPOSITES) each('grammar', [a, b]);
for (const [pp] of G.POSTPOSITIONS) add('grammar', pp);
each('grammar', [...F.PERSONS, ...F.NEG, ...F.OLLA_SPOKEN, ...F.OLLA_SPOKEN_NEG, ...F.ADESSIVE_PRON, ...F.GENITIVE_PRON]);

// 8. exercise generators: every `say` (sampled), then Finnish answers
const answers = [];
const looksFinnish = s => typeof s === 'string' && /[a-zåäö]/i.test(s) && !/^type \d$/.test(s) && !/€|\d:\d/.test(s);
if (EX) {
  for (const k of Object.keys(EX.SKILL_NAMES)) {
    const g = EX.SKILLS[k]; if (!g) continue;
    for (let i = 0; i < GEN_RUNS; i++) {
      let q; try { q = g(); } catch (e) { console.warn(`! skill ${k}:`, e.message); break; }
      add('generators', q.say);
      TOKEN_SRC.push(q.say);
      if (!q.listen || q.fiChoices) answers.push(...(Array.isArray(q.answer) ? q.answer : [q.answer]));
      if (q.fiChoices) TOKEN_SRC.push(...q.choices);
    }
  }
  for (const w of VOCAB) for (const force of ['intro', 'mcFiEn', 'mcEnFi', 'listenMc', 'typeEnFi']) {
    const q = EX.vocabQ(w, { force }); add('vocab', q.say);
  }
  // Finnish answers: only for questions whose answer is Finnish (prices/clock/verb types are English or digits)
  for (const a of answers) if (looksFinnish(a)) add('answers', a);
}

// 9. single tappable words (tap-to-translate speaks the tapped word as written)
for (const s of TOKEN_SRC) for (const t of tokens(s)) add('tap-words', t);

// ---------------------------------------------------------------- order + size budget
// Generator strings are random samples: the ones seen most often are the ones the app says most often.
const ORDER = [], CAT = new Map(), cat = {};
for (const c of PRIORITY) {
  const list = [...BY[c].entries()];
  if (c === 'generators') list.sort((a, b) => b[1] - a[1]);
  for (const [k] of list) if (!CAT.has(k)) { CAT.set(k, c); ORDER.push(k); cat[c] = (cat[c] || 0) + 1; }
}
// Calibrated on edge-tts NooraNeural mp3 (48 kbps) after trailing-silence trim: ≈ 4.8 kB + 0.3 kB per character.
const estBytes = t => 4800 + 295 * t.length;
let total = 0;
const kept = [], dropped = {};
for (const k of ORDER) {
  const b = estBytes(k);
  if (total + b > MAX_MB * 1e6) { const c = CAT.get(k); dropped[c] = (dropped[c] || 0) + 1; continue; }
  total += b; kept.push(k);
}

const out = { counts: cat, dropped, estimatedMB: +(total / 1e6).toFixed(1), strings: kept };
writeFileSync(join(ROOT, 'tools/speech-strings.json'), JSON.stringify(out, null, 1) + '\n');
console.log('harvested by category:', cat);
if (Object.keys(dropped).length) console.log('dropped by size cap:', dropped);
console.log(`total unique: ${ORDER.length}, kept: ${kept.length}, est. ${(total / 1e6).toFixed(1)} MB → tools/speech-strings.json`);
process.exit(0);
