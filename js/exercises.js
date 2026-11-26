// Exercise generators. Each skill returns fresh questions every time, so drills never run out.
import { VOCAB, VOCAB_BY_ID, TOPIC_BY_ID } from '../data/vocab.js';
import { VERBS } from '../data/verbs.js';
import { COUNTRIES, PLACES, POSTPOSITIONS, POSTPOS_THINGS, POSTPOS_REFS, NAMES, OPPOSITES, DAYS, MONTHS, SEASONS, RELDAYS, LETTERS, MINIMAL_PAIRS } from '../data/grammar.js';
import * as F from './fi.js';
import { shuffle, pick, sample, esc, fw } from './ui.js';
import { state } from './store.js';
import { icon } from './icons.js';

const W = fi => VOCAB_BY_ID['w:' + fi.toLowerCase()];
const cap = s => s[0].toUpperCase() + s.slice(1);
const PERS_EN = ['I', 'you', 'he/she', 'we', 'you (pl.)', 'they'];
const randInt = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const nouns = () => VOCAB.filter(w => w.pos === 'n' && w.gen && w.part && w.pl && !w.fi.includes(' ') && w.fi === w.fi.toLowerCase());
const mcOf = (answer, pool, n = 4) => shuffle([answer, ...sample([...new Set(pool.filter(x => x && x !== answer))], n - 1)]);

// ------------------------------------------------------------ vocabulary
/** Choose the exercise format from how well the word is known: recognise → recall → listen. */
export function vocabQ(w, { force } = {}) {
  const c = state().cards[w.id];
  const pool = VOCAB.filter(x => x.pos === w.pos && x.id !== w.id);
  const sameTopic = pool.filter(x => x.topics.some(t => w.topics.includes(t)));
  const distract = (sameTopic.length >= 3 ? sameTopic : pool);
  const isPhrase = w.pos === 'p' || w.fi.includes(' ');
  const mode = force || (!c ? 'intro' : c.s < 2 ? pick(['mcFiEn', 'mcEnFi', 'listenMc']) : c.s < 6 ? pick(['typeEnFi', 'mcEnFi', 'listenMc', 'typeEnFi']) : pick(['typeEnFi', 'listenType', 'typeEnFi']));
  const base = { item: w.id, say: w.fi };
  switch (mode) {
    case 'intro': return { ...base, kind: 'intro', word: w };
    case 'mcFiEn': return { ...base, kind: 'mc', prompt: `<div class="big fi">${fw(w.fi)}</div>`, sub: 'What does this mean?', answer: w.en, choices: mcOf(w.en, sample(distract, 8).map(x => x.en)), autoSay: true };
    case 'mcEnFi': return { ...base, kind: 'mc', prompt: `<div class="big">${esc(w.en)}</div>`, sub: 'Choose the Finnish', answer: w.fi, choices: mcOf(w.fi, sample(distract, 8).map(x => x.fi)), fiChoices: true };
    case 'listenMc': return { ...base, kind: 'mc', listen: true, prompt: `<div class="big">${icon('speaker', 'xl')}</div>`, sub: 'Listen. Which word is it?', answer: w.fi, choices: mcOf(w.fi, sample(distract, 8).map(x => x.fi)), fiChoices: true, reveal: w.en };
    case 'listenType': return { ...base, kind: 'type', listen: true, prompt: `<div class="big">${icon('speaker', 'xl')}</div>`, sub: 'Type what you hear', answer: w.fi, reveal: w.en };
    case 'tiles': {
      const toks = w.fi.replace(/[.!?]/g, '').split(' ');
      const extra = sample(VOCAB.filter(x => x.pos !== 'p' && !x.fi.includes(' ')).map(x => x.fi), Math.min(3, toks.length));
      return { ...base, kind: 'tiles', prompt: `<div class="big">${esc(w.en)}</div>`, sub: 'Build it in Finnish', answer: toks.join(' '), tiles: shuffle([...toks, ...extra]) };
    }
    default: // typeEnFi
      if (isPhrase && w.fi.split(' ').length >= 3) return vocabQ(w, { force: 'tiles' });
      return { ...base, kind: 'type', prompt: `<div class="big">${esc(w.en)}</div>`, sub: w.pos === 'n' && w.gen ? 'In Finnish (basic form)' : 'In Finnish', answer: w.fi.replace(/[!?.]$/, ''), alt: w.fi };
  }
}
export const flashQ = (w, dir = 'fi') => ({ kind: 'flash', item: w.id, say: w.fi, word: w, dir });

// ------------------------------------------------------------ skills
const S = {};
const type = (prompt, answer, o = {}) => ({ kind: 'type', prompt, answer, ...o });
const mc = (prompt, answer, choices, o = {}) => ({ kind: 'mc', prompt, answer, choices: shuffle([...new Set([answer, ...choices.filter(c => c !== answer)])].slice(0, 4)), ...o });
const P = (fi, en) => `<div class="big fi">${fw(fi)}</div>${en ? `<div class="en-hint">${esc(en)}</div>` : ''}`;

S.letters = () => {
  if (Math.random() < .5) {
    const [l, name] = pick(LETTERS);
    return mc(`<div class="big">“${esc(name)}”</div>`, l.toUpperCase(), sample(LETTERS, 6).map(x => x[0].toUpperCase()), { sub: 'Which letter has this name?', say: name });
  }
  const w = pick(['kissa', 'talo', 'äiti', 'kukka', 'Liisa', 'Pekka', 'sauna', 'kylä', 'tyttö', 'pöytä', 'Suomi', 'kahvi']);
  const spelled = [...w.toLowerCase()].map(ch => LETTERS.find(x => x[0] === ch)?.[1]).join(' – ');
  return type(`<div class="big">${esc(spelled)}</div>`, w, { sub: 'Write the word that is spelled out', say: spelled.replace(/ – /g, ', ') });
};
S.length = () => {
  const [a, ae, b, be] = pick(MINIMAL_PAIRS);
  const [w, e] = Math.random() < .5 ? [a, ae] : [b, be];
  return Math.random() < .55
    ? mc(`<div class="big">${icon('speaker', 'xl')}</div>`, w, [a, b], { listen: true, say: w, sub: 'Long or short? Which word do you hear?', fiChoices: true, reveal: `${w} = ${e}` })
    : mc(P(w), e, [ae, be, ...sample(MINIMAL_PAIRS, 2).map(x => x[1])], { say: w, sub: 'What does it mean? Watch the length!' });
};
S.numbers = () => {
  const n = pick([randInt(0, 10), randInt(11, 19), randInt(20, 99), randInt(20, 99), randInt(100, 999), randInt(1000, 2030)]);
  const r = Math.random();
  if (r < .4) return type(`<div class="big num">${n}</div>`, F.numWord(n), { sub: 'Write the number in Finnish', say: F.numWord(n) });
  if (r < .7) return type(`<div class="big">${icon('speaker', 'xl')}</div>`, String(n), { listen: true, say: F.numWord(n), sub: 'Listen and write the number in digits', reveal: F.numWord(n), numeric: true });
  return type(P(F.numWord(n)), String(n), { sub: 'Write it in digits', say: F.numWord(n), numeric: true });
};
S.numbersSpoken = () => {
  const n = randInt(1, 99), spoken = F.numSpoken(n);
  return Math.random() < .5
    ? mc(`<div class="big num">${n}</div>`, spoken[0], [randInt(1, 99), randInt(1, 99), randInt(1, 99)].map(x => F.numSpoken(x)[0]), { sub: 'How do Finns say it in spoken language?', say: spoken[0], fiChoices: true })
    : type(P(spoken[0]), String(n), { sub: 'Spoken number → digits', say: spoken[0], numeric: true });
};
S.prices = () => {
  const e = randInt(1, 20), c = pick([0, 10, 20, 30, 50, 90, randInt(1, 99)]);
  const price = `${e},${String(c).padStart(2, '0')} €`.replace(',00', '');
  const words = F.priceWords(e, c);
  return Math.random() < .5
    ? type(`<div class="big num">${price}</div>`, words, { sub: 'Say the price in Finnish (written or spoken style)', say: words[0] })
    : mc(`<div class="big">${icon('speaker', 'xl')}</div>`, price, [1, 2, 3].map(() => `${randInt(1, 20)},${String(pick([10, 20, 50, 90])).padStart(2, '0')} €`), { listen: true, say: `Se maksaa ${words.at(-1)}`, sub: 'Listen: what does it cost?', reveal: `Se maksaa ${words.at(-1)}` });
};
const OLLA = { inf: 'olla' };
S.olla = () => {
  const p = randInt(0, 5), f = F.present(OLLA)[p];
  return Math.random() < .6
    ? type(P(`${F.PERSONS[p]} ___`), f, { sub: `olla → ${PERS_EN[p]} ${['am', 'are', 'is', 'are', 'are', 'are'][p]}`, say: `${F.PERSONS[p]} ${f}` })
    : mc(P(`${cap(F.PERSONS[p])} ___ kotona.`), f, F.present(OLLA), { sub: 'Choose the right form of olla', say: `${cap(F.PERSONS[p])} ${f} kotona.` });
};
const OLLA_CTX = ['kotona', 'väsynyt', 'suomalainen', 'opettaja', 'iloinen', 'myöhässä', 'töissä'];
const OLLA_CTX_PL = ['kotona', 'väsyneitä', 'suomalaisia', 'opettajia', 'iloisia', 'myöhässä', 'töissä'];
S.ollaNeg = () => {
  const p = randInt(0, 5), i = randInt(0, OLLA_CTX.length - 1), x = p >= 3 ? OLLA_CTX_PL[i] : OLLA_CTX[i];
  const pos = `${cap(F.PERSONS[p])} ${F.present(OLLA)[p]} ${x}.`, neg = `${cap(F.PERSONS[p])} ${F.negative(OLLA)[p]} ${x}`;
  return type(P(pos), neg, { sub: 'Make it negative', say: neg });
};
S.ollaQ = () => {
  const p = pick([1, 2, 4, 5]), i = randInt(0, OLLA_CTX.length - 1), x = p >= 3 ? OLLA_CTX_PL[i] : OLLA_CTX[i];
  const f = F.present(OLLA)[p], q = cap(f) + 'ko';
  return type(P(`${cap(F.PERSONS[p])} ${f} ${x}.`), [`${q} ${F.PERSONS[p]} ${x}`, `${q} ${x}`], { sub: 'Turn it into a yes/no question', say: `${q} ${F.PERSONS[p]} ${x}?` });
};
S.ollaSpoken = () => {
  const p = randInt(0, 5), neg = Math.random() < .4;
  const w = neg ? F.negative(OLLA)[p] : F.present(OLLA)[p], s = (neg ? F.OLLA_SPOKEN_NEG : F.OLLA_SPOKEN)[p];
  return mc(P(`${F.PERSONS[p]} ${w}`), s, neg ? F.OLLA_SPOKEN_NEG : F.OLLA_SPOKEN, { sub: 'How does it sound in spoken Finnish?', say: s, fiChoices: true });
};
S.days = () => {
  const r = Math.random();
  if (r < .4) { const [d, na, en] = pick(DAYS); return type(`<div class="big">on ${en}</div>`, na, { sub: 'Milloin? (when) → add -na/-nä', say: na }); }
  if (r < .7) { const [d, , en] = pick(DAYS); return mc(`<div class="big">${en}</div>`, d, DAYS.map(x => x[0]), { sub: 'Choose the Finnish day', say: d, fiChoices: true }); }
  const t = randInt(0, 6), [rel, off, en] = pick(RELDAYS.filter(x => x[1] !== 0)), target = DAYS[(t + off + 7) % 7][0];
  return mc(P(`Tänään on ${DAYS[t][0]}. Mikä päivä on ${rel}?`), target, DAYS.map(x => x[0]), { sub: `${rel} = ${en}`, fiChoices: true, say: `Tänään on ${DAYS[t][0]}. Mikä päivä on ${rel}?` });
};
S.harmony = () => {
  if (Math.random() < .5) {
    const w = pick(nouns()), stem = w.gen.slice(0, -1), [suf, en] = pick([['ssa', 'in'], ['sta', 'from'], ['lla', 'on']]);
    const right = F.hv(suf, w.fi), wrong = right.includes('a') ? right.replace(/a/g, 'ä') : right.replace(/ä/g, 'a');
    return mc(P(`${stem}___`), right, [right, wrong], { sub: `${w.fi} (${w.en}) → ${en} the ${w.en.split(/[;,]/)[0]}`, say: stem + right, fiChoices: true, explain: harmonyExplain(w.fi) });
  }
  const v = pick(VERBS.filter(v => v.type && v.type <= 5)), p = pick([1, 2, 4, 5]), f = F.present(v)[p];
  const right = F.hv('ko', v.inf);
  return mc(P(`${cap(f)}___ ${F.PERSONS[p]}?`), right, ['ko', 'kö'], { sub: `${v.inf}: ${v.en}. Question ending?`, say: `${cap(f)}${right} ${F.PERSONS[p]}?`, fiChoices: true, explain: harmonyExplain(v.inf) });
};
function harmonyExplain(word) {
  const h = F.harmony(word);
  return h === 'b' ? `<b>${esc(word)}</b> has back vowels (a, o, u) → back endings: -ssa, -sta, -lla, -ko, -vat`
    : `<b>${esc(word)}</b> has front or neutral vowels (ä, ö, y, e, i) → front endings: -ssä, -stä, -llä, -kö, -vät`;
}
S.tplural = () => {
  const w = pick(nouns());
  return type(P(w.fi, w.en), w.pl, { sub: 'Make it plural (t-plural)', say: w.pl, explain: `Genitive <b>${w.gen}</b> → swap -n for -t → <b>${w.pl}</b>` });
};
S.countries = () => {
  const c = pick(COUNTRIES), r = Math.random();
  if (r < .3) return type(P(`Olen kotoisin ___. (${c.fi})`), c.from, { sub: `I'm from ${c.en}`, say: `Olen kotoisin ${c.from}.` });
  if (r < .55) return type(P(`Puhun ___. (${c.lang})`), c.langPart, { sub: `I speak ${c.langEn}. Languages after puhua take the partitive`, say: `Puhun ${c.langPart}.` });
  if (r < .8) return mc(P(c.fi), c.nat, sample(COUNTRIES, 5).map(x => x.nat), { sub: `${c.en}: what is the nationality?`, say: c.nat, fiChoices: true });
  return mc(`<div class="big">${esc(c.en)}</div>`, c.fi, sample(COUNTRIES, 5).map(x => x.fi), { sub: 'Which country?', say: c.fi, fiChoices: true });
};
// verbs
const verbPool = filter => VERBS.filter(v => v.inf !== 'olla' && filter(v));
function conjQ(v, kind = 'pos') {
  const p = randInt(0, 5);
  if (kind === 'neg') {
    const f = F.negative(v)[p];
    return type(P(`${F.PERSONS[p]} + ei + ${v.inf}`), f, { sub: `${PERS_EN[p]} don't (${v.en.replace(/^to /, '')})`, say: `${F.PERSONS[p]} ${f}`, explain: verbExplain(v) });
  }
  if (kind === 'q') {
    const qp = pick([1, 2, 4]), f = F.present(v)[qp] + F.qSuffix(v.inf);
    return type(P(`${F.PERSONS[qp]} ${F.present(v)[qp]} → ?`), f, { sub: 'Make a yes/no question with -ko/-kö (just the verb)', say: `${cap(f)} ${F.PERSONS[qp]}?`, explain: verbExplain(v) });
  }
  if (kind === 'past') {
    const f = F.past(v)[p];
    return type(P(`${F.PERSONS[p]} + ${v.inf} (eilen)`), f, { sub: `past tense: ${PERS_EN[p]} ${v.en.replace(/^to /, '')} (yesterday)`, say: `Eilen ${F.PERSONS[p]} ${f}.`, explain: `minä <b>${v.p1}</b> · hän <b>${v.p3}</b>` });
  }
  const f = F.present(v)[p];
  return type(P(`${F.PERSONS[p]} + ${v.inf}`), f, { sub: `${PERS_EN[p]} ${v.en.replace(/^to /, '').split(/[;(]/)[0].trim()}`, say: `${F.PERSONS[p]} ${f}`, explain: verbExplain(v) });
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
  return mc(P(v.inf, v.en), `type ${v.type}`, ['type 1', 'type 2', 'type 3', 'type 4', 'type 5', 'type 6'].filter(t => t !== `type ${v.type}`).slice(0, 3).concat(`type ${v.type}`), { sub: 'Which verb type?', say: v.inf, explain: verbExplain(v) });
};
const QW = [
  ['___ sinä asut?', 'Asun Helsingissä.', 'missä'], ['___ sinä olet kotoisin?', 'Olen kotoisin Ruotsista.', 'mistä'], ['___ sinä menet?', 'Menen kotiin.', 'mihin'],
  ['___ hän on?', 'Hän on opettaja.', 'kuka'], ['___ tämä on?', 'Tämä on kirja.', 'mikä'], ['___ sinä teet?', 'Minä luen.', 'mitä'],
  ['___ sinä tulet?', 'Huomenna.', 'milloin'], ['___ sinä olet väsynyt?', 'Koska nukuin huonosti.', 'miksi'], ['___ sanotaan "thank you" suomeksi?', 'Kiitos.', 'miten'],
  ['___ sää on?', 'Sää on kaunis.', 'millainen'], ['___ auto tämä on?', 'Se on Pekan auto.', 'kenen'], ['___ vanha sinä olet?', 'Olen 30 vuotta vanha.', 'kuinka'],
  ['___ kello on?', 'Kello on kolme.', 'paljonko'], ['___ sinä syöt?', 'Syön leipää.', 'mitä'], ['___ sinun nimi on?', 'Minun nimi on Tom.', 'mikä'],
  ['___ kieliä sinä puhut?', 'Puhun suomea.', 'mitä'], ['___ monta lasta sinulla on?', 'Minulla on kaksi lasta.', 'kuinka'], ['___ juna lähtee?', 'Kello kahdeksalta.', 'milloin'],
];
S.qwords = () => {
  const [q, a, w] = pick(QW);
  return mc(P(q), cap(w), ['Missä', 'Mistä', 'Mihin', 'Kuka', 'Mikä', 'Mitä', 'Milloin', 'Miksi', 'Miten', 'Millainen', 'Kenen', 'Kuinka', 'Paljonko'].filter(x => x !== cap(w)).sort(() => Math.random() - .5).slice(0, 3), { sub: `Answer: “${a}”. Which question word?`, say: q.replace('___', cap(w)), fiChoices: true });
};
S.months = () => {
  const r = Math.random();
  if (r < .4) { const [m, ssa, en] = pick(MONTHS); return type(`<div class="big">in ${en}</div>`, ssa, { sub: 'Missä kuussa? → -ssa', say: ssa }); }
  if (r < .7) { const [s, lla, en] = pick(SEASONS); return type(`<div class="big">in ${en}</div>`, lla, { sub: 'Milloin? Seasons take -lla/-llä', say: lla }); }
  const [q, a] = pick([['Milloin on joulu?', 'joulukuussa'], ['Milloin on juhannus?', 'kesäkuussa'], ['Milloin on vappu?', 'toukokuussa'], ['Milloin uusi vuosi alkaa?', 'tammikuussa'], ['Milloin koulu alkaa Suomessa?', 'elokuussa'], ['Milloin on itsenäisyyspäivä?', 'joulukuussa']]);
  return mc(P(q), a, MONTHS.map(m => m[1]), { sub: 'Choose the month', say: q, fiChoices: true });
};
const CLOTHES_SG = ['paita', 'hattu', 'takki', 'mekko', 'hame', 'pipo', 'villapaita', 'huivi', 'laukku'];
const CLOTHES_PL = ['housut', 'farkut', 'shortsit', 'hanskat', 'lenkkarit'];
const COLS = ['punainen', 'sininen', 'musta', 'valkoinen', 'vihreä', 'keltainen', 'harmaa', 'ruskea'];
S.clothes = () => {
  const plural = Math.random() < .45;
  const noun = W(plural ? pick(CLOTHES_PL) : pick(CLOTHES_SG)), col = W(pick(COLS));
  const adj = plural ? col.pl : col.fi;
  const answer = `Minulla on päällä ${adj} ${noun.fi}`;
  const en = `I'm wearing ${plural ? '' : 'a '}${col.en} ${noun.en}`;
  const wrongAdj = plural ? col.fi : col.pl;
  return { kind: 'tiles', prompt: `<div class="big">${esc(en)}</div>`, sub: plural ? 'Plural clothes → plural adjective!' : 'Build the sentence', answer, tiles: shuffle(['Minulla', 'on', 'päällä', adj, noun.fi, wrongAdj, pick(['minä', 'olen'])]), say: answer };
};
const HAVE_THINGS = ['koira', 'kissa', 'auto', 'pyörä', 'hevonen', 'puhelin', 'avain', 'sateenvarjo', 'kynä', 'porkkana'];
S.have = () => {
  const w = W(pick(HAVE_THINGS)), r = Math.random();
  if (r < .35) { const p = randInt(0, 5); const a = `${cap(F.ADESSIVE_PRON[p])} on ${w.fi}`; return type(`<div class="big">${esc(['I have', 'you have', 'he/she has', 'we have', 'you (pl.) have', 'they have'][p])} a ${esc(w.en)}</div>`, a, { sub: 'Person + -lla/-llä + on', say: a }); }
  if (r < .65) { const p = randInt(0, 5); const a = `${cap(F.ADESSIVE_PRON[p])} ei ole ${w.part}`; return type(`<div class="big">${esc(['I', 'you', 'he/she', 'we', 'you (pl.)', 'they'][p])} ${p === 2 ? "doesn't" : "don't"} have a ${esc(w.en)}</div>`, a, { sub: 'Negative → the thing goes into the partitive', say: a, explain: `${w.fi} → partitive <b>${w.part}</b>` }); }
  const n = pick(NAMES), a = `${n.ade} on ${w.fi}`;
  return type(`<div class="big">${n.fi} has a ${esc(w.en)}</div>`, a, { sub: 'Names take -lla/-llä too (watch kpt!)', say: a, explain: `${n.fi} → <b>${n.ade}</b>` });
};
S.opposites = () => {
  const [a, b] = pick(OPPOSITES), [x, y] = Math.random() < .5 ? [a, b] : [b, a];
  return mc(P(x, W(x)?.en), y, sample(OPPOSITES.flat(), 6), { sub: 'Choose the opposite', say: y, fiChoices: true });
};
S.genitive = () => {
  const r = Math.random();
  if (r < .5) { const w = pick(nouns()); return type(P(w.fi, w.en), w.gen, { sub: 'Genitive (kenen? minkä?) → -n', say: w.gen }); }
  const owner = W(pick(['opettaja', 'lääkäri', 'naapuri', 'äiti', 'isä', 'tyttö', 'poika', 'ystävä', 'nainen', 'mies'])), thing = W(pick(['auto', 'kirja', 'koira', 'talo', 'puhelin', 'laukku', 'avain', 'kissa']));
  const a = `${owner.gen} ${thing.fi}`;
  return type(`<div class="big">the ${esc(owner.en.split(/[;,]/)[0])}'s ${esc(thing.en)}</div>`, a, { sub: 'Owner in the genitive comes first', say: a });
};
S.genitivePron = () => {
  const p = randInt(0, 5), thing = W(pick(['kirja', 'auto', 'koira', 'äiti', 'talo', 'nimi', 'puhelin']));
  const a = `${F.GENITIVE_PRON[p]} ${thing.fi}`;
  return type(`<div class="big">${['my', 'your', 'his/her', 'our', 'your (pl.)', 'their'][p]} ${esc(thing.en)}</div>`, a, { sub: 'Kenen? → genitive pronoun', say: a });
};
const DRINKS = ['kahvi', 'tee', 'maito', 'vesi', 'mehu', 'olut', 'viini'], FOODS = ['leipä', 'juusto', 'liha', 'kala', 'riisi', 'keitto', 'salaatti', 'jäätelö', 'puuro', 'suklaa'];
S.partitive = () => {
  const r = Math.random();
  if (r < .3) { const w = pick(nouns()), n = randInt(2, 9); return type(P(`${F.numWord(n)} ___ (${w.fi})`), w.part, { sub: `${n} × ${w.en}: after numbers → partitive`, say: `${F.numWord(n)} ${w.part}`, explain: partExplain(w) }); }
  if (r < .55) { const w = W(pick(DRINKS)); return type(P(`Minä juon ___ (${w.fi}).`), w.part, { sub: `I drink ${w.en}`, say: `Minä juon ${w.part}.`, explain: partExplain(w) }); }
  if (r < .75) { const w = W(pick(FOODS)); return type(P(`Minä syön ___ (${w.fi}).`), w.part, { sub: `I eat ${w.en}`, say: `Minä syön ${w.part}.`, explain: partExplain(w) }); }
  const w = pick(nouns());
  return type(P(w.fi, w.en), w.part, { sub: 'Partitive form', say: w.part, explain: partExplain(w) });
};
function partExplain(w) {
  const e = w.part.endsWith('tta') || w.part.endsWith('ttä') ? '-tta/-ttä (word ends in -e)' : /t[aä]$/.test(w.part) ? '-ta/-tä (long vowel, diphthong or consonant)' : '-a/-ä (short vowel ending)';
  return `<b>${w.fi}</b> → <b>${w.part}</b>: ${e}`;
}
S.postpos = () => {
  const thing = W(pick(POSTPOS_THINGS)), ref = W(pick(POSTPOS_REFS)), [pp, en] = pick(POSTPOSITIONS);
  const answer = `${cap(thing.fi)} on ${ref.gen} ${pp}`;
  return { kind: 'tiles', prompt: `<div class="big">The ${esc(thing.en)} is ${en} the ${esc(ref.en)}.</div>`, sub: 'Genitive + postposition', answer, tiles: shuffle([cap(thing.fi), 'on', ref.gen, pp, ref.fi, pick(POSTPOSITIONS.filter(x => x[0] !== pp))[0]]), say: answer };
};
S.local = () => {
  const p = pick(PLACES), l = F.local(p), [k, q, en] = pick([['missa', 'Missä?', 'in / at'], ['mista', 'Mistä?', 'from'], ['mihin', 'Mihin?', 'to']]);
  return type(P(`${q} (${p.fi})`), l[k], { sub: `${en} the ${p.en}${p.o ? ' (an outer-case place!)' : ''}`, say: l[k], explain: `${p.fi}: <b>${l.missa}</b> · <b>${l.mista}</b> · <b>${l.mihin}</b>${p.o ? '<br>This place uses the outer cases -lla / -lta / -lle.' : ''}` });
};
const CLOCK_MINS = [0, 0, 15, 30, 30, 45, 5, 10, 20, 40, 50, 55];
S.clock = () => {
  const h = randInt(1, 12), m = pick(CLOCK_MINS), words = F.clockWords(h, m);
  const t = `${h}:${String(m).padStart(2, '0')}`;
  if (Math.random() < .55) return type(`<div class="big num">${t}</div>`, words.flatMap(w => [w, `kello on ${w}`]), { sub: 'Paljonko kello on? (12-hour words)', say: `Kello on ${words[0]}.` });
  const others = [1, 2, 3].map(() => `${randInt(1, 12)}:${String(pick(CLOCK_MINS)).padStart(2, '0')}`);
  return mc(`<div class="big">${icon('speaker', 'xl')}</div>`, t, others, { listen: true, say: `Kello on ${words[0]}.`, sub: 'Listen: what time is it?', reveal: `Kello on ${words[0]}.` });
};
S.clockAbl = () => {
  const h = randInt(1, 12), a = `kello ${F.hourAblative(h)}`, act = pick([['herään', 'I wake up'], ['menen töihin', 'I go to work'], ['syön lounasta', 'I eat lunch'], ['tulen kotiin', 'I come home'], ['menen nukkumaan', 'I go to sleep']]);
  return type(P(`Mihin aikaan? (${h}:00)`), [a, F.hourAblative(h)], { sub: `${act[1]} at ${h} o'clock → kello + -lta/-ltä`, say: `${cap(act[0])} ${a}.` });
};
const SENTENCES = [
  ['Minä juon kahvia aamulla.', 'I drink coffee in the morning.'], ['Me asumme Helsingissä.', 'We live in Helsinki.'],
  ['Hän ei puhu ruotsia.', "He doesn't speak Swedish."], ['Puhutko sinä englantia?', 'Do you speak English?'],
  ['Kissa nukkuu sängyn alla.', 'The cat sleeps under the bed.'], ['Minulla on kaksi siskoa.', 'I have two sisters.'],
  ['Menen kauppaan huomenna.', "I'm going to the shop tomorrow."], ['Tänään sataa lunta.', "It's snowing today."],
  ['He tulevat Ruotsista.', 'They come from Sweden.'], ['Ostan kilon perunoita.', 'I buy a kilo of potatoes.'],
  ['Mihin aikaan sinä heräät?', 'What time do you wake up?'], ['Kenen auto tämä on?', 'Whose car is this?'],
  ['Me menemme saunaan illalla.', "We're going to the sauna in the evening."], ['Minä en ymmärrä sinua.', "I don't understand you."],
  ['Pekka on töissä toimistossa.', 'Pekka is at work in an office.'], ['Hänellä on siniset silmät.', 'She has blue eyes.'],
  ['Eilen söin pullaa kahvilassa.', 'Yesterday I ate a bun at a café.'], ['Juna lähtee asemalta kello kuudelta.', 'The train leaves the station at six.'],
];
S.wordorder = () => {
  const [fi, en] = pick(SENTENCES), toks = fi.replace(/[.?!]/g, '').split(' ');
  return { kind: 'tiles', prompt: `<div class="big">${esc(en)}</div>`, sub: 'Put the words in order', answer: toks.join(' '), tiles: shuffle(toks), say: fi };
};
S.phrases = () => {
  const SIT = [
    ["It's 8 a.m. You meet your neighbour.", 'Hyvää huomenta!'], ['You leave a party at night.', 'Hyvää yötä!'], ['Someone gives you a coffee.', 'Kiitos!'],
    ['You bump into someone.', 'Anteeksi!'], ['You meet someone new.', 'Hauska tavata!'], ['Dinner is served.', 'Hyvää ruokahalua!'],
    ['You raise your glass.', 'Kippis!'], ['Your friend got a new job.', 'Onneksi olkoon!'], ['A friend leaves for a trip.', 'Hyvää matkaa!'],
    ["You didn't understand.", 'En ymmärrä.'], ['You leave a shop (formal).', 'Näkemiin!'], ['You hand someone a book.', 'Ole hyvä!'],
  ];
  const [s, a] = pick(SIT);
  return mc(`<div class="big">${esc(s)}</div>`, a, SIT.map(x => x[1]), { sub: 'What do you say?', say: a, fiChoices: true });
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
};
export const SKILL_ICON = { letters: 'type', length: 'clock', numbers: 'hash', numbersSpoken: 'chat', prices: 'euro', olla: 'user', ollaNeg: 'ban', ollaQ: 'question', ollaSpoken: 'chat', days: 'calendar', harmony: 'scale', tplural: 'layers', countries: 'globe', vt1: 'run', vt1kpt: 'gear', vt1neg: 'ban', questionKo: 'question', qwords: 'help', months: 'calendar', clothes: 'shirt', have: 'gift', opposites: 'swap', genitive: 'link', genitivePron: 'user', partitive: 'cup', verbtype: 'puzzle', vt15: 'puzzle', vt15neg: 'ban', postpos: 'box', local: 'location', clock: 'clock', clockAbl: 'clock', past: 'rewind', wordorder: 'bricks', phrases: 'chat' };

/** Make n questions for a skill, tagging them with the skill id. */
export function skillQs(skill, n) {
  const g = S[skill]; if (!g) return [];
  const out = [], seen = new Set();
  for (let i = 0; out.length < n && i < n * 6; i++) {
    const q = g(); const key = q.prompt + '|' + q.answer;
    if (seen.has(key)) continue; seen.add(key); out.push({ ...q, skill });
  }
  return out;
}
export function topicWords(topicIds) {
  const ids = new Set(topicIds.flatMap(t => TOPIC_BY_ID[t]?.words || []));
  return [...ids].map(id => VOCAB_BY_ID[id]).filter(Boolean);
}
