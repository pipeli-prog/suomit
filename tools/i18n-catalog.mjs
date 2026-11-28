// Lists every English string SuomiT shows that a language pack does not translate yet, with context for the
// translator. Run: node tools/i18n-catalog.mjs nl   (or es; --all lists everything, translated or not)
// Writes i18n/_todo/<lang>/<group>.json  ({ "English string": "context" }) and prints the counts.
// Groups → pack files: ui → i18n/<lang>/ui.js, words → words.js, practice-<part> → practice-<part>.js (one per
// data/practice/<part>.js), readings → readings.js,
// course → course.js (lesson ids whose explanation cards still need writing).
// Sources: every t('literal') in js/, every data string shown to learners, and every string the question
// generators ask for at runtime (all drills × many runs, every word in every exercise mode, every practice set).
// Strings only screens produce at runtime (e.g. after a crawl) can be added with --extra <file.json> (an array).
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

globalThis.localStorage = { getItem: () => null, setItem() { } };
globalThis.window = globalThis;
globalThis.document = { addEventListener() { }, removeEventListener() { }, createElement() { return {}; }, querySelector() { return null; }, documentElement: {} };

const lang = process.argv[2];
const ALL = process.argv.includes('--all');
const extraArg = process.argv.indexOf('--extra');
if (!lang || lang === 'en') { console.error('usage: node tools/i18n-catalog.mjs <nl|es> [--all] [--extra file.json]'); process.exit(2); }
const root = new URL('..', import.meta.url);
const R = p => new URL(p, root).href;
const I = await import(R('js/i18n.js'));
const pack = await import(R(`i18n/${lang}/index.js`));
const have = pack.DICT, course = pack.COURSE || {};

const PARTS = ['m1a', 'm1b', 'm2', 'm34'];
const groups = { ui: new Map(), words: new Map(), readings: new Map(), ...Object.fromEntries(PARTS.map(p => ['practice-' + p, new Map()])) };
const put0 = (g, s, ctx = '') => { if (typeof s !== 'string' || !s.trim() || !/[A-Za-z]/.test(s)) return; if (!groups[g].has(s)) groups[g].set(s, ctx); };

// ---- 1. literal keys in the code: t('…'), t("…"), t(`…`) without ${}
const put = put0;
const walk = d => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : p.endsWith('.js') ? [p] : []; });
const jsDir = new URL('js/', root).pathname;
const RE = /\bt\(\s*(?:'((?:\\.|[^'\\])*)'|"((?:\\.|[^"\\])*)"|`((?:\\.|[^`\\$])*)`)/g;
const unq = s => s.replace(/\\(['"`\\])/g, '$1').replace(/\\n/g, '\n');
for (const f of walk(jsDir)) {
  if (f.endsWith('i18n.js')) continue;
  const src = readFileSync(f, 'utf8'), rel = f.slice(jsDir.length);
  for (const m of src.matchAll(RE)) put('ui', unq(m[1] ?? m[2] ?? m[3]), 'code: js/' + rel);
}

// ---- 2. data shown to learners
const { VOCAB } = await import(R('data/vocab.js'));
for (const w of VOCAB) if (w.ex?.en) put('words', w.ex.en, `translation of the example sentence "${w.ex.fi}"`);
for (const w of VOCAB) put('words', w.en, `meaning of the Finnish ${w.pos === 'p' ? 'phrase' : 'word'} "${w.fi}"${w.pos && w.pos !== 'p' ? ` (${{ n: 'noun', v: 'verb', a: 'adjective', adv: 'adverb', q: 'question word', num: 'number' }[w.pos] || w.pos})` : ''}`);
const { VERBS } = await import(R('data/verbs.js'));
for (const v of VERBS) put('words', v.en, `meaning of the Finnish verb "${v.inf}"`);
const { MODULES } = await import(R('data/course.js'));
for (const m of MODULES) put('ui', m.title, `title of course module ${m.n} ("${m.fi}")`);
const Gm = await import(R('js/gamify.js')), Ms = await import(R('js/mascots.js'));
for (const it of [...Gm.COSMETICS, ...Gm.SHOP]) put('ui', it.en, `shop: description of the ${it.kind} "${it.name}"`);
for (const it of Gm.SHOP) if (it.kind === 'freeze') put('ui', it.name, 'shop: name of the streak-freeze item');
for (const a of Object.values(Ms.ANIMALS)) put('ui', a.en, `shop: description of the animal "${a.name}" (a ${a.fi})`);
for (const a of Gm.ACH) if (!a.mod) put('ui', a.en, `achievement description (its Finnish name "${a.name}" stays)`);
const { GLOSSARY } = await import(R('data/glossary.js'));
for (const [f, g] of Object.entries(GLOSSARY)) { if (g[1] !== '=') put('words', g[1], `meaning of the Finnish word "${f}" (basic form "${g[0]}"), shown when it is tapped`); if (g[2]) put('words', g[2], `grammar note for the Finnish form "${f}" (of "${g[0]}")`); }
const { PRACTICE_TR } = await import(R('data/practice/tr.js'));
for (const [fi, en] of Object.entries(PRACTICE_TR)) put('words', en, `meaning of the Finnish practice answer "${fi}", shown after answering`);
const { TOPICS } = await import(R('data/vocab.js'));
for (const tp of TOPICS) put('words', tp.title, 'title of a word-list topic');
const { PRACTICE } = await import(R('data/practice/index.js'));
const fiLike = s => /[äöÄÖ]/.test(s);
for (const part of PARTS) for (const [les, sets] of Object.entries((await import(R(`data/practice/${part}.js`))).default)) for (const s of sets) {
  const put = (g, ...a) => put0('practice-' + part, ...a);
  const at = `lesson ${les}, practice set "${s.title}" (${s.kind})`;
  put('practice', s.title, `title of a practice set in lesson ${les} (keep Finnish titles as they are)`);
  put('practice', s.note, `one-line description of ${at}`);
  for (const it of s.items || []) {
    if (Array.isArray(it)) { put('practice', it[1], `${at}: meaning of "${it[0]}"`); continue; }
    if (s.kind === 'mc') {
      put('practice', it.q, `${at}: question${it.en ? ` (hint: "${it.en}")` : ''}; options ${JSON.stringify(it.o)} (if this is Finnish, keep it exactly)`);
      for (const o of it.o) put('practice', o, `${at}: answer option for "${it.q}" (if this is Finnish, keep it exactly)`);
      put('practice', it.en, `${at}: English hint shown under "${it.q}"`);
    } else put('practice', it.en, `${at}: translation of "${it.fi || it.s}"`);
  }
  for (const [fi, en] of s.text || []) put('practice', en, `${at}: translation of the sentence "${fi}"`);
  for (const q of s.q || []) { put('practice', q.en, `${at}: translation of the question "${q.q}"`); for (const o of q.o || []) if (!fiLike(o)) put('practice', o, `${at}: answer option for "${q.q}" (if this is Finnish, keep it exactly)`); }
}
const { READINGS } = await import(R('data/readings.js'));
for (const r of READINGS) {
  put('readings', r.en, `title of the reading "${r.title}"`);
  for (const [fi, en] of r.s || []) put('readings', en, `reading "${r.title}": translation of "${fi}"`);
  for (const q of r.q || []) { put('readings', q.en, `reading "${r.title}": translation of the question "${q.q}"`); for (const o of q.o || []) if (!fiLike(o)) put('readings', o, `reading "${r.title}": answer option for "${q.q}" (if this is Finnish, keep it exactly)`); }
}
const { TWISTERS } = await import(R('data/twisters.js'));
for (const tw of TWISTERS) { put('readings', tw.en, `meaning of the tongue twister "${tw.fi}"`); put('readings', tw.focus, `which sounds the tongue twister "${tw.fi}" trains`); }

// ---- 3. strings the generators ask for at runtime
I.usePack(lang, { DICT: {}, COURSE: {} }); // empty pack: every t() call is recorded as missing
I.clearMissing();
const E = await import(R('js/exercises.js'));
for (const sk of Object.keys(E.SKILL_NAMES)) for (let i = 0; i < 400; i++) { try { E.SKILLS[sk](); } catch { } }
for (const w of VOCAB) for (const m of ['intro', 'mcFiEn', 'mcEnFi', 'listenMc', 'listenType', 'typeEnFi', 'tiles']) { try { E.vocabQ(w, { force: m }); } catch { } }
try { const P = await import(R('js/practice.js')); for (const sets of Object.values(PRACTICE)) for (const s of sets) try { P.setQuestions(s); } catch { } } catch { }
const known = new Set(Object.values(groups).flatMap(g => [...g.keys()]));
// sentences the drills compose from data, one key each (every verb × person, colour × garment, …): js/exercises.js i18nKeys()
for (const s of E.i18nKeys?.() || []) if (!known.has(s)) put('ui', s, 'drill prompt built from data (js/exercises.js); keep {placeholders}; he/she = hij/zij, él/ella; you (pl.) = jullie, vosotros');
for (const s of I.missing()) if (!s.startsWith('lesson:') && !known.has(s)) put('ui', s, 'asked for at runtime by a question generator / screen');
if (extraArg > 0) for (const s of JSON.parse(readFileSync(process.argv[extraArg + 1], 'utf8'))) if (!known.has(s)) put('ui', s, 'shown on a screen (runtime crawl)');

// ---- write the to-do lists
const out = new URL(`i18n/_todo/${lang}/`, root).pathname;
mkdirSync(out, { recursive: true });
const summary = [];
for (const [g, m] of Object.entries(groups)) {
  const todo = Object.fromEntries([...m].filter(([s]) => ALL || have[s] == null));
  writeFileSync(out + g + '.json', JSON.stringify(todo, null, 1));
  summary.push(`${g}: ${Object.keys(todo).length} to do / ${m.size}`);
}
const { LESSONS } = await import(R('data/course.js'));
const lessonsTodo = LESSONS.filter(l => ALL || !course[l.id]).map(l => ({ id: l.id, title: l.title, fi: l.fi, goals: l.goals, learn: l.learn }));
writeFileSync(out + 'course.json', JSON.stringify(lessonsTodo, null, 1));
summary.push(`course: ${lessonsTodo.length} lessons to do / ${LESSONS.length}`);
// placeholders must survive translation
const bad = Object.entries(have).filter(([en, x]) => { const ph = s => (String(s).match(/\{\w+\}/g) || []).sort().join(); return ph(en) !== ph(x); });
if (bad.length) summary.push(`placeholder mismatches: ${bad.length} (e.g. ${JSON.stringify(bad[0])})`);
console.log(`${lang}: ` + summary.join(' · '));
