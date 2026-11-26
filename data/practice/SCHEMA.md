# In-app practice sets (rebuilt from the course's external resources)

Each file `data/practice/<part>.js` has a default export mapping lesson id → array of sets:

```js
export default {
  'm1-1': [
    { src: '<exact resource URL from data/resources.js>', title: 'Short title', kind: 'pairs', note: 'one-line what you practise',
      items: [['fi', 'en'], ...] },                                   // matching / flashcard pairs (fi first)
    { src, title, kind: 'mc', items: [{ q: 'question (fi or en)', o: ['opt', 'opt', 'opt'], a: 0, say: 'optional Finnish to speak' }] },
    { src, title, kind: 'gap', items: [{ s: 'Minä ___ kotona.', a: ['olen'], en: 'I am at home.' }] },        // type the missing word(s); a = all accepted answers
    { src, title, kind: 'order', items: [{ fi: 'Minä olen kotona.', en: 'I am at home.' }] },              // build the sentence from word tiles
    { src, title, kind: 'tf', items: [{ s: 'Kissa on eläin.', a: true, en: 'A cat is an animal.' }] },      // totta / tarua
    { src, title, kind: 'listen', items: [{ fi: 'kahdeksan', en: 'eight' }] },                             // hear Finnish, type it
    { src, title, kind: 'read', text: [['fi sentence', 'en'], ...], q: [{ q: 'fi question', en: 'en', o: ['..', '..'], a: 0 }] },
  ],
};
```

Rules
- `src` must be one of that lesson's URLs in `data/resources.js` (several sets may share a src).
- 6–20 items per set (read: 5–12 sentences, 2–5 questions). Finnish must be 100% correct standard Finnish (spoken forms only when the source teaches puhekieli; mark it in `note`).
- Content is ORIGINAL wording that teaches the same words/grammar as the source. Never paste third-party texts verbatim (public repo). Word lists/facts are fine.
- If the source could not be read, set `inferred: true` and build the set from the source's title/topic + the lesson.
- English glosses short; for pairs keep each side under ~40 chars.
