// SuomiT — Finnish language engine: vowel harmony, conjugation, cases, numbers, clock, answer checking.

const BACK = 'aou', FRONT = 'äöy';

/** Compound words whose LAST part has only neutral vowels (e, i) take FRONT endings, because the last
 *  part decides: sukunimi → sukunimessä, rautatie → rautatiellä, aviomies → aviomiehellä.
 *  (A word with no compound boundary, e.g. "sapeli", keeps back harmony: sapelilla.) */
const NEUTRAL_HEADS = ['nimi', 'tie', 'mies', 'veli', 'kieli', 'peli', 'kivi', 'liike', 'kirje', 'sieni', 'tiili', 'piiri', 'lehti', 'helmi', 'niemi', 'vesi'];
/** 'b' (back: a/o/u) or 'f' (front: ä/ö/y). Decided by the LAST harmonic vowel, which handles compounds
 *  like kesäkuu → kesäkuussa. Words with only neutral vowels (e, i) are front. */
export function harmony(word, override) {
  if (override) return override;
  const w = word.toLowerCase().replace(/[^a-zåäöüé-]/g, '');
  for (const h of NEUTRAL_HEADS) {
    if (w.endsWith(h) && w.length - h.length >= 3 && /[aeiouyäö]/.test(w.slice(0, -h.length))) return 'f';
  }
  for (let i = w.length - 1; i >= 0; i--) {
    if (BACK.includes(w[i])) return 'b';
    if (FRONT.includes(w[i])) return 'f';
  }
  return 'f';
}
/** Pick the right vowel variant: hv('ssa', word) → 'ssa' | 'ssä'. */
export function hv(suffix, word, override) {
  if (harmony(word, override) === 'b') return suffix;
  return suffix.replace(/a/g, 'ä').replace(/o/g, 'ö').replace(/u/g, 'y');
}
export const qSuffix = (word, o) => hv('ko', word, o);

// ---------------------------------------------------------------- verbs
export const PERSONS = ['minä', 'sinä', 'hän', 'me', 'te', 'he'];
export const PERSONS_EN = ['I', 'you', 'he/she', 'we', 'you (pl.)', 'they'];
export const NEG = ['en', 'et', 'ei', 'emme', 'ette', 'eivät'];
const DIPH = /(aa|ee|ii|oo|uu|yy|ää|öö|ai|ei|oi|ui|yi|äi|öi|au|eu|iu|ou|ey|iy|äy|öy|ie|uo|yö)$/;

/** verb: {inf, type, a: weak/“minä” stem, b: strong/“hän” stem (defaults to a)} */
export function present(verb) {
  if (verb.inf === 'olla') return ['olen', 'olet', 'on', 'olemme', 'olette', 'ovat'];
  const A = verb.a, B = verb.b || verb.a;
  const han = DIPH.test(B) ? B : B + B[B.length - 1];
  const vat = hv('vat', verb.inf);
  return [A + 'n', A + 't', han, A + 'mme', A + 'tte', B + vat];
}
export function negative(verb) {
  const stem = verb.inf === 'olla' ? 'ole' : verb.a;
  return NEG.map(n => n + ' ' + stem);
}
export function question(verb, p) {
  const f = present(verb)[p];
  return f + qSuffix(verb.inf);
}
/** Simple past (imperfekti), positive. verb.p1 = minä-form, verb.p3 = hän-form. */
export function past(verb) {
  if (!verb.p1) return null;
  const s = verb.p1.slice(0, -1), vat = hv('vat', verb.inf);
  return [verb.p1, s + 't', verb.p3, s + 'mme', s + 'tte', verb.p3 + vat];
}
export const OLLA_SPOKEN = ['mä oon', 'sä oot', 'se on', 'me ollaan', 'te ootte', 'ne on'];
export const OLLA_SPOKEN_NEG = ['mä en oo', 'sä et oo', 'se ei oo', 'me ei olla', 'te ette oo', 'ne ei oo'];
export const ADESSIVE_PRON = ['minulla', 'sinulla', 'hänellä', 'meillä', 'teillä', 'heillä'];
export const GENITIVE_PRON = ['minun', 'sinun', 'hänen', 'meidän', 'teidän', 'heidän'];

// ---------------------------------------------------------------- nouns
/** Weak vowel stem from the genitive: talon → talo, kaupan → kaupa. */
export const genStem = n => n.gen.slice(0, -1);
/** noun: {fi, gen, ill, o (outer place), h (harmony override)} */
export function local(n) {
  if (n.cases) return n.cases; // irregular: [missä, mistä, mihin]
  const s = genStem(n), H = x => hv(x, n.fi, n.h);
  return n.o
    ? { missa: s + H('lla'), mista: s + H('lta'), mihin: s + 'lle' }
    : { missa: s + H('ssa'), mista: s + H('sta'), mihin: n.ill };
}

// ---------------------------------------------------------------- numbers
const ONES = ['nolla', 'yksi', 'kaksi', 'kolme', 'neljä', 'viisi', 'kuusi', 'seitsemän', 'kahdeksan', 'yhdeksän', 'kymmenen'];
const ONES_SPOKEN = ['nolla', 'yks', 'kaks', 'kolme', 'neljä', 'viis', 'kuus', 'seittemän', 'kaheksan', 'yheksän', 'kymmenen'];
const TENS_SPOKEN = { 2: 'kakskyt', 3: 'kolkyt', 4: 'nelkyt', 5: 'viiskyt', 6: 'kuuskyt', 7: 'seitkyt', 8: 'kaheksankyt', 9: 'yheksänkyt' };

export function numWord(n) {
  if (n <= 10) return ONES[n];
  if (n < 20) return ONES[n - 10] + 'toista';
  if (n < 100) { const t = Math.floor(n / 10), o = n % 10; return ONES[t] + 'kymmentä' + (o ? ONES[o] : ''); }
  if (n < 1000) { const h = Math.floor(n / 100), r = n % 100; return (h === 1 ? 'sata' : ONES[h] + 'sataa') + (r ? numWord(r) : ''); }
  if (n < 1000000) { const k = Math.floor(n / 1000), r = n % 1000; return (k === 1 ? 'tuhat' : numWord(k) + 'tuhatta') + (r ? numWord(r) : ''); }
  return String(n);
}
/** numWord split after its thousands and hundreds ("tuhat kolmesataa kuusi"): read aloud it sounds the same,
 *  and the audio player can piece it together from recorded parts. */
export function numSay(n) {
  if (n < 100) return numWord(n);
  if (n < 1000) { const h = Math.floor(n / 100), r = n % 100; return (h === 1 ? 'sata' : ONES[h] + 'sataa') + (r ? ' ' + numWord(r) : ''); }
  if (n < 1000000) { const k = Math.floor(n / 1000), r = n % 1000; return (k === 1 ? 'tuhat' : numWord(k) + 'tuhatta') + (r ? ' ' + numSay(r) : ''); }
  return String(n);
}
/** Accepted written variants: compound numerals are written as one word, but Kielitoimisto allows a
 *  space after the thousands for readability (kaksituhatta kaksikymmentä). */
export function numWords(n) {
  const w = numWord(n), out = [w];
  if (n >= 1000 && n < 1000000 && n % 1000) {
    const k = Math.floor(n / 1000), head = k === 1 ? 'tuhat' : numWord(k) + 'tuhatta';
    out.push(head + ' ' + numWord(n % 1000));
  }
  return out;
}
/** Colloquial (spoken) numbers, 0–99. Returns all accepted variants; first = most common. */
export function numSpoken(n) {
  if (n <= 10) return [ONES_SPOKEN[n]];
  if (n < 20) { const o = ONES_SPOKEN[n - 10]; return [o + 'toist', o + 'toista']; }
  if (n < 100) {
    const t = Math.floor(n / 10), o = n % 10;
    const tens = t === 1 ? 'kymmenen' : TENS_SPOKEN[t];
    const alt = { 7: 'seiskyt', 8: 'kasikyt', 9: 'ysikyt' }[t];
    const res = [tens + (o ? ONES_SPOKEN[o] : '')];
    if (alt) res.push(alt + (o ? ONES_SPOKEN[o] : ''));
    return res;
  }
  return [numWord(n)];
}
/** Every accepted way to say n (< 100): the written form first, then the spoken ones (kaksi, kaks). */
export const numForms = n => [...new Set([numWord(n), ...numSpoken(n)])];
/** Ways to say a price. [0] = canonical written form ("kaksi euroa viisikymmentä senttiä").
 *  Each word may be written or spoken style on its own: "kaksi euroa kolkyt", "kaks euroo viisikymmentä senttiä".
 *  The short "kaksi viisikymmentä" style is only used for 10+ cents: "kaksi viisi" would be heard as 2,50. */
export function priceWords(euros, cents) {
  const E = numForms(euros), C = cents ? numForms(cents) : [];
  const EUR = euros === 1 ? ['euro'] : ['euroa', 'euroo'], CNT = cents === 1 ? ['sentti'] : ['senttiä', 'senttii'];
  const out = [];
  const each = (lists, f) => { const go = (i, acc) => i === lists.length ? out.push(f(...acc)) : lists[i].forEach(x => go(i + 1, [...acc, x])); go(0, []); };
  if (!cents) { each([E, EUR], (e, eu) => `${e} ${eu}`); return [...new Set(out)]; }
  each([E, EUR, C, CNT], (e, eu, c, ct) => `${e} ${eu} ${c} ${ct}`);
  each([E, EUR, C, CNT], (e, eu, c, ct) => `${e} ${eu} ja ${c} ${ct}`);
  if (cents >= 10) {
    each([E, EUR, C], (e, eu, c) => `${e} ${eu} ${c}`);
    each([E, C], (e, c) => `${e} ${c}`); // e.g. "kaks kolkyt", "kaksi kolkyt"
    if (euros === 1) each([C], c => `euro ${c}`); // "euro kolkyt" = 1,30
  }
  return [...new Set(out)];
}
/** The form a Finn would say aloud at the till (spoken style when it is unambiguous). */
export function priceSay(euros, cents) {
  return cents >= 10 ? `${numSpoken(euros)[0]} ${numSpoken(cents)[0]}` : priceWords(euros, cents)[0];
}

// ---------------------------------------------------------------- clock
const HOUR_ABL = ['', 'yhdeltä', 'kahdelta', 'kolmelta', 'neljältä', 'viideltä', 'kuudelta', 'seitsemältä', 'kahdeksalta', 'yhdeksältä', 'kymmeneltä', 'yhdeltätoista', 'kahdeltatoista'];
/** Returns accepted ways to say h:m (12-hour clock words). First = canonical. */
export function clockWords(h, m) {
  const h12 = ((h + 11) % 12) + 1, next = (h12 % 12) + 1; // 12:45 → varttia vaille YKSI
  const H = numWord(h12), N = numWord(next);
  if (m === 0) return [`${H}`, `tasan ${H}`, `kello ${H}`, `${H} tasan`];
  if (m === 30) return [`puoli ${N}`];
  if (m === 15) return [`varttia yli ${H}`, `vartin yli ${H}`, `viisitoista yli ${H}`, `viisitoista minuuttia yli ${H}`];
  if (m === 45) return [`varttia vaille ${N}`, `vartin vaille ${N}`, `viisitoista vaille ${N}`, `viittätoista vaille ${N}`, `viisitoista minuuttia vaille ${N}`];
  if (m < 30) return [`${numWord(m)} yli ${H}`, `${numWord(m)} minuuttia yli ${H}`];
  const r = 60 - m, part = { 5: 'viittä', 10: 'kymmentä', 20: 'kahtakymmentä', 25: 'kahtakymmentäviittä' }[r];
  const out = [`${numWord(r)} vaille ${N}`, `${numWord(r)} minuuttia vaille ${N}`];
  if (part) out.push(`${part} vaille ${N}`, `${part} minuuttia vaille ${N}`);
  return out;
}
export const hourAblative = h => HOUR_ABL[((h + 11) % 12) + 1];

// ---------------------------------------------------------------- answer checking
export const stripDots = s => s.replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/å/g, 'a');
export function norm(s) {
  return (s || '').toLowerCase().normalize('NFC')
    .replace(/[’`´]/g, "'").replace(/[.!?¿¡,;:"“”()]/g, '').replace(/\s+/g, ' ').trim();
}
function lev(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 9;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
/** A one-letter slip counts as a harmless typo only when it cannot be grammar. In Finnish a single letter
 *  is often the whole point: kahvi/kahvia, en puhu/en puhun, tulemme/tulimme, lähden/lähten, kirjasto/kirjasta.
 *  So: consonant-only edits, not a consonant-gradation pair, not in the last 2 letters of a word, words of 6+ letters. */
const VOWELS = 'aeiouyäöå';
const GRADATION = new Set(['t|d', 'k|v', 'k|j', 'p|v', 'r|t', 'l|t', 'n|t', 'm|p', 'g|k', 'n|g', 'h|k', 'p|m']);
const gradPair = (a, b) => GRADATION.has(a + '|' + b) || GRADATION.has(b + '|' + a);
function harmlessTypo(a, x) {
  // a = accepted answer, x = input (both normalised); assumes lev(a, x) === 1
  let p = 0; while (p < a.length && p < x.length && a[p] === x[p]) p++;
  let qa = a.length - 1, qx = x.length - 1;
  while (qa >= p && qx >= p && a[qa] === x[qx]) { qa--; qx--; }
  const ca = a.slice(p, qa + 1), cx = x.slice(p, qx + 1); // the differing letters ('' for insert/delete)
  if (ca.length > 1 || cx.length > 1) return false;
  const letters = ca + cx;
  if ([...letters].some(ch => VOWELS.includes(ch) || ch === ' ' || ch === '-')) return false;
  if (ca && cx && gradPair(ca, cx)) return false;
  if (!(ca && cx) && 'ktpdg'.includes(letters)) return false; // inserting/dropping a gradation consonant (luen/luken)
  const end = a.indexOf(' ', p), tokEnd = end < 0 ? a.length : end, tokStart = a.lastIndexOf(' ', p - 1) + 1;
  if (tokEnd - tokStart < 6) return false;
  return tokEnd - p > 2;
}
/** Compare a typed answer against one or more accepted answers.
 *  → {ok, grade: 'exact'|'dots'|'length'|'typo'|'wrong', best}
 *  strictDots: ä/ö mistakes count as wrong (used where vowel harmony is what is being tested). */
export function check(input, accepted, { strictDots = false } = {}) {
  const list = (Array.isArray(accepted) ? accepted : [accepted]).flatMap(a => String(a).split(' / '));
  const x = norm(input);
  if (!x) return { ok: false, grade: 'wrong', best: list[0] };
  for (const a of list) if (norm(a) === x) return { ok: true, grade: 'exact', best: a };
  for (const a of list) if (stripDots(norm(a)) === stripDots(x))
    return { ok: !strictDots, grade: 'dots', best: a };
  // A missing/extra doubled letter is NOT a typo in Finnish (kisa ≠ kissa, tuli ≠ tuuli)
  const single = s => s.replace(/(.)\1+/g, '$1');
  for (const a of list) if (single(norm(a)) === single(x)) return { ok: false, grade: 'length', best: a };
  for (const a of list) { const n = norm(a); if (n.length >= 6 && lev(n, x) === 1 && harmlessTypo(n, x)) return { ok: true, grade: 'typo', best: a }; }
  return { ok: false, grade: 'wrong', best: list[0] };
}
/** Exact comparison for multiple choice and word tiles (no typo or dots tolerance, no ' / ' splitting: the options are given). */
export function same(a, b) { return norm(a) === norm(b); }
/** Grade one session answer for question q.
 *  MC and tiles: exact match only (tiles may list several accepted word orders in an array).
 *  Typed: check(); ä/ö mistakes are wrong when the profile, or the question (q.strictDots / q.strict), asks for it.
 *  Numeric questions ignore spaces/dashes between digits (040-123 4567). A synonym (not answer[0]) sets alt: true. */
export function gradeAnswer(q, input, { strictDots = false } = {}) {
  const canon = Array.isArray(q.answer) ? q.answer[0] : q.answer;
  if (q.kind === 'mc' || q.kind === 'tiles') {
    const ok = (Array.isArray(q.answer) ? q.answer : [q.answer]).some(a => same(input, a));
    return { ok, grade: ok ? 'exact' : 'wrong', best: canon };
  }
  let x = String(input ?? '');
  if (q.numeric) x = x.replace(/[−–]/g, '-').replace(/(\d)[\s.-]+(?=\d)/g, '$1').replace(/^([+-])\s+/, '$1');
  const res = check(x, q.answer, { strictDots: !!(strictDots || q.strictDots || q.strict) });
  if (res.ok && q.synonyms && res.best !== canon) res.alt = true;
  return res;
}

// ---------------------------------------------------------------- tokenizer for tap-to-translate
export const WORD_RE = /[A-Za-zÅÄÖåäöÉéÜü]+(?:[-'][A-Za-zÅÄÖåäö]+)*/g;
