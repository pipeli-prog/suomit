# SuomiT in your own language (English · Nederlands · Español)

SuomiT teaches **Finnish**. The Finnish never changes. Everything around it can be shown in the learner's language:
menus, buttons, word meanings, sentence translations, drill prompts, grammar notes and the lesson explanations.
English is built into the code. Dutch (`nl`) and Spanish (`es`) are **packs** in `i18n/<lang>/`. Pick the language in
Settings → Your language. A new install starts in the phone's language.

## For code: `t()`

```js
import { t, tx, lang, lessonText } from './i18n.js';   // '../i18n.js' from js/views/

t('Daily goal')                                          // fixed UI text: the English string IS the key
t('You have practised {n} of {total} words here', { n, total })   // values go in {placeholders}, never ${}
t(n === 1 ? '{n} day' : '{n} days', { n })               // plurals: one key per form
t(w.en)                                                   // data strings (word meanings, sentence translations)
tx(q.en)                                                  // same, but passes through undefined / non-strings
lessonText(lesson)                                        // { title, goals, learn } rewritten for that language
```

Rules:
1. **Translate when the string is built, at render or question-build time, never at module load.** The pack is
   loaded in `boot()` *after* all modules have been imported, so a `const X = t('…')` at the top level of a module
   stays English. Put such lists inside functions, or keep the English in the constant and call `t()` where it is shown.
2. **Keys are literal English strings.** The catalog tool finds `t('…')` calls by regex, so the first argument must be a
   plain string literal (or a data field). Never build the key: no `t('in ' + month)`, no `` t(`${a} of ${b}`) ``.
   Use one key with placeholders for the whole sentence, so a translator can reorder words.
3. **Whole sentences, not fragments.** `t('Tap to flip')`, not `t('Tap') + ' ' + t('to flip')`. Word order differs in Dutch and Spanish.
4. **Grading compares translated choices with the translated answer.** When a question has meaning choices, translate
   the choices *and* the answer with the same `t()`, and make sure no two choices end up identical after translation
   (two English meanings can share one Dutch word).
5. Finnish text is never passed through `t()`. Finnish names of things (Koti, Polku, Sanat, Lue, Minä, Kauppa,
   Kielisolmut, Oikein!, Hienoa!, …) stay Finnish in every language; that is part of the immersion.
6. HTML stays outside the key where possible: `` `<b>${t('Daily goal')}</b>` ``. Small inline tags inside a sentence are
   allowed in a key when the sentence cannot be split (`t('Tap <b>Check</b> when you are done')`).
7. English output must stay byte-for-byte what it was (the tests and English users see no change).

`missing()` lists every English string that was asked for but is not in the current pack. The tests and
`node tools/i18n-catalog.mjs <lang>` use it to prove that nothing is left untranslated.

## For translators: the packs

```
i18n/<lang>/ui.js              code strings (t('…') literals + drill/generator templates)
i18n/<lang>/words.js           word and verb meanings (data/vocab.js, data/verbs.js, data/grammar.js)
i18n/<lang>/practice-<part>.js practice-set strings (data/practice/<part>.js)
i18n/<lang>/readings.js        reading texts and tongue twisters
i18n/<lang>/course.js          the lesson explanations, REWRITTEN for speakers of this language
```

`node tools/i18n-catalog.mjs nl` writes the to-do lists to `i18n/_todo/nl/<group>.json` as
`{ "English": "context" }`. Each pack file is `export default { "English": "Nederlands", … }`.

- **Not a literal translation.** Write what a good Dutch / Spanish teacher would write. Short, natural, the learner's
  everyday register: Dutch *je/jij* (Netherlands Dutch), Spanish *tú* (Spain Spanish: *vosotros* for Finnish *te*
  when it means "you all", *usted* only where the English says formal/polite).
- Keep the grammar hints the English gives: "you (pl.)", "he/she", "(formal)", "(spoken)". They tell the learner which
  Finnish form is wanted. Dutch *jullie* is already plural; Spanish *vosotros* too, so "(pl.)" can go there.
- Workflow: the to-do lists are cut into chunks `i18n/_todo/<lang>/in/<group>.<k>.json`. For each chunk write
  `i18n/_todo/<lang>/out/<group>.<k>.json` with exactly the same keys and your translations as values (valid JSON).
  `node tools/i18n-assemble.mjs <lang>` builds the pack files; `node tools/i18n-check.mjs <lang> <group>` checks one.
- **Keep every `{placeholder}`** exactly, and keep the Finnish inside a string exactly as it is
  (`'Say "kiitos"'` → `'Zeg "kiitos"'`). If the string is Finnish (some practice options are), the translation is the
  same string.
- **Word meanings** are glosses shown next to a Finnish word and used as multiple-choice options: short, lower case
  like the English, the same separators (`, ` between senses, `;` between meanings). Give the meaning a learner
  needs for *this* Finnish word (the context line says which word it is).
- **Lessons (`course.js`)** are rewritten, not translated: explain Finnish from the learner's language.
  - Pronunciation: compare to Dutch / Spanish sounds, not English (*y* is like Dutch *uu*; Spanish has no *ö*).
  - Grammar: lean on what Dutch / Spanish speakers already know, and warn about their typical mistakes.
  - Format: same mini-markdown as `data/course.js` (`*fi*` italics for Finnish, `**bold**`, `> tip`, `|table|rows|`,
    blank-line paragraphs). The Finnish examples stay; the explanations around them are new.
  - Shape: `'m1-1': { title, goals: [...], learn: [{ h, body }, ...] }` for every lesson id in `data/course.js`.
