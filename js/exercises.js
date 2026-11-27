// Exercise generators. Each skill returns fresh questions every time, so drills never run out.
// Every generator returns {kind: mc|type|tiles, prompt, sub, answer (string or array: [0] = canonical,
// the rest are other answers a learner may correctly give), choices, say, explain, reveal}.
// Correctness rules enforced here (and checked by tools/test.mjs):
//  - an MC question never offers two correct options (synonyms, shared meanings and alternative answers are removed);
//  - typed answers accept every reasonable correct variant (pronoun drop, word order, spoken/written where allowed);
//  - English prompts match the Finnish (articles, he/she + -s, plural).
import { VOCAB, VOCAB_BY_ID, TOPIC_BY_ID } from '../data/vocab.js';
import { VERBS } from '../data/verbs.js';
import { COUNTRIES, PLACES, POSTPOSITIONS, POSTPOS_THINGS, POSTPOS_REFS, NAMES, OPPOSITES, DAYS, MONTHS, SEASONS, RELDAYS, LETTERS, MINIMAL_PAIRS } from '../data/grammar.js';
import * as F from './fi.js';
import { state } from './store.js';
import { icon } from './icons.js';

// Local helpers (same behaviour as ui.js) so this module has no DOM/app dependencies and can be unit-tested in Node.
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = a => a[Math.floor(Math.random() * a.length)];
const sample = (a, n) => shuffle(a).slice(0, n);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fw = text => esc(text).replace(F.WORD_RE, m => `<span class="fw">${m}</span>`);

const W = fi => VOCAB_BY_ID['w:' + fi.toLowerCase()];
const cap = s => s[0].toUpperCase() + s.slice(1);
const PERS_EN = ['I', 'you', 'he/she', 'we', 'you (pl.)', 'they'];
const randInt = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const nouns = () => VOCAB.filter(w => w.pos === 'n' && w.gen && w.part && w.pl && !w.fi.includes(' ') && w.fi === w.fi.toLowerCase());
const uniq = a => [...new Set(a)];
/** First English gloss: "rug, carpet" → "rug", "tall; long" → "tall". */
const gloss = en => en.split(/[;,/]/)[0].trim();
/** English indefinite article. */
const aAn = s => (/^[aeiou]/i.test(s) && !/^(uni|eu|one)/i.test(s) ? 'an ' : 'a ') + s;
/** Subject pronoun may be dropped in 1st/2nd person only ("En ole kotona" is natural, "Ei ole kotona" is not). */
const dropPron = p => p !== 2 && p !== 5;

// ------------------------------------------------------------ meaning overlap (MC safety & synonyms)
const senseKey = s => s.toLowerCase().replace(/[!?.¡¿…"“”]/g, '').replace(/^\s*(to|a|an|the)\s+/, '').replace(/\s+/g, ' ').trim();
/** Split a gloss into senses on ; , / outside parentheses: "you (plural / formal)" stays one sense. */
function splitSenses(en) {
  const out = []; let depth = 0, cur = '';
  for (const ch of String(en)) {
    if (ch === '(') depth++;
    if (ch === ')') depth = Math.max(0, depth - 1);
    if (depth === 0 && /[;,/]/.test(ch)) { out.push(cur); cur = ''; } else cur += ch;
  }
  out.push(cur);
  return out.map(senseKey).filter(Boolean);
}
// English near-synonyms: words glossed with these are treated as "same meaning" when choosing MC distractors.
const SYN = [['big', 'large'], ['small', 'little'], ['hi', 'hello', 'hey'], ['bye', 'goodbye', 'see you'], ['shop', 'store'], ['film', 'movie'],
  ['autumn', 'fall'], ['flat', 'apartment'], ['mum', 'mother', 'mom'], ['dad', 'father'], ['sofa', 'couch'], ['beautiful', 'pretty', 'lovely'],
  ['nice', 'pleasant', 'lovely', 'kind', 'great', 'fine', 'comfortable'], ['thanks', 'thank you'], ['sorry', 'excuse me'], ['ill', 'sick'],
  ['glad', 'happy'], ['child', 'kid'], ['grandma', 'grandmother'], ['grandpa', 'grandfather'], ['job', 'work'], ['fast', 'quick'],
  ['difficult', 'hard'], ['yes', 'yeah'], ['ok', 'okay', 'alright', 'got it'], ['trip', 'journey', 'outing'], ['dinner', 'supper'],
  ['holiday', 'vacation'], ['candy', 'sweets'], ['cinema', 'movie theatre'], ['loud', 'noisy'], ['rug', 'carpet'], ['cap', 'hat'],
  ['jacket', 'coat'], ['exactly', 'precisely'], ["you're welcome", 'no problem'], ['what', 'which']];
const SYN_OF = new Map(); SYN.forEach((g, i) => g.forEach(w => SYN_OF.set(w, [...(SYN_OF.get(w) || []), i])));
/** Loose senses (parentheses removed) expanded with synonym-group ids, for "could this also be right?" checks. */
function looseSet(en) {
  const out = new Set();
  for (const s of splitSenses(String(en).replace(/\([^)]*\)/g, ' '))) { out.add(s); for (const g of SYN_OF.get(s) || []) out.add('#' + g); }
  return out;
}
const normFi = s => F.norm(s).replace(/[-']/g, '');
/** true if x could also be a correct answer where w is expected (same Finnish, or shared/synonymous English meaning). */
export function clash(w, x) {
  if (normFi(w.fi) === normFi(x.fi)) return true;
  const a = looseSet(w.en);
  for (const s of looseSet(x.en)) if (a.has(s)) return true;
  return false;
}
/** Other Finnish words a learner may type for w's English prompt (same part of speech, identical sense incl. qualifier). */
function synonymsFi(w) {
  const mine = new Set(splitSenses(w.en));
  return VOCAB.filter(x => x.id !== w.id && x.pos === w.pos && splitSenses(x.en).some(s => mine.has(s))).map(x => x.fi.replace(/[!?.]$/, ''));
}

// ------------------------------------------------------------ vocabulary
/** Choose the exercise format from how well the word is known: recognise → recall → listen. */
export function vocabQ(w, { force } = {}) {
  const c = state().cards[w.id];
  let pool = VOCAB.filter(x => x.pos === w.pos && x.id !== w.id);
  if (pool.length < 6) pool = VOCAB.filter(x => x.id !== w.id); // custom words have their own pos
  pool = pool.filter(x => !clash(w, x));
  const sameTopic = pool.filter(x => x.topics.some(t => (w.topics || []).includes(t)));
  const distract = (sameTopic.length >= 3 ? sameTopic : pool);
  // distractors must not clash with each other either (two identical-meaning options look like a trick)
  const pickD = key => { const out = []; for (const x of shuffle(distract)) { if (out.length >= 3) break; if (!out.some(o => clash(o, x) || o[key] === x[key])) out.push(x); } return out.map(x => x[key]); };
  const isPhrase = w.pos === 'p' || w.fi.includes(' ');
  const mode = force || (!c ? 'intro' : c.s < 2 ? pick(['mcFiEn', 'mcEnFi', 'listenMc']) : c.s < 6 ? pick(['typeEnFi', 'mcEnFi', 'listenMc', 'typeEnFi']) : pick(['typeEnFi', 'listenType', 'typeEnFi']));
  const base = { item: w.id, say: w.fi };
  switch (mode) {
    case 'intro': return { ...base, kind: 'intro', word: w };
    case 'mcFiEn': return { ...base, kind: 'mc', prompt: `<div class="big fi">${fw(w.fi)}</div>`, sub: 'What does this mean?', answer: w.en, choices: shuffle([w.en, ...pickD('en')]), autoSay: true };
    case 'mcEnFi': return { ...base, kind: 'mc', prompt: `<div class="big">${esc(w.en)}</div>`, sub: 'Choose the Finnish', answer: w.fi, choices: shuffle([w.fi, ...pickD('fi')]), fiChoices: true };
    case 'listenMc': return { ...base, kind: 'mc', listen: true, prompt: `<div class="big">${icon('speaker', 'xl')}</div>`, sub: 'Listen. Which word is it?', answer: w.fi, choices: shuffle([w.fi, ...pickD('fi')]), fiChoices: true, reveal: w.en };
    case 'listenType': return { ...base, kind: 'type', listen: true, prompt: `<div class="big">${icon('speaker', 'xl')}</div>`, sub: 'Type what you hear', answer: w.fi.replace(/[!?.]$/, ''), reveal: w.en };
    case 'tiles': {
      const toks = w.fi.replace(/[.!?]/g, '').split(' ').filter(Boolean);
      const lower = new Set(toks.map(t => t.toLowerCase().replace(/,$/, '')));
      const extra = sample(VOCAB.filter(x => x.pos !== 'p' && !x.fi.includes(' ') && !lower.has(x.fi.toLowerCase())).map(x => x.fi), Math.min(3, toks.length));
      return { ...base, kind: 'tiles', prompt: `<div class="big">${esc(w.en)}</div>`, sub: 'Build it in Finnish', answer: toks.join(' '), tiles: shuffle([...toks, ...extra]) };
    }
    default: { // typeEnFi
      if (isPhrase && w.fi.split(' ').length >= 3) return vocabQ(w, { force: 'tiles' });
      const syn = w.pos === 'custom' ? [] : synonymsFi(w);
      return { ...base, kind: 'type', prompt: `<div class="big">${esc(w.en)}</div>`, sub: w.pos === 'n' && w.gen ? 'In Finnish (basic form)' : 'In Finnish', answer: uniq([w.fi.replace(/[!?.]$/, ''), ...syn]), synonyms: syn.length > 0 };
    }
  }
}
export const flashQ = (w, dir = 'fi') => ({ kind: 'flash', item: w.id, say: w.fi, word: w, dir });

// ------------------------------------------------------------ skills
const S = {};
const type = (prompt, answer, o = {}) => ({ kind: 'type', prompt, answer, ...o });
/** MC with up to 3 RANDOM distractors (never a fixed subset: the right answer must not stand out). */
const mc = (prompt, answer, choices, o = {}) => ({ kind: 'mc', prompt, answer, choices: shuffle([answer, ...sample(uniq(choices.filter(c => c !== answer)), 3)]), ...o });
const P = (fi, en) => `<div class="big fi">${fw(fi)}</div>${en ? `<div class="en-hint">${esc(en)}</div>` : ''}`;

S.letters = () => {
  if (Math.random() < .5) {
    const [l, name] = pick(LETTERS);
    return mc(`<div class="big">“${esc(name)}”</div>`, l.toUpperCase(), LETTERS.map(x => x[0].toUpperCase()), { sub: 'Which letter has this name?', say: name });
  }
  const w = pick(['kissa', 'talo', 'äiti', 'kukka', 'Liisa', 'Pekka', 'sauna', 'kylä', 'tyttö', 'pöytä', 'Suomi', 'kahvi']);
  const spelled = [...w.toLowerCase()].map(ch => LETTERS.find(x => x[0] === ch)?.[1]).join(' – ');
  return type(`<div class="big">${esc(spelled)}</div>`, w, { sub: 'Write the word that is spelled out', say: spelled.replace(/ – /g, ', '), strictDots: true });
};
S.length = () => {
  const [a, ae, b, be] = pick(MINIMAL_PAIRS);
  const [w, e] = Math.random() < .5 ? [a, ae] : [b, be];
  if (Math.random() < .55) return mc(`<div class="big">${icon('speaker', 'xl')}</div>`, w, [a, b], { listen: true, say: w, sub: 'Long or short? Which word do you hear?', fiChoices: true, reveal: `${w} = ${e}` });
  // distractor meanings never belong to the same spelling (tuli = fire appears in two pairs)
  const other = MINIMAL_PAIRS.flatMap(p => [[p[0], p[1]], [p[2], p[3]]]).filter(([f, m]) => f !== w && m !== e).map(x => x[1]);
  return mc(P(w), e, [w === a ? be : ae, ...sample(other, 4)], { say: w, sub: 'What does it mean? Watch the length!' });
};
const digitsAns = n => uniq([String(n), String(n).replace(/\B(?=(\d{3})+$)/, ' ')]);
S.numbers = () => {
  const n = pick([randInt(0, 10), randInt(11, 19), randInt(20, 99), randInt(20, 99), randInt(100, 999), randInt(1000, 2030)]);
  const r = Math.random();
  if (r < .4) return type(`<div class="big num">${n}</div>`, F.numWords(n), { sub: 'Write the number in Finnish', say: F.numSay(n), strictDots: true });
  if (r < .7) return type(`<div class="big">${icon('speaker', 'xl')}</div>`, digitsAns(n), { listen: true, say: F.numSay(n), sub: 'Listen and write the number in digits', reveal: F.numWord(n), numeric: true });
  return type(P(F.numWord(n)), digitsAns(n), { sub: 'Write it in digits', say: F.numSay(n), numeric: true });
};
S.numbersSpoken = () => {
  const n = randInt(1, 99), spoken = F.numSpoken(n);
  if (Math.random() < .5) {
    const others = []; while (others.length < 6) { const x = randInt(1, 99); if (x !== n) others.push(F.numSpoken(x)[0]); }
    return mc(`<div class="big num">${n}</div>`, spoken[0], others, { sub: 'How do Finns say it in spoken language?', say: spoken[0], fiChoices: true, reveal: spoken.length > 1 ? `Also: ${spoken.slice(1).join(', ')}` : undefined });
  }
  return type(P(spoken[0]), String(n), { sub: 'Spoken number → digits', say: spoken[0], numeric: true });
};
export const PRICE_CENTS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90];
const priceStr = (e, c) => `${e},${String(c).padStart(2, '0')} €`.replace(',00', '');
S.prices = () => {
  const listen = Math.random() >= .5;
  // listening prices use whole tens of cents: every one of those sentences has a recorded clip (PRICE_CENTS)
  const e = randInt(1, 20), c = listen ? pick(PRICE_CENTS) : pick([0, 10, 20, 30, 50, 90, randInt(1, 99)]);
  const price = priceStr(e, c), words = F.priceWords(e, c), said = F.priceSay(e, c);
  if (!listen) return type(`<div class="big num">${price}</div>`, words, { sub: 'Write the price in Finnish (written or spoken words, mixed as you like)', say: words[0], strictDots: true });
  const others = []; while (others.length < 3) { const o = priceStr(randInt(1, 20), pick([0, 10, 20, 50, 90])); if (o !== price && !others.includes(o)) others.push(o); }
  return mc(`<div class="big">${icon('speaker', 'xl')}</div>`, price, others, { listen: true, say: `Se maksaa ${said}.`, sub: 'Listen: what does it cost?', reveal: `Se maksaa ${said}.` });
};
const OLLA = { inf: 'olla' };
S.olla = () => {
  const p = randInt(0, 5), f = F.present(OLLA)[p];
  return Math.random() < .6
    ? type(P(`${F.PERSONS[p]} ___`), [f, `${F.PERSONS[p]} ${f}`], { sub: `olla → ${PERS_EN[p]} ${['am', 'are', 'is', 'are', 'are', 'are'][p]}`, say: `${F.PERSONS[p]} ${f}` })
    : mc(P(`${cap(F.PERSONS[p])} ___ kotona.`), f, F.present(OLLA), { sub: 'Choose the right form of olla', say: `${cap(F.PERSONS[p])} ${f} kotona.` });
};
const OLLA_CTX = ['kotona', 'väsynyt', 'suomalainen', 'opettaja', 'iloinen', 'myöhässä', 'töissä'];
const OLLA_CTX_PL = ['kotona', 'väsyneitä', 'suomalaisia', 'opettajia', 'iloisia', 'myöhässä', 'töissä'];
S.ollaNeg = () => {
  const p = randInt(0, 5), i = randInt(0, OLLA_CTX.length - 1), x = p >= 3 ? OLLA_CTX_PL[i] : OLLA_CTX[i];
  const pos = `${cap(F.PERSONS[p])} ${F.present(OLLA)[p]} ${x}.`, neg = `${cap(F.PERSONS[p])} ${F.negative(OLLA)[p]} ${x}`;
  const ans = [neg]; if (dropPron(p)) ans.push(`${cap(F.negative(OLLA)[p])} ${x}`);
  return type(P(pos), ans, { sub: 'Make it negative', say: neg, strictDots: true });
};
S.ollaQ = () => {
  const p = pick([1, 2, 4, 5]), i = randInt(0, OLLA_CTX.length - 1), x = p >= 3 ? OLLA_CTX_PL[i] : OLLA_CTX[i];
  const f = F.present(OLLA)[p], q = cap(f) + 'ko';
  const ans = [`${q} ${F.PERSONS[p]} ${x}`]; if (dropPron(p)) ans.push(`${q} ${x}`); // "Onko kotona?" without hän is not about him/her
  return type(P(`${cap(F.PERSONS[p])} ${f} ${x}.`), ans, { sub: 'Turn it into a yes/no question', say: `${q} ${F.PERSONS[p]} ${x}?`, strictDots: true });
};
S.ollaSpoken = () => {
  const p = randInt(0, 5), neg = Math.random() < .4;
  const w = neg ? F.negative(OLLA)[p] : F.present(OLLA)[p], s = (neg ? F.OLLA_SPOKEN_NEG : F.OLLA_SPOKEN)[p];
  return mc(P(`${F.PERSONS[p]} ${w}`), s, neg ? F.OLLA_SPOKEN_NEG : F.OLLA_SPOKEN, { sub: 'How does it sound in spoken Finnish?', say: s, fiChoices: true });
};
S.days = () => {
  const r = Math.random();
  if (r < .4) { const [, na, en] = pick(DAYS); return type(`<div class="big">on ${en}</div>`, na, { sub: 'Milloin? (when) → add -na/-nä', say: na, strictDots: true }); }
  if (r < .7) { const [d, , en] = pick(DAYS); return mc(`<div class="big">${en}</div>`, d, DAYS.map(x => x[0]), { sub: 'Choose the Finnish day', say: d, fiChoices: true }); }
  const t = randInt(0, 6), [rel, off, en] = pick(RELDAYS.filter(x => x[1] !== 0)), target = DAYS[(t + off + 7) % 7][0];
  const verb = off < 0 ? 'oli' : 'on'; // Mikä päivä OLI eilen? (past days take the past tense)
  const q = `Tänään on ${DAYS[t][0]}. Mikä päivä ${verb} ${rel}?`;
  return mc(P(q), target, DAYS.map(x => x[0]).filter(d => d !== DAYS[t][0]), { sub: `${rel} = ${en}`, fiChoices: true, say: q });
};
const CASE_EN = { ssa: 'in', sta: 'out of / from', lla: 'on / at' };
S.harmony = () => {
  if (Math.random() < .5) {
    const w = pick(nouns()), stem = w.gen.slice(0, -1), suf = pick(['ssa', 'sta', 'lla']);
    const right = F.hv(suf, w.fi), wrong = right.includes('a') ? right.replace(/a/g, 'ä') : right.replace(/ä/g, 'a');
    return mc(P(`${stem}___`), right, [wrong], { sub: `${w.fi} (${gloss(w.en)}) + -${suf}/-${F.hv(suf, 'ä')} (“${CASE_EN[suf]}”): which vowel?`, say: stem + right, fiChoices: true, explain: harmonyExplain(w.fi) });
  }
  const v = pick(VERBS.filter(v => v.type && v.type <= 5)), p = pick([1, 2, 4, 5]), f = F.present(v)[p];
  const right = F.hv('ko', v.inf);
  return mc(P(`${cap(f)}___ ${F.PERSONS[p]}?`), right, ['ko', 'kö'], { sub: `${v.inf}: ${v.en}. Question ending?`, say: `${cap(f)}${right} ${F.PERSONS[p]}?`, fiChoices: true, explain: harmonyExplain(v.inf) });
};
export function harmonyExplain(word) {
  const h = F.harmony(word), w = word.toLowerCase();
  const back = /[aou]/.test(w), front = /[äöy]/.test(w);
  if (h === 'f' && back) return `<b>${esc(word)}</b> is a compound: its LAST part decides, and that part has front or neutral vowels (ä, ö, y, e, i) → front endings: -ssä, -stä, -llä, -kö, -vät`;
  if (h === 'b' && front) return `<b>${esc(word)}</b> is a compound: its LAST part decides, and that part has back vowels (a, o, u) → back endings: -ssa, -sta, -lla, -ko, -vat`;
  return h === 'b' ? `<b>${esc(word)}</b> has back vowels (a, o, u) → back endings: -ssa, -sta, -lla, -ko, -vat`
    : `<b>${esc(word)}</b> has ${front ? 'front' : 'only neutral'} vowels (${front ? 'ä, ö, y' : 'e, i'}) → front endings: -ssä, -stä, -llä, -kö, -vät`;
}
S.tplural = () => {
  const w = pick(nouns());
  const regular = w.pl === w.gen.slice(0, -1) + 't';
  return type(P(w.fi, w.en), w.pl, { sub: 'Make it plural (t-plural)', say: w.pl, strictDots: true, explain: regular ? `Genitive <b>${w.gen}</b> → swap -n for -t → <b>${w.pl}</b>` : `<b>${w.fi}</b> → plural <b>${w.pl}</b>` });
};
S.countries = () => {
  const c = pick(COUNTRIES), r = Math.random();
  if (r < .3) return type(P(`Olen kotoisin ___. (${c.fi})`), [c.from, `Olen kotoisin ${c.from}`], { sub: `I'm from ${c.en}`, say: `Olen kotoisin ${c.from}.`, strictDots: true });
  if (r < .55) return type(P(`Puhun ___. (${c.lang})`), [c.langPart, `Puhun ${c.langPart}`], { sub: `I speak ${c.langEn}. Languages after puhua take the partitive`, say: `Puhun ${c.langPart}.`, strictDots: true });
  if (r < .8) return mc(P(c.fi), c.nat, COUNTRIES.map(x => x.nat), { sub: `${c.en}: what is the nationality?`, say: c.nat, fiChoices: true });
  return mc(`<div class="big">${esc(c.en)}</div>`, c.fi, COUNTRIES.map(x => x.fi), { sub: 'Which country?', say: c.fi, fiChoices: true });
};

// ------------------------------------------------------------ verbs
const verbPool = filter => VERBS.filter(v => v.inf !== 'olla' && filter(v));
const EN_VERB = { maksaa: 'pay', voida: 'can', pitää: 'like', olla: 'be' };
/** English base verb: "to live (somewhere)" → "live"; maksaa → "pay" (people pay, things cost). */
export const enBase = v => EN_VERB[v.inf] || v.en.replace(/^to /, '').split(/[;(]/)[0].trim();
/** he/she-form of an English verb phrase: "watch" → "watches", "cry" → "cries", "look for" → "looks for". */
export function en3(base) {
  const [h, ...rest] = base.split(' ');
  const f = { be: 'is', have: 'has', do: 'does', go: 'goes', can: 'can' }[h]
    || (/(s|sh|ch|x|z)$/.test(h) ? h + 'es' : /[^aeiou]y$/.test(h) ? h.slice(0, -1) + 'ies' : h + 's');
  return [f, ...rest].join(' ');
}
const enPresent = (v, p) => `${PERS_EN[p]} ${p === 2 ? en3(enBase(v)) : enBase(v)}`;
const enNegative = (v, p) => enBase(v) === 'can' ? `${PERS_EN[p]} can't` : `${PERS_EN[p]} ${p === 2 ? "doesn't" : "don't"} ${enBase(v)}`;
/** Accept the verb alone and with its pronoun ("puhun" / "minä puhun"). */
const withPron = (p, f) => [f, `${F.PERSONS[p]} ${f}`];
function conjQ(v, kind = 'pos') {
  const p = randInt(0, 5);
  if (kind === 'neg') {
    const f = F.negative(v)[p];
    return type(P(`${F.PERSONS[p]} + ei + ${v.inf}`), withPron(p, f), { sub: enNegative(v, p), say: `${F.PERSONS[p]} ${f}`, strictDots: true, explain: `Negative = <b>${F.NEG.join(' / ')}</b> + the minä-form without -n: minä <b>${F.present(v)[0]}</b> → <b>en ${v.a}</b>` });
  }
  if (kind === 'q') {
    const qp = pick([1, 2, 4]), f = F.present(v)[qp] + F.qSuffix(v.inf);
    return type(P(`${F.PERSONS[qp]} ${F.present(v)[qp]} → ?`), [f, `${f} ${F.PERSONS[qp]}`], { sub: 'Make a yes/no question with -ko/-kö (just the verb)', say: `${cap(f)} ${F.PERSONS[qp]}?`, strictDots: true, explain: harmonyExplain(v.inf) });
  }
  if (kind === 'past') {
    const f = F.past(v)[p];
    return type(P(`${F.PERSONS[p]} + ${v.inf} (eilen)`), withPron(p, f), { sub: `${PERS_EN[p]} … yesterday (past tense of “${enBase(v)}”)`, say: `Eilen ${F.PERSONS[p]} ${f}.`, strictDots: true, explain: `minä <b>${v.p1}</b> · hän <b>${v.p3}</b>` });
  }
  const f = F.present(v)[p];
  return type(P(`${F.PERSONS[p]} + ${v.inf}`), withPron(p, f), { sub: enPresent(v, p), say: `${F.PERSONS[p]} ${f}`, strictDots: true, explain: verbExplain(v) });
}
function verbExplain(v) {
  const pr = F.present(v);
  return `<b>${v.inf}</b> (type ${v.type}): ${pr.map((f, i) => `${F.PERSONS[i]} <b>${f}</b>`).join(' · ')}${v.grad ? '<br>kpt: weak in minä/sinä/me/te, strong in hän/he' : ''}`;
}
S.vt1 = () => conjQ(pick(verbPool(v => v.type === 1 && !v.grad)));
S.vt1kpt = () => conjQ(pick(verbPool(v => v.type === 1 && v.grad)));
S.vt1neg = () => conjQ(pick(verbPool(v => v.type === 1)), 'neg');
S.questionKo = () => conjQ(pick(verbPool(v => v.type >= 1 && v.type <= 5)), 'q');
S.vt15 = () => conjQ(pick(verbPool(v => v.type >= 1 && v.type <= 5)));
S.vt15neg = () => conjQ(pick(verbPool(v => v.type >= 1 && v.type <= 5)), 'neg');
S.past = () => conjQ(pick(verbPool(v => v.p1)), 'past');
S.verbtype = () => {
  const v = pick(VERBS.filter(v => v.type >= 1 && v.type <= 6));
  return mc(P(v.inf, v.en), `type ${v.type}`, [1, 2, 3, 4, 5, 6].map(t => `type ${t}`), { sub: 'Which verb type?', say: v.inf, explain: verbExplain(v) });
};
// [question, answer, right word, other words that would ALSO be correct (never offered as distractors)]
const QW = [
  ['___ sinä asut?', 'Asun Helsingissä.', 'missä'], ['___ sinä olet kotoisin?', 'Olen kotoisin Ruotsista.', 'mistä'], ['___ sinä menet?', 'Menen kotiin.', 'mihin'],
  ['___ hän on?', 'Hän on Pekka.', 'kuka'], ['___ tämä on?', 'Tämä on kirja.', 'mikä', ['mitä']], ['___ sinä teet?', 'Minä luen.', 'mitä'],
  ['___ sinä tulet?', 'Huomenna.', 'milloin'], ['___ sinä olet väsynyt?', 'Koska nukuin huonosti.', 'miksi'], ['___ sanotaan "thank you" suomeksi?', 'Kiitos.', 'miten', ['kuinka']],
  ['___ sää on?', 'Sää on kaunis.', 'millainen', ['miten', 'kuinka']], ['___ auto tämä on?', 'Se on Pekan auto.', 'kenen'], ['___ vanha sinä olet?', 'Olen 30 vuotta vanha.', 'kuinka', ['miten']],
  ['___ kello on?', 'Kello on kolme.', 'paljonko', ['mitä']], ['___ sinä syöt?', 'Syön leipää.', 'mitä'], ['___ sinun nimesi on?', 'Minun nimeni on Tom.', 'mikä'],
  ['___ kieliä sinä puhut?', 'Puhun suomea.', 'mitä'], ['___ monta lasta sinulla on?', 'Minulla on kaksi lasta.', 'kuinka'], ['___ juna lähtee?', 'Kello kahdeksalta.', 'milloin'],
];
const QWORDS = ['Missä', 'Mistä', 'Mihin', 'Kuka', 'Mikä', 'Mitä', 'Milloin', 'Miksi', 'Miten', 'Millainen', 'Kenen', 'Kuinka', 'Paljonko'];
S.qwords = () => {
  const [q, a, w, also = []] = pick(QW);
  const bad = new Set([w, ...also].map(cap));
  return mc(P(q), cap(w), QWORDS.filter(x => !bad.has(x)), { sub: `Answer: “${a}” Which question word?`, say: q.replace('___', cap(w)), fiChoices: true });
};
const HOLIDAYS = [['Milloin on joulu?', 'joulukuussa'], ['Milloin on juhannus?', 'kesäkuussa'], ['Milloin on vappu?', 'toukokuussa'], ['Milloin uusi vuosi alkaa?', 'tammikuussa'], ['Milloin koulu alkaa Suomessa?', 'elokuussa'], ['Milloin on itsenäisyyspäivä?', 'joulukuussa']];
S.months = () => {
  const r = Math.random();
  if (r < .4) { const [, ssa, en] = pick(MONTHS); return type(`<div class="big">in ${en}</div>`, ssa, { sub: 'Missä kuussa? → -ssa', say: ssa, strictDots: true }); }
  if (r < .7) { const [, lla, en] = pick(SEASONS); return type(`<div class="big">in ${en}</div>`, lla, { sub: 'Milloin? Seasons take -lla/-llä', say: lla, strictDots: true }); }
  const [q, a] = pick(HOLIDAYS);
  return mc(P(q), a, MONTHS.map(m => m[1]), { sub: 'Choose the month', say: q, fiChoices: true });
};
// only things you wear "päällä" (a hat is päässä, shoes jalassa, a scarf kaulassa, a bag is not worn)
const CLOTHES_SG = ['paita', 'takki', 'mekko', 'hame', 'villapaita', 'huppari', 't-paita'];
const CLOTHES_PL = ['housut', 'farkut', 'shortsit'];
const COLS = ['punainen', 'sininen', 'musta', 'valkoinen', 'vihreä', 'keltainen', 'harmaa', 'ruskea'];
S.clothes = () => {
  const plural = Math.random() < .45;
  const noun = W(plural ? pick(CLOTHES_PL) : pick(CLOTHES_SG)), col = W(pick(COLS));
  const adj = plural ? col.pl : col.fi;
  // both orders are natural Finnish: "Minulla on päällä musta paita" / "Minulla on musta paita päällä"
  const answer = [`Minulla on päällä ${adj} ${noun.fi}`, `Minulla on ${adj} ${noun.fi} päällä`];
  const en = `I'm wearing ${plural ? `${gloss(col.en)} ${gloss(noun.en)}` : aAn(`${gloss(col.en)} ${gloss(noun.en)}`)}`;
  const wrongAdj = plural ? col.fi : col.pl;
  return { kind: 'tiles', prompt: `<div class="big">${esc(en)}</div>`, sub: plural ? 'Plural clothes → plural adjective!' : 'Build the sentence', answer, tiles: shuffle(['Minulla', 'on', 'päällä', adj, noun.fi, wrongAdj, pick(['minä', 'olen'])]), say: answer[0] };
};
const HAVE_THINGS = ['koira', 'kissa', 'auto', 'pyörä', 'hevonen', 'puhelin', 'avain', 'sateenvarjo', 'kynä', 'porkkana'];
S.have = () => {
  const w = W(pick(HAVE_THINGS)), r = Math.random(), en = gloss(w.en);
  if (r < .35) { const p = randInt(0, 5); const a = `${cap(F.ADESSIVE_PRON[p])} on ${w.fi}`; return type(`<div class="big">${esc(['I have', 'you have', 'he/she has', 'we have', 'you (pl.) have', 'they have'][p])} ${esc(aAn(en))}</div>`, a, { sub: 'Person + -lla/-llä + on', say: a, strictDots: true }); }
  if (r < .65) { const p = randInt(0, 5); const a = `${cap(F.ADESSIVE_PRON[p])} ei ole ${w.part}`; return type(`<div class="big">${esc(PERS_EN[p])} ${p === 2 ? "doesn't" : "don't"} have ${esc(aAn(en))}</div>`, a, { sub: 'Negative → the thing goes into the partitive', say: a, strictDots: true, explain: `${w.fi} → partitive <b>${w.part}</b>` }); }
  const n = pick(NAMES), a = `${n.ade} on ${w.fi}`;
  return type(`<div class="big">${n.fi} has ${esc(aAn(en))}</div>`, a, { sub: 'Names take -lla/-llä too (watch kpt!)', say: a, strictDots: true, explain: `${n.fi} → <b>${n.ade}</b>` });
};
// Near-synonyms in some contexts: never offer one as a "wrong" opposite when the other is right.
const OPP_SYN = [['tumma', 'pimeä'], ['vaalea', 'valoisa'], ['kova', 'vaikea'], ['kova', 'äänekäs'], ['raskas', 'vaikea'], ['kevyt', 'helppo'], ['hauska', 'iloinen'], ['tylsä', 'surullinen']];
S.opposites = () => {
  const [a, b] = pick(OPPOSITES), [x, y] = Math.random() < .5 ? [a, b] : [b, a];
  // every opposite of x (or of a near-synonym of x) is correct: vanha ↔ uusi AND nuori, kova (loud) ↔ hiljainen.
  // None of them, nor x and its synonyms, may appear as a "wrong" option.
  const syn = w => new Set([w, ...OPP_SYN.filter(g => g.includes(w)).flat()]);
  const opp = w => OPPOSITES.filter(p => p.includes(w)).map(p => p[0] === w ? p[1] : p[0]);
  const ok = new Set();
  for (const s of syn(x)) { ok.add(s); for (const o of opp(s)) syn(o).forEach(t => ok.add(t)); }
  return mc(P(x, W(x)?.en), y, OPPOSITES.flat().filter(w => !ok.has(w)), { sub: 'Choose the opposite', say: y, fiChoices: true });
};
S.genitive = () => {
  const r = Math.random();
  if (r < .5) { const w = pick(nouns()); return type(P(w.fi, w.en), w.gen, { sub: 'Genitive (kenen? minkä?) → -n', say: w.gen, strictDots: true }); }
  const owner = W(pick(['opettaja', 'lääkäri', 'naapuri', 'äiti', 'isä', 'tyttö', 'poika', 'ystävä', 'nainen', 'mies'])), thing = W(pick(['auto', 'kirja', 'koira', 'talo', 'puhelin', 'laukku', 'avain', 'kissa']));
  const a = `${owner.gen} ${thing.fi}`;
  return type(`<div class="big">the ${esc(gloss(owner.en))}'s ${esc(gloss(thing.en))}</div>`, a, { sub: 'Owner in the genitive comes first', say: a, strictDots: true });
};
// Stem for the possessive suffix (vowel stem, strong grade): äiti → äitini, nimi → nimeni, puhelin → puhelimeni
const POSS_STEM = { kirja: 'kirja', auto: 'auto', koira: 'koira', äiti: 'äiti', talo: 'talo', nimi: 'nime', puhelin: 'puhelime' };
S.genitivePron = () => {
  const p = randInt(0, 5), fi = pick(Object.keys(POSS_STEM)), thing = W(fi);
  const suf = ['ni', 'si', F.hv('nsa', fi), 'mme', 'nne', F.hv('nsa', fi)][p], standard = `${F.GENITIVE_PRON[p]} ${POSS_STEM[fi]}${suf}`;
  const everyday = `${F.GENITIVE_PRON[p]} ${fi}`;
  const ans = [everyday, standard]; if (dropPron(p)) ans.push(`${POSS_STEM[fi]}${suf}`);
  return type(`<div class="big">${['my', 'your', 'his/her', 'our', 'your (pl.)', 'their'][p]} ${esc(gloss(thing.en))}</div>`, ans,
    { sub: 'Kenen? → genitive pronoun', say: everyday, strictDots: true, reveal: `Everyday Finnish: ${everyday}. Written standard adds a possessive suffix: ${standard}` });
};
const DRINKS = ['kahvi', 'tee', 'maito', 'vesi', 'mehu', 'olut', 'viini'], FOODS = ['leipä', 'juusto', 'liha', 'kala', 'riisi', 'keitto', 'salaatti', 'jäätelö', 'puuro', 'suklaa'];
S.partitive = () => {
  const r = Math.random();
  if (r < .3) { const w = pick(nouns()), n = randInt(2, 9); return type(P(`${F.numWord(n)} ___ (${w.fi})`), [w.part, `${F.numWord(n)} ${w.part}`], { sub: `${n} × ${gloss(w.en)}: after numbers → partitive`, say: `${F.numWord(n)} ${w.part}`, strictDots: true, explain: partExplain(w) }); }
  if (r < .55) { const w = W(pick(DRINKS)); return type(P(`Minä juon ___ (${w.fi}).`), [w.part, `Minä juon ${w.part}`, `Juon ${w.part}`], { sub: `I drink ${gloss(w.en)}`, say: `Minä juon ${w.part}.`, strictDots: true, explain: partExplain(w) }); }
  if (r < .75) { const w = W(pick(FOODS)); return type(P(`Minä syön ___ (${w.fi}).`), [w.part, `Minä syön ${w.part}`, `Syön ${w.part}`], { sub: `I eat ${gloss(w.en)}`, say: `Minä syön ${w.part}.`, strictDots: true, explain: partExplain(w) }); }
  const w = pick(nouns());
  return type(P(w.fi, w.en), w.part, { sub: 'Partitive form', say: w.part, strictDots: true, explain: partExplain(w) });
};
const DIPHTHONG_END = /(aa|ee|ii|oo|uu|yy|ää|öö|ai|ei|oi|ui|yi|äi|öi|au|eu|iu|ou|ey|iy|äy|öy|ie|uo|yö)$/;
/** Explain the partitive ending from the actual nominative → partitive pair (so it is true for every noun). */
export function partExplain(w) {
  const fi = w.fi.toLowerCase(), pt = w.part.toLowerCase(), H = `<b>${esc(w.fi)}</b> → <b>${esc(w.part)}</b>: `;
  if (/tt[aä]$/.test(pt)) {
    if (/e$/.test(fi)) return H + 'words ending in -e take -tta/-ttä (huone → huonetta)';
    if (/si$/.test(fi)) return H + '-si words: -si → -tta/-ttä (vesi → vettä, käsi → kättä)';
    if (/(uus|yys)$/.test(fi)) return H + '-uus/-yys words: -s → -tta/-ttä (kansalaisuus → kansalaisuutta)';
    if (/[^aeiouyäö]$/.test(fi)) return H + `the word ends in a consonant (-${fi.slice(-1)}) → -tta/-ttä (olut → olutta, kevät → kevättä)`;
    return H + 'partitive -tta/-ttä';
  }
  if (/t[aä]$/.test(pt)) {
    if (/nen$/.test(fi)) return H + '-nen words: -nen → -sta/-stä (nainen → naista)';
    if (/[^aeiouyäö]$/.test(fi)) return H + 'the word ends in a consonant → -ta/-tä (puhelin → puhelinta)';
    if (DIPHTHONG_END.test(fi)) return H + 'long vowel or diphthong at the end → -ta/-tä (maa → maata, perjantai → perjantaita)';
    if (/[aeiouyäö]{2}$/.test(fi)) return H + 'two different vowels at the end → -ta/-tä (museo → museota, keittiö → keittiötä)';
    return H + 'some old -i words drop the final vowel and take -ta/-tä (lumi → lunta, meri → merta, kieli → kieltä): learn these by heart';
  }
  if (/i$/.test(fi) && /e[aä]$/.test(pt)) return H + '-i changes to -e- before -a/-ä (nimi → nimeä, järvi → järveä)';
  return H + 'one short vowel at the end → -a/-ä (talo → taloa, kissa → kissaa)';
}
// Which reference objects make sense with which postposition ("the key is inside the table" teaches nonsense)
const PP_OK = { sisällä: ['kaappi', 'auto', 'talo'], keskellä: ['pöytä', 'sänky', 'sohva', 'hylly'], päällä: ['pöytä', 'sohva', 'sänky', 'tuoli', 'kaappi', 'hylly', 'auto', 'tietokone'] };
S.postpos = () => {
  const thing = W(pick(POSTPOS_THINGS)), [pp, en] = pick(POSTPOSITIONS);
  const refs = POSTPOS_REFS.filter(r => !PP_OK[pp] || PP_OK[pp].includes(r));
  const ref = W(pick(refs.length ? refs : POSTPOS_REFS));
  const answer = `${cap(thing.fi)} on ${ref.gen} ${pp}`;
  return { kind: 'tiles', prompt: `<div class="big">The ${esc(gloss(thing.en))} is ${en} the ${esc(gloss(ref.en))}.</div>`, sub: 'Genitive + postposition', answer, tiles: shuffle([cap(thing.fi), 'on', ref.gen, pp, ref.fi, pick(POSTPOSITIONS.filter(x => x[0] !== pp))[0]]), say: answer };
};
// English for "in/from/to X": no article for place names; koti and työ are idioms (at home, to work…)
const LOCAL_EN = { koti: { missa: 'at home', mista: 'from home', mihin: '(to) home' }, työ: { missa: 'at work', mista: 'from work', mihin: 'to work' } };
S.local = () => {
  const p = pick(PLACES), l = F.local(p), [k, q, en] = pick([['missa', 'Missä?', 'in / at'], ['mista', 'Mistä?', 'from'], ['mihin', 'Mihin?', 'to']]);
  const name = p.fi[0] !== p.fi[0].toLowerCase();
  const enTxt = LOCAL_EN[p.fi]?.[k] || `${k === 'missa' && name ? 'in' : en} ${name ? '' : 'the '}${p.en}`;
  return type(P(`${q} (${p.fi})`), l[k], { sub: `${enTxt}${p.o ? ' (an outer-case place!)' : ''}`, say: l[k], strictDots: true, explain: `${p.fi}: <b>${l.missa}</b> · <b>${l.mista}</b> · <b>${l.mihin}</b>${p.o ? '<br>This place uses the outer cases -lla / -lta / -lle.' : ''}` });
};
export const CLOCK_MINS = [0, 0, 15, 30, 30, 45, 5, 10, 20, 40, 50, 55];
S.clock = () => {
  const h = randInt(1, 12), m = pick(CLOCK_MINS), words = F.clockWords(h, m);
  const t = `${h}:${String(m).padStart(2, '0')}`;
  if (Math.random() < .55) return type(`<div class="big num">${t}</div>`, uniq(words.flatMap(w => [w, `kello on ${w}`])), { sub: 'Paljonko kello on? (12-hour words)', say: `Kello on ${words[0]}.`, strictDots: true });
  const others = []; while (others.length < 3) { const o = `${randInt(1, 12)}:${String(pick(CLOCK_MINS)).padStart(2, '0')}`; if (o !== t && !others.includes(o)) others.push(o); }
  return mc(`<div class="big">${icon('speaker', 'xl')}</div>`, t, others, { listen: true, say: `Kello on ${words[0]}.`, sub: 'Listen: what time is it?', reveal: `Kello on ${words[0]}.` });
};
S.clockAbl = () => {
  const h = randInt(1, 12), a = `kello ${F.hourAblative(h)}`, act = pick([['herään', 'I wake up'], ['menen töihin', 'I go to work'], ['syön lounasta', 'I eat lunch'], ['tulen kotiin', 'I come home'], ['menen nukkumaan', 'I go to sleep']]);
  return type(P(`Mihin aikaan? (${h}:00)`), [a, F.hourAblative(h), `${act[0]} ${a}`, `${a} ${act[0]}`], { sub: `${act[1]} at ${h} o'clock → kello + -lta/-ltä`, say: `${cap(act[0])} ${a}.`, strictDots: true });
};
// [Finnish, English, other natural word orders with the same meaning]
const SENTENCES = [
  ['Minä juon kahvia aamulla.', 'I drink coffee in the morning.', ['Aamulla minä juon kahvia', 'Minä juon aamulla kahvia']],
  ['Me asumme Helsingissä.', 'We live in Helsinki.'],
  ['Hän ei puhu ruotsia.', "He doesn't speak Swedish."], ['Puhutko sinä englantia?', 'Do you speak English?'],
  ['Kissa nukkuu sängyn alla.', 'The cat sleeps under the bed.'], ['Minulla on kaksi siskoa.', 'I have two sisters.'],
  ['Menen kauppaan huomenna.', "I'm going to the shop tomorrow.", ['Huomenna menen kauppaan']], ['Tänään sataa lunta.', "It's snowing today.", ['Lunta sataa tänään', 'Sataa lunta tänään']],
  ['He tulevat Ruotsista.', 'They come from Sweden.'], ['Ostan kilon perunoita.', 'I buy a kilo of potatoes.'],
  ['Mihin aikaan sinä heräät?', 'What time do you wake up?'], ['Kenen auto tämä on?', 'Whose car is this?', ['Kenen tämä auto on']],
  ['Me menemme saunaan illalla.', "We're going to the sauna in the evening.", ['Illalla me menemme saunaan', 'Me menemme illalla saunaan']], ['Minä en ymmärrä sinua.', "I don't understand you."],
  ['Pekka on töissä toimistossa.', 'Pekka is at work in an office.', ['Pekka on toimistossa töissä']], ['Hänellä on siniset silmät.', 'She has blue eyes.'],
  ['Eilen söin pullaa kahvilassa.', 'Yesterday I ate a bun at a café.', ['Söin eilen pullaa kahvilassa', 'Eilen söin kahvilassa pullaa', 'Söin pullaa kahvilassa eilen']],
  ['Juna lähtee asemalta kello kuudelta.', 'The train leaves the station at six.', ['Juna lähtee kello kuudelta asemalta']],
];
S.wordorder = () => {
  const [fi, en, alts = []] = pick(SENTENCES), toks = fi.replace(/[.?!]/g, '').split(' ');
  return { kind: 'tiles', prompt: `<div class="big">${esc(en)}</div>`, sub: 'Put the words in order', answer: [toks.join(' '), ...alts], tiles: shuffle(toks), say: fi };
};
// [situation, answer, phrases that would ALSO be fine there (never offered as distractors)]
const SIT = [
  ["It's 8 a.m. You meet your neighbour.", 'Hyvää huomenta!'], ['Everyone is going to bed.', 'Hyvää yötä!'], ['Someone gives you a coffee.', 'Kiitos!'],
  ['You bump into someone.', 'Anteeksi!'], ['You meet someone new.', 'Hauska tavata!'], ['You serve dinner to your guests.', 'Hyvää ruokahalua!'],
  ['You raise your glass.', 'Kippis!'], ['Your friend got a new job.', 'Onneksi olkoon!'], ['A friend leaves for a trip.', 'Hyvää matkaa!', ['Näkemiin!']],
  ["You didn't understand.", 'En ymmärrä.', ['Anteeksi!']], ['You leave a shop (formal).', 'Näkemiin!', ['Kiitos!', 'Hyvää yötä!']], ['You hand someone a book.', 'Ole hyvä!'],
];
S.phrases = () => {
  const [s, a, also = []] = pick(SIT);
  return mc(`<div class="big">${esc(s)}</div>`, a, SIT.map(x => x[1]).filter(x => !also.includes(x)), { sub: 'What do you say?', say: a, fiChoices: true });
};
// ------------------------------------------------------------ new drills (COVERAGE.md specs A–F)
export const DIGIT_WRITTEN = ['nolla', 'yksi', 'kaksi', 'kolme', 'neljä', 'viisi', 'kuusi', 'seitsemän', 'kahdeksan', 'yhdeksän'];
export const DIGIT_SPOKEN = ['nolla', 'yks', 'kaks', 'kolme', 'neljä', 'viis', 'kuus', 'seittemän', 'kasi', 'ysi'];
S.phone = () => {
  const num = '0' + pick(['40', '44', '45', '50']) + Array.from({ length: 7 }, () => randInt(0, 9)).join('');
  const names = Math.random() < .5 ? DIGIT_WRITTEN : DIGIT_SPOKEN;
  const groups = [num.slice(0, 3), num.slice(3, 6), num.slice(6)];
  const said = groups.map(g => [...g].map(d => names[+d]).join(' ')).join(', ');
  return type(`<div class="big">${icon('phone', 'xl')}</div>`, num, { listen: true, numeric: true, say: said, sub: 'Listen: write the phone number in digits', reveal: said });
};
export const WEATHER = [['aurinko paistaa', 'sunny'], ['sataa', 'raining'], ['sataa lunta', 'snowing'], ['tuulee', 'windy'], ['on sumuista', 'foggy'], ['on pilvistä', 'cloudy']];
/** "Lämpötila on miinus viisi astetta." (1 takes the singular: yksi aste) */
export function tempWords(t) {
  const n = Math.abs(t), w = `${t < 0 ? 'miinus ' : ''}${F.numWord(n)} ${n === 1 ? 'aste' : 'astetta'}`;
  return w;
}
export const FORECAST_CITIES = () => PLACES.filter(p => p.fi[0] !== p.fi[0].toLowerCase());
S.forecast = () => {
  const city = pick(FORECAST_CITIES()), [cond, en] = pick(WEATHER), t = randInt(-20, 30);
  const said = `${F.local(city).missa} ${cond}. Lämpötila on ${tempWords(t)}.`;
  if (Math.random() < .5) return mc(`<div class="big">${icon('cloud', 'xl')}</div>`, en, WEATHER.map(x => x[1]), { listen: true, say: said, sub: `Listen: what is the weather like in ${city.en}?`, reveal: said });
  const ans = (t < 0 ? [`-${-t}`, `−${-t}`, `miinus ${-t}`] : t > 0 ? [String(t), `+${t}`, `plus ${t}`] : ['0', 'nolla']).flatMap(a => [a, `${a} astetta`]);
  return type(`<div class="big">${icon('cloud', 'xl')}</div>`, ans, { listen: true, say: said, sub: `Listen: what is the temperature in ${city.en}? (digits, e.g. -5)`, reveal: said });
};
// [verb infinitive, objects]: the positive sentence has a total object (genitive) or a mass partitive
const PN_COUNT = { ostaa: ['auto', 'kirja', 'kynä', 'laukku', 'paita', 'takki', 'puhelin', 'tietokone', 'pyörä', 'sohva', 'lamppu'], haluta: ['koira', 'kissa', 'auto', 'pyörä', 'omena', 'banaani'], nähdä: ['lintu', 'karhu', 'auto', 'juna', 'kettu', 'orava'] };
const PN_MASS = { juoda: DRINKS, syödä: FOODS };
const AMOUNTS = [['kilo', 'a kilo of', ['liha', 'juusto', 'riisi', 'sokeri', 'kala', 'suola']], ['litra', 'a litre of', ['maito', 'mehu', 'vesi']], ['lasi', 'a glass of', ['maito', 'mehu', 'vesi', 'viini']],
  ['kuppi', 'a cup of', ['kahvi', 'tee']], ['pala', 'a piece of', ['kakku', 'juusto', 'leipä', 'suklaa']], ['pussi', 'a bag of', ['riisi', 'sokeri', 'karkki']], ['pullo', 'a bottle of', ['vesi', 'viini', 'olut', 'mehu']]];
S.partNeg = () => {
  const r = Math.random();
  if (r < .25) {
    const [amt, en, list] = pick(AMOUNTS), w = W(pick(list.filter(W)));
    return type(P(`${amt} ___ (${w.fi})`), [w.part, `${amt} ${w.part}`], { sub: `${en} ${gloss(w.en)}: amounts take the partitive`, say: `${amt} ${w.part}`, strictDots: true, explain: partExplain(w) });
  }
  if (r < .45) {
    const p = randInt(0, 5), w = W(pick(HAVE_THINGS));
    const pos = `${cap(F.ADESSIVE_PRON[p])} on ${w.fi}.`, neg = `${cap(F.ADESSIVE_PRON[p])} ei ole ${w.part}`;
    return type(P(pos), neg, { sub: 'Make it negative: the thing goes into the partitive', say: neg, strictDots: true, explain: `${w.fi} → partitive <b>${w.part}</b>` });
  }
  const mass = Math.random() < .35, src = mass ? PN_MASS : PN_COUNT, inf = pick(Object.keys(src)), v = VERBS.find(x => x.inf === inf);
  const w = W(pick(src[inf].filter(W))), p = randInt(0, 5);
  const obj = mass ? w.part : w.gen; // Ostan auton (total object) / Juon kahvia (mass: already partitive)
  const pos = `${cap(F.PERSONS[p])} ${F.present(v)[p]} ${obj}.`, negV = F.negative(v)[p], neg = `${cap(F.PERSONS[p])} ${negV} ${w.part}`;
  const ans = [neg]; if (dropPron(p)) ans.push(`${cap(negV)} ${w.part}`);
  return type(P(pos), ans, { sub: 'Make it negative: the object goes into the partitive', say: neg, strictDots: true, explain: `${obj} → <b>${w.part}</b> (negative sentences always take a partitive object)` });
};
S.genPred = () => {
  const n = pick(NAMES), w = W(pick(HAVE_THINGS));
  if (Math.random() < .55) {
    const answer = `${cap(w.fi)} on ${n.gen}`;
    return { kind: 'tiles', prompt: `<div class="big">The ${esc(gloss(w.en))} is ${esc(n.fi)}'s.</div>`, sub: 'Whose is it? Owner in the genitive (-n)', answer, tiles: shuffle([cap(w.fi), 'on', n.gen, n.fi, n.ade]), say: answer };
  }
  return mc(P(`Kenen ${w.fi} tämä on? (${n.fi})`), `Se on ${n.gen}.`, [`Se on ${n.fi}.`, `Se on ${n.ade}.`], { sub: `Whose ${gloss(w.en)} is this? It's ${n.fi}'s.`, say: `Se on ${n.gen}.`, fiChoices: true, explain: `${n.fi} → genitive <b>${n.gen}</b>` });
};
// Consonant gradation pairs, strong → weak
const KPT = [['kk', 'k'], ['pp', 'p'], ['tt', 't'], ['k', ''], ['p', 'v'], ['t', 'd'], ['nk', 'ng'], ['mp', 'mm'], ['lt', 'll'], ['nt', 'nn'], ['rt', 'rr'], ['ht', 'hd'], ['lk', 'l'], ['lk', 'lj'], ['rk', 'r'], ['rk', 'rj'], ['k', 'v']];
const VOWELS_ALL = 'aeiouyäö';
const isV = ch => VOWELS_ALL.includes(ch);
/** Classify a noun by consonant gradation from its basic form and genitive:
 *  {group: 'A' (strong basic form → weak: kauppa/kaupan) | 'B' (weak → strong: sade/sateen), strong, weak} or null. */
export function gradation(w) {
  if (!w.gen) return null;
  const f = w.fi.toLowerCase(), g = w.gen.toLowerCase().slice(0, -1);
  let i = 0; while (i < f.length && i < g.length && f[i] === g[i]) i++;
  while (i > 0 && !isV(f[i - 1])) i--;
  if (i === 0) return null;
  const lead = s => (s.match(/^[^aeiouyäö]*/) || [''])[0];
  let fc = lead(f.slice(i)), gc = lead(g.slice(i));
  if (fc === gc) return null;
  for (let tries = 0; tries < 2; tries++) {
    for (const [s, wk] of KPT) {
      if (fc === s && gc === wk) return { group: 'A', strong: fc, weak: gc };
      if (fc === wk && gc === s) return { group: 'B', strong: gc, weak: fc };
    }
    if (fc.length > 1 && gc.length > 1 && fc[0] === gc[0]) { fc = fc.slice(1); gc = gc.slice(1); } else break; // kirkko: rkk/rk → kk/k
  }
  return null;
}
const GRAD_LABEL = { A: 'A: strong → weak (kauppa → kaupan)', B: 'B: weak → strong (sade → sateen)' };
S.gradAB = () => {
  const pool = nouns().map(w => [w, gradation(w)]).filter(x => x[1]);
  const [w, gr] = pick(pool);
  const how = `<b>${esc(w.fi)}</b> → <b>${esc(w.gen)}</b>: ${gr.group === 'A' ? `strong <b>${gr.strong}</b> in the basic form, weak <b>${gr.weak || '–'}</b> in the genitive` : `weak <b>${gr.weak || '–'}</b> in the basic form, strong <b>${gr.strong}</b> in the genitive`} → group ${gr.group}`;
  if (Math.random() < .5) return type(P(w.fi, w.en), w.gen, { sub: 'Genitive? Watch the consonant gradation (kpt)', say: w.gen, strictDots: true, explain: how });
  return mc(P(`${w.fi} → ${w.gen}`, w.en), GRAD_LABEL[gr.group], [GRAD_LABEL.A, GRAD_LABEL.B], { sub: 'Which gradation group?', say: `${w.fi}, ${w.gen}`, explain: how });
};
const CITY = p => p.fi[0] !== p.fi[0].toLowerCase();
// [verb phrase, case, places it fits, English hint (only where the verb alone does not decide the case)]
const CASE_VERBS = [
  ['Menen', 'mihin', () => true], ['Käyn', 'missa', () => true], ['Olen', 'missa', () => true],
  ['Asun', 'missa', p => CITY(p) || ['kaupunki', 'keskusta', 'talo'].includes(p.fi)],
  ['Olen kotoisin', 'mista', CITY], ['Tulen', 'mista', () => true, 'coming FROM'],
];
const CASE_Q = { missa: 'missä? (in / at)', mista: 'mistä? (from)', mihin: 'mihin? (to)' };
S.caseVerb = () => {
  const [verb, k, fits, hint] = pick(CASE_VERBS), p = pick(PLACES.filter(fits)), form = F.local(p)[k];
  return type(P(`${verb} ___ (${p.fi}).`), [form, `${verb} ${form}`], { sub: hint ? `The verb chooses the case (${hint})` : 'Which case does the verb need?', say: `${verb} ${form}.`, strictDots: true, explain: `<b>${verb.toLowerCase()}</b> + ${CASE_Q[k]} → <b>${form}</b>` });
};

S.vocab = null; // handled by vocab selection

export const SKILLS = S;
export const SKILL_NAMES = {
  letters: 'Letter names', length: 'Long vs. short', numbers: 'Numbers', numbersSpoken: 'Spoken numbers', prices: 'Prices',
  olla: 'olla (to be)', ollaNeg: 'olla: negative', ollaQ: 'olla: questions', ollaSpoken: 'olla: spoken', days: 'Days & "when"',
  harmony: 'Vowel harmony', tplural: 'T-plural', countries: 'Countries & languages', vt1: 'Verb type 1', vt1kpt: 'Verb type 1 + kpt',
  vt1neg: 'Negative verbs', questionKo: '-ko/-kö questions', qwords: 'Question words', months: 'Months & seasons', clothes: 'Clothes sentences',
  have: 'Minulla on', opposites: 'Opposites', genitive: 'Genitive', genitivePron: 'Whose? (pronouns)', partitive: 'Partitive',
  verbtype: 'Spot the verb type', vt15: 'Verb types 1–5', vt15neg: 'Negatives (all types)', postpos: 'Postpositions', local: 'Missä / mistä / mihin',
  clock: 'Telling time', clockAbl: 'At what time?', past: 'Past tense', wordorder: 'Word order', phrases: 'Situations',
  phone: 'Phone numbers', forecast: 'Weather forecast', partNeg: 'Negative + partitive', genPred: 'Whose is it?', gradAB: 'Gradation A / B', caseVerb: 'Verb → case',
};
export const SKILL_ICON = { letters: 'type', length: 'clock', numbers: 'hash', numbersSpoken: 'chat', prices: 'euro', olla: 'user', ollaNeg: 'ban', ollaQ: 'question', ollaSpoken: 'chat', days: 'calendar', harmony: 'scale', tplural: 'layers', countries: 'globe', vt1: 'run', vt1kpt: 'gear', vt1neg: 'ban', questionKo: 'question', qwords: 'help', months: 'calendar', clothes: 'shirt', have: 'gift', opposites: 'swap', genitive: 'link', genitivePron: 'user', partitive: 'cup', verbtype: 'puzzle', vt15: 'puzzle', vt15neg: 'ban', postpos: 'box', local: 'location', clock: 'clock', clockAbl: 'clock', past: 'rewind', wordorder: 'bricks', phrases: 'chat', phone: 'phone', forecast: 'cloud', partNeg: 'ban', genPred: 'key', gradAB: 'repeat', caseVerb: 'compass' };

/** Make n questions for a skill, tagging them with the skill id. */
export function skillQs(skill, n) {
  const g = S[skill]; if (!g) return [];
  const out = [], seen = new Set();
  for (let i = 0; out.length < n && i < n * 6; i++) {
    const q = g(); const key = q.prompt + '|' + JSON.stringify(q.answer);
    if (seen.has(key)) continue; seen.add(key); out.push({ ...q, skill });
  }
  return out;
}
export function topicWords(topicIds) {
  const ids = new Set(topicIds.flatMap(t => TOPIC_BY_ID[t]?.words || []));
  return [...ids].map(id => VOCAB_BY_ID[id]).filter(Boolean);
}
