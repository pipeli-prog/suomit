// Lookup index: any known (inflected) form → dictionary entry. Powers tap-to-translate everywhere.
import { VOCAB, VOCAB_BY_ID } from '../data/vocab.js';
import { VERBS } from '../data/verbs.js';
import { COUNTRIES, PLACES, NAMES } from '../data/grammar.js';
import { present, negative, past, local, hv, OLLA_SPOKEN, ADESSIVE_PRON, GENITIVE_PRON, PERSONS, numWord } from './fi.js';
import { state } from './store.js';
import { PRACTICE } from '../data/practice/index.js';

let IDX = null;
const add = (form, entry, note) => {
  if (!form) return;
  const k = form.toLowerCase();
  if (!IDX.has(k)) IDX.set(k, { ...entry, note });
};
function build() {
  IDX = new Map();
  for (const w of VOCAB) {
    if (w.pos === 'p') continue;
    const e = { id: w.id, fi: w.fi, en: w.en, pos: w.pos, gen: w.gen, part: w.part, pl: w.pl };
    add(w.fi, e);
    if (w.gen) {
      add(w.gen, e, 'genitive'); add(w.part, e, 'partitive'); add(w.pl, e, 'plural');
      const st = w.gen.slice(0, -1);
      for (const [suf, n] of [['ssa', 'in'], ['sta', 'from (inside)'], ['lla', 'on / at / has'], ['lta', 'from (off)'], ['lle', 'to (onto)'], ['ksi', 'into (becoming)'], ['na', 'as']])
        add(st + hv(suf, w.fi), e, n);
      if (w.pl) { const ps = w.pl.slice(0, -1); add(ps + 'ille', e, 'to (plural)'); }
    }
  }
  for (const v of VERBS) {
    const e = { id: v.id, fi: v.inf, en: v.en, pos: 'v', type: v.type, verb: v };
    add(v.inf, e);
    present(v).forEach((f, i) => add(f, e, `${PERSONS[i]} (present)`));
    add(v.a, e, 'negative / stem');
    const p = past(v); if (p) p.forEach((f, i) => add(f, e, `${PERSONS[i]} (past)`));
    present(v).forEach((f, i) => add(f + hv('ko', v.inf), e, `${PERSONS[i]}? (question)`));
  }
  OLLA_SPOKEN.forEach(f => add(f.split(' ')[1], { fi: 'olla', en: 'to be (spoken form)', pos: 'v' }));
  ['en', 'et', 'ei', 'emme', 'ette', 'eivät'].forEach((f, i) => add(f, { fi: 'ei', en: `not (negative verb, ${PERSONS[i]})`, pos: 'v' }));
  ADESSIVE_PRON.forEach((f, i) => add(f, { fi: PERSONS[i], en: `${['I', 'you', 'he/she', 'we', 'you (pl.)', 'they'][i]} have… (at ${PERSONS[i]})`, pos: 'pr' }));
  GENITIVE_PRON.forEach((f, i) => add(f, { fi: PERSONS[i], en: `${['my', 'your', 'his/her', 'our', 'your (pl.)', 'their'][i]}`, pos: 'pr' }));
  for (const c of COUNTRIES) {
    add(c.fi, { fi: c.fi, en: c.en, pos: 'n' });
    add(c.from, { fi: c.fi, en: 'from ' + c.en, pos: 'n' });
    add(c.nat, { fi: c.nat, en: `${c.en} (person/nationality)`, pos: 'a' });
    add(c.langPart, { fi: c.lang, en: `${c.langEn} (language, partitive)`, pos: 'n' });
  }
  for (const p of PLACES) {
    const l = local(p), base = VOCAB_BY_ID['w:' + p.fi.toLowerCase()] || { fi: p.fi, en: p.en, pos: 'n' };
    const e = { id: base.id, fi: p.fi, en: p.en, pos: 'n', gen: base.gen, part: base.part, pl: base.pl };
    add(p.fi, e); add(l.missa, e, 'where? (in/at)'); add(l.mista, e, 'from where?'); add(l.mihin, e, 'to where?');
  }
  for (const n of NAMES) { add(n.gen, { fi: n.fi, en: `${n.fi}'s`, pos: 'name' }); add(n.ade, { fi: n.fi, en: `${n.fi} has… (at ${n.fi})`, pos: 'name' }); }
  for (let i = 0; i <= 100; i++) add(numWord(i), { fi: numWord(i), en: String(i), pos: 'num' });
  for (const sets of Object.values(PRACTICE)) for (const st of sets) {
    const pairs = st.kind === 'pairs' ? st.items : st.kind === 'listen' ? st.items.map(q => [q.fi, q.en]) : [];
    for (const [fi, en] of pairs) if (fi && en && !String(fi).includes(' ')) add(fi, { fi, en, pos: 'x' });
  }
}

/** Look up a token. Returns {fi, en, pos, note, id?} or null. */
export function lookup(word) {
  if (!IDX) build();
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
