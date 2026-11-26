// SuomiT — Finnish language engine: vowel harmony, conjugation, cases, numbers, clock, answer checking.

const BACK = 'aou', FRONT = 'äöy';

/** 'b' (back: a/o/u) or 'f' (front: ä/ö/y). Decided by the LAST harmonic vowel, which handles compounds
 *  like kesäkuu → kesäkuussa. Words with only neutral vowels (e, i) are front. */
export function harmony(word, override) {
  if (override) return override;
  const w = word.toLowerCase();
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
/** Colloquial (spoken) numbers, 0–99. Returns all accepted variants; first = most common. */
export function numSpoken(n) {
  if (n <= 10) return [ONES_SPOKEN[n]];
  if (n < 20) { const o = ONES_SPOKEN[n - 10]; return [o + 'toist', o + 'toista']; }
  if (n < 100) {
    const t = Math.floor(n / 10), o = n % 10;
    const tens = t === 1 ? 'kymmenen' : TENS_SPOKEN[t];
    const alt = { 8: 'kasikyt', 9: 'ysikyt' }[t];
    const res = [tens + (o ? ONES_SPOKEN[o] : '')];
    if (alt) res.push(alt + (o ? ONES_SPOKEN[o] : ''));
    return res;
  }
  return [numWord(n)];
}
/** Partitive of the number word for counting prices etc. is not needed; euros: "kaksi euroa viisikymmentä senttiä". */
export function priceWords(euros, cents) {
  const e = euros === 1 ? 'yksi euro' : `${numWord(euros)} euroa`;
  if (!cents) return [e];
  const c = cents === 1 ? 'yksi sentti' : `${numWord(cents)} senttiä`;
  const spoken = `${numSpoken(euros)[0]} ${numSpoken(cents)[0]}`; // e.g. "kaks kolkyt"
  return [`${e} ${c}`, `${numWord(euros)} ${numWord(cents)}`, spoken];
}

// ---------------------------------------------------------------- clock
const HOUR_ABL = ['', 'yhdeltä', 'kahdelta', 'kolmelta', 'neljältä', 'viideltä', 'kuudelta', 'seitsemältä', 'kahdeksalta', 'yhdeksältä', 'kymmeneltä', 'yhdeltätoista', 'kahdeltatoista'];
/** Returns accepted ways to say h:m (12-hour clock words). First = canonical. */
export function clockWords(h, m) {
  const h12 = ((h + 11) % 12) + 1, next = (h12 % 12) + 1;
  const H = numWord(h12), N = numWord(next);
  if (m === 0) return [`${H}`, `tasan ${H}`];
  if (m === 30) return [`puoli ${N}`];
  if (m === 15) return [`varttia yli ${H}`, `vartin yli ${H}`, `viisitoista yli ${H}`];
  if (m === 45) return [`varttia vaille ${N}`, `vartin vaille ${N}`, `viisitoista vaille ${N}`];
  if (m < 30) return [`${numWord(m)} yli ${H}`, `${numWord(m)} minuuttia yli ${H}`];
  const r = 60 - m, part = { 5: 'viittä', 10: 'kymmentä', 20: 'kahtakymmentä', 25: 'kahtakymmentäviittä' }[r];
  const out = [`${numWord(r)} vaille ${N}`];
  if (part) out.push(`${part} vaille ${N}`);
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
/** Compare a typed answer against one or more accepted answers.
 *  → {ok, grade: 'exact'|'dots'|'typo'|'wrong', best} */
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
  for (const a of list) { const n = norm(a); if (n.length >= 6 && lev(n, x) === 1) return { ok: true, grade: 'typo', best: a }; }
  return { ok: false, grade: 'wrong', best: list[0] };
}

// ---------------------------------------------------------------- tokenizer for tap-to-translate
export const WORD_RE = /[A-Za-zÅÄÖåäöÉéÜü]+(?:[-'][A-Za-zÅÄÖåäö]+)*/g;
