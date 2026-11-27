// Lookup index: any known (inflected) form → dictionary entry. Powers tap-to-translate everywhere.
import { VOCAB, VOCAB_BY_ID } from '../data/vocab.js';
import { VERBS } from '../data/verbs.js';
import { COUNTRIES, PLACES, NAMES } from '../data/grammar.js';
import { present, negative, past, local, hv, OLLA_SPOKEN, ADESSIVE_PRON, GENITIVE_PRON, PERSONS, numWord } from './fi.js';
import { state } from './store.js';
import { PRACTICE } from '../data/practice/index.js';
import { t, lang } from './i18n.js';

// Meanings and notes are stored in the learner's language. The index is built on the first lookup (after the
// language pack has loaded) and rebuilt if the language is different from the one it was built in.
let IDX = null, IDX_LANG = null;
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
  for (const w of VOCAB) {
    if (w.pos === 'p') continue;
    const e = { id: w.id, fi: w.fi, en: t(w.en), pos: w.pos, gen: w.gen, part: w.part, pl: w.pl };
    add(w.fi, e);
    if (w.gen) {
      add(w.gen, e, gen); add(w.part, e, part); add(w.pl, e, plural);
      const st = w.gen.slice(0, -1);
      for (const [suf, n] of cases) add(st + hv(suf, w.fi), e, n);
      if (w.pl) { const ps = w.pl.slice(0, -1); add(ps + 'ille', e, toPl); }
    }
  }
  const pres = P.map(v => t('{person} (present)', v)), pst = P.map(v => t('{person} (past)', v)), qst = P.map(v => t('{person}? (question)', v)), stem = t('negative / stem');
  for (const v of VERBS) {
    const e = { id: v.id, fi: v.inf, en: t(v.en), pos: 'v', type: v.type, verb: v };
    add(v.inf, e);
    present(v).forEach((f, i) => add(f, e, pres[i]));
    add(v.a, e, stem);
    const p = past(v); if (p) p.forEach((f, i) => add(f, e, pst[i]));
    present(v).forEach((f, i) => add(f + hv('ko', v.inf), e, qst[i]));
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
  for (const sets of Object.values(PRACTICE)) for (const st of sets) {
    const pairs = st.kind === 'pairs' ? st.items : st.kind === 'listen' ? st.items.map(q => [q.fi, q.en]) : [];
    for (const [fi, en] of pairs) if (fi && en && !String(fi).includes(' ')) add(fi, { fi, en: t(en), pos: 'x' });
  }
}

/** Look up a token. Returns {fi, en, pos, note, id?} or null. */
export function lookup(word) {
  if (!IDX || IDX_LANG !== lang()) build();
  const w = word.toLowerCase().replace(/^[-']+|[-']+$/g, '');
  let r = IDX.get(w);
  if (r) return r;
  for (const [id, c] of Object.entries(state().custom)) if (c.fi.toLowerCase() === w) return { id, fi: c.fi, en: c.en, pos: 'custom' };
  // clitics: -ko/-kö, -kin, -kaan, -han, -pa, possessive -ni/-si
  for (const suf of ['kaan', 'kään', 'kin', 'han', 'hän', 'ko', 'kö', 'pa', 'pä', 'ni', 'si', 'mme', 'nne', 'nsa', 'nsä']) {
    if (w.endsWith(suf) && w.length > suf.length + 2) {
      r = IDX.get(w.slice(0, -suf.length)) || IDX.get(w.slice(0, -suf.length) + 'n');
      if (r) return { ...r, note: (r.note ? r.note + ' + ' : '') + '-' + suf };
    }
  }
  return null;
}
export function phraseLookup(text) {
  const t = text.trim().toLowerCase().replace(/[.!?]$/, '');
  return VOCAB.find(w => w.fi.toLowerCase().replace(/[.!?]$/, '') === t) || null;
}
