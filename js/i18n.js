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
    if (x != null) s = x; else miss.add(en);
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
