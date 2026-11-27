// Interface language. The Finnish never changes; everything that is explained or translated (menus, buttons,
// word meanings, sentence translations, drill prompts, grammar notes, lesson explanations) is shown in the
// learner's language. English is built into the code; Dutch and Spanish come from packs in i18n/<lang>/.
//
// How to use it (see i18n/README.md):
//   t('Daily goal')                                   → "Dagdoel"
//   t('You have practised {n} of {total} words', { n, total })
//   t(w.en)                                           → a word meaning / sentence translation from the data files
//   lessonText(lesson)                                → the lesson's title, goals and explanation cards, rewritten
//                                                       for speakers of that language (not a literal translation)
// Translate when the string is BUILT (question generators run after the pack has loaded), so grading compares
// translated choices with the translated answer.

export const LANGS = { en: 'English', nl: 'Nederlands', es: 'Español' };
let cur = 'en', dict = null, course = null;
const miss = new Set();

export const lang = () => cur;
/** Load a language pack (await before rendering). Unknown → English. */
export async function setLang(l) {
  if (!LANGS[l] || l === 'en') { cur = 'en'; dict = null; course = null; return cur; }
  const m = await import(`../i18n/${l}/index.js`);
  dict = m.DICT; course = m.COURSE || {}; cur = l;
  if (typeof document !== 'undefined') document.documentElement.lang = l;
  return cur;
}
/** Use an already-loaded pack synchronously (tests). */
export function usePack(l, pack) { cur = l; dict = pack?.DICT || null; course = pack?.COURSE || {}; }

const fill = (s, vars) => s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : m));
/** Translate an English string. Missing entries fall back to English and are recorded (see missing()). */
export function t(en, vars) {
  let s = en;
  if (dict && typeof en === 'string' && en) {
    const x = dict[en];
    if (x != null) s = x; else if (/[A-Za-z]/.test(en)) miss.add(en); // numbers and lone ä/ö are never English
  }
  return vars ? fill(String(s), vars) : s;
}
/** t() for a value that may be missing or not a string (data fields). */
export const tx = v => (typeof v === 'string' && v ? t(v) : v);

/** A lesson's learner-facing text: { title, goals, learn: [{ h, body }] } in the current language. */
export function lessonText(l) {
  const o = cur !== 'en' && course?.[l.id];
  if (!o) { if (cur !== 'en') miss.add('lesson:' + l.id); return { title: l.title, goals: l.goals, learn: l.learn }; }
  return { title: o.title || l.title, goals: o.goals || l.goals, learn: o.learn || l.learn };
}

/** English strings asked for that the current pack does not have (dev / tests). */
export const missing = () => [...miss];
export const clearMissing = () => miss.clear();
if (typeof window !== 'undefined') window.__i18n = { missing, lang };

// Small drawn flags for the language button (no emoji: the app uses its own drawings).
let flagN = 0;
export function flagSVG(l) {
  const id = 'fl' + (++flagN), a = 'width="100%" height="100%" preserveAspectRatio="xMidYMid slice" aria-hidden="true"';
  if (l === 'nl') return `<svg viewBox="0 0 9 6" ${a}><path fill="#AE1C28" d="M0 0h9v2H0z"/><path fill="#fff" d="M0 2h9v2H0z"/><path fill="#21468B" d="M0 4h9v2H0z"/></svg>`;
  if (l === 'es') return `<svg viewBox="0 0 750 500" ${a}><path fill="#AA151B" d="M0 0h750v500H0z"/><path fill="#F1BF00" d="M0 125h750v250H0z"/></svg>`;
  return `<svg viewBox="0 0 60 30" ${a}><clipPath id="${id}a"><path d="M0 0v30h60V0z"/></clipPath><clipPath id="${id}b"><path d="M30 15h30v15zv15H0zH0V0zV0h30z"/></clipPath><g clip-path="url(#${id}a)"><path d="M0 0v30h60V0z" fill="#012169"/><path d="M0 0l60 30m0-30L0 30" stroke="#fff" stroke-width="6"/><path d="M0 0l60 30m0-30L0 30" clip-path="url(#${id}b)" stroke="#C8102E" stroke-width="4"/><path d="M30 0v30M0 15h60" stroke="#fff" stroke-width="10"/><path d="M30 0v30M0 15h60" stroke="#C8102E" stroke-width="6"/></g></svg>`;
}
