// "Say it in Finnish": you see a sentence in your own language and build the Finnish, with word tiles or by typing.
// Producing whole sentences (not just recognising words) is what makes the words and endings usable: the learner has
// to choose the right form (kahvia, not kahvi) and the word order. The sentences come from everything SuomiT already
// has with a translation: practice sets (build / gap / true-false), the graded readings and the word-order drill.
// Sentences are chosen so that (almost) every word in them is one you have already met (comprehensible practice).
import { PRACTICE } from '../data/practice/index.js';
import { READINGS } from '../data/readings.js';
import { LESSONS } from '../data/course.js';
import { VOCAB, VOCAB_BY_ID } from '../data/vocab.js';
import { GLOSSARY } from '../data/glossary.js';
import { TWISTERS } from '../data/twisters.js';
import { SENTENCES } from './exercises.js';
import { lookup } from './lexicon.js';
import { present, PERSONS } from './fi.js';
import { state } from './store.js';
import { t } from './i18n.js';

const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const LESSON_IX = Object.fromEntries(LESSONS.map((l, i) => [l.id, i]));
const words = fi => fi.replace(/[.!?]+$/, '').replace(/,/g, '').split(/\s+/).filter(Boolean);
const isSentence = (fi, en) => {
  const n = words(fi).length;
  return n >= 2 && n <= 9 && /[.!?]$/.test(fi.trim()) && /[.!?]$/.test(String(en).trim()) && !/["“”«»:;()\d€]|_/.test(fi)
    && !/\(|wrong|true|false|correct/i.test(en) && /^[A-ZÅÄÖ]/.test(fi);
};

let BANK = null;
/** Every usable [fi, en] sentence with the lesson it belongs to (lesson index; readings use their lesson). */
export function bank() {
  if (BANK) return BANK;
  const out = new Map();
  const put = (fi, en, lesson, alts = []) => { fi = fi.trim(); if (isSentence(fi, en) && !out.has(fi)) out.set(fi, { fi, en, li: LESSON_IX[lesson] ?? 99, alts }); };
  for (const [lesson, sets] of Object.entries(PRACTICE)) for (const st of sets) for (const it of st.items || []) {
    if (st.kind === 'order') put(it.fi, it.en, lesson);
    else if (st.kind === 'tf' && it.a === true) put(it.s, it.en, lesson);
    else if (st.kind === 'gap' && /(^|\s)_{2,}([\s.,!?]|$)/.test(it.s)) put(it.s.replace(/_{2,}/, (Array.isArray(it.a) ? it.a : [it.a])[0]), it.en, lesson);
  }
  for (const r of READINGS) for (const [fi, en] of r.s) put(fi, en, r.lesson);
  for (const [fi, en, alts] of SENTENCES) put(fi, en, 'm4-1', alts || []);
  for (const tw of TWISTERS) out.delete(tw.fi); // tongue twisters are for the mouth, not for building
  // you build standard Finnish; spoken forms (mä, toi, kaks) are for listening and reading
  const spoken = w => { const k = w.toLowerCase(), g = GLOSSARY[k], e = lookup(w); return g?.[2] === 'spoken Finnish' || /spoken|puhekieli/i.test(VOCAB_BY_ID[e?.id]?.en || ''); };
  for (const [fi] of [...out]) if (words(fi).some(spoken)) out.delete(fi);
  // every word must be in the dictionary (you can tap it in the feedback). ids: a vocabulary id, or true for words
  // that need no learning (pronouns, names, numbers), or false for a word that is not SuomiT vocabulary
  const idOf = (w, i) => { const e = lookup(w); return e.id || ['pr', 'name', 'num', 'place', 'letter'].includes(e.pos) || (i > 0 && /^[A-ZÅÄÖ]/.test(w)) || false; };
  BANK = [...out.values()].filter(s => words(s.fi).every(w => lookup(w))).map(s => ({ ...s, ids: words(s.fi).map(idOf) }));
  return BANK;
}

/** How familiar a sentence is: the share of its words whose vocabulary card you have (words without an id, like
 *  pronouns and names, count as known). */
function familiarity(s, cards) {
  return s.ids.filter(id => id === true || (id && cards[id])).length / s.ids.length;
}
/** Pick n sentences: from lessons you have reached, mostly made of words you know (at most one new word). */
export function pickSentences(n, { lesson } = {}) {
  const S = state(), cards = S.cards;
  // lessons you have reached: up to the current one (the first without a star), never fewer than the first that has sentences
  const cur = LESSONS.findIndex(l => (S.lessons[l.id]?.stars || 0) < 1);
  const reached = Math.max(cur < 0 ? LESSONS.length : cur, Math.min(...bank().map(s => s.li)));
  let pool = bank().filter(s => lesson ? s.li === LESSON_IX[lesson] : s.li <= reached);
  if (!lesson) {
    const good = pool.filter(s => familiarity(s, cards) >= .75);
    pool = good.length >= n ? good : pool.sort((a, b) => familiarity(b, cards) - familiarity(a, cards)).slice(0, Math.max(n * 3, 12));
  }
  const seen = S.sent || {};
  // sentences you have not built recently first
  return shuffle(pool).sort((a, b) => (seen[a.fi] || 0) - (seen[b.fi] || 0)).slice(0, n);
}

// Words that may move to the front or the end of a sentence without changing its meaning (Finnish word order is free
// for time words: "Huomenna menen kauppaan" = "Menen kauppaan huomenna").
const MOVABLE = new Set(['tänään', 'huomenna', 'eilen', 'nyt', 'aamulla', 'illalla', 'päivällä', 'yöllä', 'usein', 'aina', 'joskus', 'sitten', 'myöhemmin', 'viikonloppuna', 'kesällä', 'talvella', 'syksyllä', 'keväällä']);
const DROP_PRON = { minä: 1, sinä: 1, me: 1, te: 1 };
/** Accepted answers: the sentence, its listed alternatives, a dropped minä/sinä/me/te, a time word moved. */
export function variants(s) {
  const base = words(s.fi), out = new Set([base.join(' '), ...s.alts.map(a => words(a).join(' '))]);
  for (const v of [...out]) {
    const w = v.split(' ');
    if (DROP_PRON[w[0].toLowerCase()] && w.length > 2) out.add(w.slice(1).join(' '));
    // and the other way round: "Menemme saunaan" may also be written "Me menemme saunaan"
    const vb = lookup(w[0])?.verb, i = vb ? present(vb).indexOf(w[0].toLowerCase()) : -1;
    if ([0, 1, 3, 4].includes(i)) out.add([PERSONS[i][0].toUpperCase() + PERSONS[i].slice(1), w[0].toLowerCase(), ...w.slice(1)].join(' '));
    w.forEach((x, i) => {
      if (!MOVABLE.has(x.toLowerCase())) return;
      const rest = w.filter((_, j) => j !== i);
      out.add([x, ...rest].join(' ')); out.add([...rest, x].join(' '));
    });
  }
  return [...out];
}

/** The question. mode 'tiles' (tap the words in order, with a few look-alike extra words) or 'type'. */
export function sentenceQ(s, mode = 'tiles') {
  const tr = t(s.en), toks = words(s.fi), answer = variants(s);
  const base = { skill: 'sentence', skillName: t('Say it in Finnish'), say: s.fi, full: s.fi, tr, sent: s.fi, prompt: `<div class="big">${esc(tr)}</div>` };
  if (mode === 'type') return { ...base, kind: 'type', sub: t('Write it in Finnish'), answer };
  // extra tiles: another form of a word in the sentence (kahvi for kahvia: you must pick the right ending) and one
  // other word you know
  const lower = new Set(toks.map(x => x.toLowerCase())), extra = [];
  for (const w of shuffle(toks)) {
    const e = lookup(w), f = e?.fi?.replace(/[!?.]$/, '');
    if (f && !f.includes(' ') && !lower.has(f.toLowerCase()) && e.pos !== 'num') { extra.push(w[0] === w[0].toUpperCase() && w !== toks[0] ? f : f.toLowerCase()); break; }
  }
  const known = VOCAB.filter(w => state().cards[w.id] && !w.fi.includes(' ') && w.pos !== 'p' && !lower.has(w.fi.toLowerCase()));
  const pool = known.length >= 4 ? known : VOCAB.filter(w => !w.fi.includes(' ') && w.pos !== 'p' && !lower.has(w.fi.toLowerCase()));
  while (extra.length < (toks.length > 5 ? 2 : 3)) { const w = pool[Math.floor(Math.random() * pool.length)]?.fi; if (!w) break; if (!extra.includes(w)) extra.push(w); }
  return { ...base, kind: 'tiles', sub: t('Build it in Finnish'), answer, tiles: shuffle([...toks, ...extra]) };
}

/** n sentence questions: tiles while a sentence's words are new to you, typing once you know them well. */
export function sentenceQs(n, opts) {
  const cards = state().cards;
  return pickSentences(n, opts).map(s => {
    const strong = s.ids.every(id => id === true || (id && (cards[id]?.s || 0) >= 4));
    return sentenceQ(s, strong && words(s.fi).length <= 6 && Math.random() < .6 ? 'type' : 'tiles');
  });
}
