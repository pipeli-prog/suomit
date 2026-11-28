// Lookup index: any known (inflected) form → dictionary entry. Powers tap-to-translate everywhere.
import { VOCAB, VOCAB_BY_ID } from '../data/vocab.js';
import { VERBS } from '../data/verbs.js';
import { COUNTRIES, PLACES, NAMES, LETTERS } from '../data/grammar.js';
import { GLOSSARY } from '../data/glossary.js';
import { present, negative, past, local, hv, OLLA_SPOKEN, ADESSIVE_PRON, GENITIVE_PRON, PERSONS, numWord, numSpoken, hourAblative } from './fi.js';
import { state } from './store.js';
import { PRACTICE } from '../data/practice/index.js';
import { t, lang } from './i18n.js';

// Meanings and notes are stored in the learner's language. The index is built on the first lookup (after the
// language pack has loaded) and rebuilt if the language is different from the one it was built in.
let IDX = null, IDX_LANG = null;
const VERB_BY_INF = Object.fromEntries(VERBS.map(v => [v.inf, { ...v, pos: 'v' }]));
const add = (form, entry, note) => {
  if (!form) return;
  const k = form.toLowerCase();
  if (!IDX.has(k)) IDX.set(k, { ...entry, note });
};
function build() {
  IDX = new Map(); IDX_LANG = lang();
  const P = PERSONS.map(person => ({ person }));
  const cases = [['ssa', t('in')], ['sta', t('from (inside)')], ['lla', t('on / at / has')], ['lta', t('from (off)')], ['lle', t('to (onto)')], ['ksi', t('into (becoming)')], ['na', t('as')]];
  const gen = t('genitive'), part = t('partitive'), plural = t('plural'), toPl = t('to (plural)');
  const stemN = t('stem (before an ending)'), into = t('into / to'), ess = t('as (essive)');
  PL = new Map();
  for (const w of VOCAB) {
    if (w.pos === 'p') continue;
    const e = { id: w.id, fi: w.fi, en: t(w.en), pos: w.pos, gen: w.gen, part: w.part, pl: w.pl };
    add(w.fi, e);
    if (w.gen) {
      add(w.gen, e, gen); add(w.part, e, part); add(w.pl, e, plural);
      const st = w.gen.slice(0, -1);
      for (const [suf, n] of cases) add(st + hv(suf, w.fi), e, n);
      if (w.pl) { const ps = w.pl.slice(0, -1); add(ps + 'ille', e, toPl); }
      add(st, e, stemN); // drills show the stem on its own: talo___ / kaupa___
      // illative (into): strong stem from the partitive + long vowel + n / h·n / seen
      const strong = w.part.replace(/(tt|t)?[aä]$/, ''), v = strong.slice(-1);
      if (/[aeiouyäö]$/.test(strong)) {
        add(strong + v + 'n', e, into); add(strong + 'h' + v + 'n', e, into); add(strong + 'seen', e, into);
        add(strong + 'na', e, ess); add(strong + 'nä', e, ess);
      } else add(st + 'seen', e, into); // huone → huoneeseen (gen stem huonee-)
      if (/ee$/.test(st)) add(st + 'seen', e, into);
      if (w.pl) for (const ps of plStems(w)) if (!PL.has(ps)) PL.set(ps, e);
    } else if (w.pos !== 'name') for (const f of w.fi.toLowerCase().split(/\s+/)) if (f.length > 1 && /[a-zåäö]/.test(f) && !w.fi.includes(' ')) add(f.replace(/[!?.,]/g, ''), e);
  }
  // one-word phrases ("Kiitos!", "Moi!") are words too
  for (const w of VOCAB) if (w.pos === 'p' && !/\s/.test(w.fi.trim())) add(w.fi.replace(/[!?.,]/g, ''), { id: w.id, fi: w.fi, en: t(w.en), pos: 'p' });
  const pres = P.map(v => t('{person} (present)', v)), pst = P.map(v => t('{person} (past)', v)), qst = P.map(v => t('{person}? (question)', v)), stem = t('negative / stem');
  for (const v of VERBS) {
    const e = { id: v.id, fi: v.inf, en: t(v.en), pos: 'v', type: v.type, verb: v };
    add(v.inf, e);
    present(v).forEach((f, i) => add(f, e, pres[i]));
    add(v.a, e, stem);
    const p = past(v); if (p) p.forEach((f, i) => add(f, e, pst[i]));
    present(v).forEach((f, i) => add(f + hv('ko', v.inf), e, qst[i]));
    for (const [f, n] of verbExtras(v)) add(f, e, n);
  }
  OLLA_SPOKEN.forEach(f => add(f.split(' ')[1], { fi: 'olla', en: t('to be (spoken form)'), pos: 'v' }));
  ['en', 'et', 'ei', 'emme', 'ette', 'eivät'].forEach((f, i) => add(f, { fi: 'ei', en: t('not (negative verb, {person})', P[i]), pos: 'v' }));
  const have = [t('I have… (at {person})', P[0]), t('you have… (at {person})', P[1]), t('he/she have… (at {person})', P[2]), t('we have… (at {person})', P[3]), t('you (pl.) have… (at {person})', P[4]), t('they have… (at {person})', P[5])];
  ADESSIVE_PRON.forEach((f, i) => add(f, { fi: PERSONS[i], en: have[i], pos: 'pr' }));
  const poss = [t('my'), t('your'), t('his/her'), t('our'), t('your (pl.)'), t('their')];
  GENITIVE_PRON.forEach((f, i) => add(f, { fi: PERSONS[i], en: poss[i], pos: 'pr' }));
  for (const c of COUNTRIES) {
    const country = t(c.en);
    add(c.fi, { fi: c.fi, en: country, pos: 'n' });
    add(c.from, { fi: c.fi, en: t('from {country}', { country }), pos: 'n' });
    add(c.nat, { fi: c.nat, en: t('{country} (person/nationality)', { country }), pos: 'a' });
    add(c.langPart, { fi: c.lang, en: t('{language} (language, partitive)', { language: t(c.langEn) }), pos: 'n' });
  }
  const where = t('where? (in/at)'), whence = t('from where?'), whither = t('to where?');
  for (const p of PLACES) {
    const l = local(p), base = VOCAB_BY_ID['w:' + p.fi.toLowerCase()] || { fi: p.fi, en: p.en, pos: 'n' };
    const e = { id: base.id, fi: p.fi, en: t(p.en), pos: 'n', gen: base.gen, part: base.part, pl: base.pl };
    add(p.fi, e); add(l.missa, e, where); add(l.mista, e, whence); add(l.mihin, e, whither);
  }
  for (const n of NAMES) { add(n.gen, { fi: n.fi, en: t("{name}'s", { name: n.fi }), pos: 'name' }); add(n.ade, { fi: n.fi, en: t('{name} has… (at {name})', { name: n.fi }), pos: 'name' }); }
  for (let i = 0; i <= 100; i++) add(numWord(i), { fi: numWord(i), en: String(i), pos: 'num' });
  for (let h = 1; h <= 12; h++) add(hourAblative(h), { fi: numWord(h), en: t('at {h} o\'clock', { h }), pos: 'num' });
  // words met in texts and practice sets that are not vocabulary of their own (data/glossary.js)
  for (const [form, g] of Object.entries(GLOSSARY)) {
    const base = VOCAB_BY_ID['w:' + g[0].toLowerCase()] || VERB_BY_INF[g[0].toLowerCase()];
    if (g[1] === '=' && !base) continue; // tools/test.mjs: every '=' has a vocabulary word
    add(form, { id: base?.id, fi: g[0], en: t(g[1] === '=' ? base.en : g[1]), pos: g[3] || base?.pos || 'x' }, g[2] ? t(g[2]) : undefined);
  }
  for (const [l, name] of LETTERS) { add(l, { fi: l, en: t('the letter {letter}', { letter: l.toUpperCase() }), pos: 'letter' }, t('its name is “{name}”', { name })); if (!name.includes(' ')) add(name, { fi: name, en: t('the name of the letter {letter}', { letter: l.toUpperCase() }), pos: 'letter' }); }
  for (const [ends, en] of ENDINGS) for (const x of ends.split(' ')) add(x, { fi: '-' + x, en: t(en), pos: 'ending' }, t('ending'));
  for (const sets of Object.values(PRACTICE)) for (const st of sets) {
    const pairs = st.kind === 'pairs' ? st.items : st.kind === 'listen' ? st.items.map(q => [q.fi, q.en]) : [];
    for (const [fi, en] of pairs) if (fi && en && !String(fi).includes(' ')) add(fi, { fi, en: t(en), pos: 'x' });
  }
}

// Endings on their own, as the lessons show them (*-ssa*, *-ko/-kö*): what each one means.
export const ENDINGS = [['ssa ssä', 'in (inside)'], ['sta stä', 'from, out of'], ['lla llä', 'on, at; (someone) has'], ['lta ltä', 'from (off)'], ['lle', 'to, onto; for (someone)'],
  ['ksi', 'into (becoming)'], ['ko kö', 'yes/no question ending'], ['vat vät', 'verb ending for “they”'], ['mme', 'verb ending for “we”; our'], ['tte', 'verb ending for “you (pl.)”'],
  ['nsa nsä', 'his / her / their (possessive ending)'], ['kin', 'too, also'], ['kaan kään', 'either, not even (in negative sentences)'], ['han hän', 'emphasis: … you know'],
  ['tta ttä', 'partitive ending'], ['seen', 'into (long words)'], ['isi', 'would (conditional)'], ['nen', 'word ending -nen (genitive -sen)']];
// ------------------------------------------------------------ plural case forms
// Plural endings (after the plural stem: talo-i-ssa, opettaj-i-a, talo-j-en) with what they mean.
let PL = new Map();
/** Plural oblique stems ("taloi", "kissoi", "opettaji", "suomalaisi", "huonei") a noun can take: several candidates,
 *  only real vocabulary stems are ever matched, so an extra wrong candidate does no harm. */
function plStems(w) {
  const s = w.pl.toLowerCase().replace(/t$/, ''), out = new Set(), last = s.slice(-1), base = s.slice(0, -1);
  if (/[ouyö]$/.test(last)) out.add(s + 'i');
  if (/[aä]$/.test(last)) { out.add(base + 'i'); out.add(base + (last === 'a' ? 'oi' : 'i')); }
  if (/e$/.test(last)) { out.add(base + 'i'); out.add(s.replace(/ee$/, 'ei')); }
  if (/i$/.test(last)) { out.add(base + 'ei'); out.add(base + 'i'); }
  if (/(aa|ää|oo|uu|yy|öö|ee)$/.test(s)) out.add(s.slice(0, -1) + 'i');            // maa → mai-ta, puu → pui-ta
  if (/(ie|uo|yö)$/.test(s)) out.add(s[s.length - 2] === 'i' ? s.slice(0, -2) + 'ei' : s.slice(0, -2) + s.slice(-1) + 'i'); // tie → tei, työ → töi
  return out;
}
/** Plural endings with what they mean (a function: t() runs after the language pack has loaded). */
const plEnd = () => [['ssa', t('in (plural)')], ['ssä', t('in (plural)')], ['sta', t('from (plural)')], ['stä', t('from (plural)')], ['lla', t('on / at / has (plural)')], ['llä', t('on / at / has (plural)')], ['lta', t('from (off, plural)')], ['ltä', t('from (off, plural)')], ['lle', t('to (plural)')], ['ksi', t('into (plural)')], ['na', t('as (plural)')], ['nä', t('as (plural)')], ['hin', t('into (plural)')], ['siin', t('into (plural)')], ['in', t('into (plural)')], ['den', t('of (plural genitive)')], ['tten', t('of (plural genitive)')], ['en', t('of (plural genitive)')], ['ta', t('some / plural partitive')], ['tä', t('some / plural partitive')], ['a', t('some / plural partitive')], ['ä', t('some / plural partitive')]];
let PL_END = null, PL_LANG = null;
function pluralLookup(w) {
  if (!PL_END || PL_LANG !== lang()) { PL_END = plEnd(); PL_LANG = lang(); }
  for (const [end, note] of PL_END) {
    if (!w.endsWith(end) || w.length < end.length + 3) continue;
    let st = w.slice(0, -end.length);
    if (end === 'den' || end === 'tten') st += 'i';                     // maiden, huoneitten
    let e = PL.get(st);
    if (!e && st.endsWith('j')) e = PL.get(st.slice(0, -1) + 'i');      // taloja, talojen (i → j between vowels)
    if (e) return { ...e, note };
  }
  return null;
}
// ------------------------------------------------------------ numbers (any compound: kolmesataakaksikymmentä, kolkytkaks…)
let NUM = null;
function numberLookup(w) {
  if (!NUM) {
    NUM = new Map();
    const put = (f, n) => { if (!NUM.has(f)) NUM.set(f, n); };
    for (let n = 0; n <= 100; n++) { put(numWord(n), n); for (const f of numSpoken(n)) put(f, n); }
    const ORD = ['', 'ensimmäinen', 'toinen', 'kolmas', 'neljäs', 'viides', 'kuudes', 'seitsemäs', 'kahdeksas', 'yhdeksäs', 'kymmenes'];
    ORD.forEach((f, n) => n && put(f, n + '.'));
  }
  if (NUM.has(w)) return numEntry(w, NUM.get(w));
  // written compounds: [thousands] [hundreds] [rest]
  const m = /^(?:(.*?)(tuhatta|tuhat))?(?:(.*?)(sataa|sata))?(.*)$/.exec(w);
  if (!m || (!m[2] && !m[4])) return null;
  const part = (s, dflt) => s === '' || s === undefined ? dflt : NUM.has(s) && typeof NUM.get(s) === 'number' ? NUM.get(s) : null;
  const k = m[2] ? part(m[1], 1) : 0, h = m[4] ? part(m[3], 1) : 0, r = m[5] ? part(m[5], 0) : 0;
  if (k === null || h === null || r === null || r >= 100) return null;
  return numEntry(w, k * 1000 + h * 100 + r);
}
const numEntry = (w, n) => ({ fi: w, en: String(n), pos: 'num', note: typeof n === 'string' ? t('ordinal number') : undefined });
// ------------------------------------------------------------ more verb forms
/** Imperatives, 3rd infinitive (menen syömään), passive (puhutaan, mennään), conditional (ottaisin). */
function verbExtras(v) {
  const out = [], inf = v.inf, aa = hv('a', inf), ty = v.type;
  const he = present(v)[5], strong = he.slice(0, -3);                 // puhuvat → puhu, tulevat → tule
  const cut = ty === 1 ? inf.slice(0, -1) : ty === 2 ? inf.slice(0, -2) : ty === 3 ? inf.slice(0, -2) : inf.slice(0, -1);
  if (ty >= 1 && ty <= 6) {
    out.push([v.a, t('command: you!')], [cut + 'k' + aa + aa, t('command: you all! / let\'s')]);
    for (const c of ['maan', 'massa', 'masta', 'matta']) out.push([strong + hv(c, inf), t('(to go / be) doing it')]);
    const pass = ty === 1 ? v.a.replace(/[aä]$/, 'e') + 't' + aa + aa + 'n' : inf + aa + 'n';
    out.push([pass, t('passive: people …, we … (spoken: let\'s)')], [ty === 1 ? v.a.replace(/[aä]$/, 'e') + 't' + aa : inf, t('passive, negative (ei …)')]);
    if (ty !== 2) {
      const cs = /e$/.test(strong) ? strong.slice(0, -1) : strong;
      ['isin', 'isit', 'isi', 'isimme', 'isitte', hv('isivat', inf)].forEach((e, i) => out.push([cs + hv(e, inf), t('would … ({person})', { person: PERSONS[i] })]));
    }
  }
  return out;
}

/** Look up a token. Returns {fi, en, pos, note, id?} or null. */
export function lookup(word) {
  if (!IDX || IDX_LANG !== lang()) build();
  const w = word.toLowerCase().replace(/^[-']+|[-']+$/g, '');
  let r = IDX.get(w) || numberLookup(w) || pluralLookup(w);
  if (r) return r;
  for (const [id, c] of Object.entries(state().custom)) if (c.fi.toLowerCase() === w) return { id, fi: c.fi, en: c.en, pos: 'custom' };
  // syllables and spelling shown with hyphens: nuk-ku-vat, puhu-a, O-U-T-I
  if (w.includes('-')) { r = lookup(w.replace(/-/g, '')); if (r) return r; }
  // clitics: -ko/-kö, -kin, -kaan, -han, -pa, possessive -ni/-si
  for (const suf of ['kaan', 'kään', 'kin', 'han', 'hän', 'ko', 'kö', 'pa', 'pä', 'ni', 'si', 'mme', 'nne', 'nsa', 'nsä']) {
    if (w.endsWith(suf) && w.length > suf.length + 2) {
      const b = w.slice(0, -suf.length);
      r = IDX.get(b) || IDX.get(b + 'n') || pluralLookup(b) || numberLookup(b);
      if (r) return { ...r, note: (r.note ? r.note + ' + ' : '') + '-' + suf };
    }
  }
  return null;
}
/** Is this text Finnish (not an English/Dutch/Spanish question or option)? Most of its words are in the dictionary
 *  and it has none of the little English words. Used before making words tappable. */
const EN_SMALL = /(?<!\p{L})(the|is|are|was|which|what|who|does|do|did|don't|doesn't|with|means?|you|your|a|an|of|to|it|its|this|that|for|and|or|how|word|words|sentence|not|i|in|am|at|by|my|from|have|has|be|say|ends?|adds?|drops?|choose|rain|snow|sun|clouds?|live|lives|speak|negative|question)(?!\p{L})/iu; // not \b: it splits ä/ö words ("isä" → "is")
export function isFinnish(text) {
  const s = String(text || ''); if (EN_SMALL.test(s.replace(/["“][^"”]*["”]/g, ''))) return false;
  const ws = s.match(/[A-Za-zÅÄÖåäö]+(?:-[A-Za-zÅÄÖåäö]+)*/g) || [];
  return ws.length > 0 && ws.filter(x => lookup(x)).length / ws.length > .6;
}
export function phraseLookup(text) {
  const t = text.trim().toLowerCase().replace(/[.!?]$/, '');
  return VOCAB.find(w => w.fi.toLowerCase().replace(/[.!?]$/, '') === t) || null;
}

// ------------------------------------------------------------ tappable Finnish text
const escT = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const WORD = /[A-Za-zÅÄÖåäöÉéÜü]+(?:[-'][A-Za-zÅÄÖåäö]+)*/g;
/** Words → tap targets, escaped in between (entities like &quot; are never split into "words"). Word pieces glued to
 *  a gap (ma___o) are not words. known: only words the dictionary has (answer options that are deliberately wrong). */
function wrapWords(s, known) {
  let out = '', last = 0;
  for (const m of s.matchAll(WORD)) {
    const a = m.index, b = a + m[0].length;
    out += escT(s.slice(last, a));
    const gap = s[a - 1] === '_' || s[b] === '_';
    out += gap || (known && !lookup(m[0])) ? escT(m[0]) : `<span class="fw">${escT(m[0])}</span>`;
    last = b;
  }
  return out + escT(s.slice(last));
}
/** Finnish text with tappable words. A (bracket) or "quote" inside it that is not Finnish (a meaning in the learner's
 *  language: "matto (carpet)", 'Miten sanotaan "dank je"?') stays plain text. */
export function fw(text, { known = false } = {}) {
  const s = String(text ?? '');
  return s.split(/(\([^()]*\)|"[^"]*"|“[^”]*”)/).map((seg, i) => {
    if (i % 2 === 0) return wrapWords(seg, known);
    const inner = seg.slice(1, -1);
    return isFinnish(inner) ? escT(seg[0]) + wrapWords(inner, known) + escT(seg.slice(-1)) : escT(seg);
  }).join('');
}
/** fw() only if the text is Finnish at all (practice-set questions can be English: "Which word means cat?"). */
export const fwIf = text => isFinnish(text) ? fw(text) : escT(text);
