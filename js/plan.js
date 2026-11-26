// Session planning: what to study next, in what mix. This is where the learning-science lives.
import * as store from './store.js';
import { VOCAB, VOCAB_BY_ID, TOPIC_BY_ID } from '../data/vocab.js';
import { LESSONS, LESSON_BY_ID } from '../data/course.js';
import { vocabQ, flashQ, skillQs, topicWords, SKILL_NAMES } from './exercises.js';
import { isLeech, retrievability } from './srs.js';
import { shuffle } from './ui.js';

const tagSkill = qs => qs.map(q => ({ ...q, skillName: SKILL_NAMES[q.skill] || '' }));
export const lessonWords = l => topicWords(l.topics);
export const itemWord = id => VOCAB_BY_ID[id] || (store.state().custom[id] && { id, ...store.state().custom[id], pos: 'custom', topics: [] });

/** First lesson that isn't complete: the "you are here" marker. */
export function currentLesson() {
  return LESSONS.find(l => (store.state().lessons[l.id]?.stars || 0) < 1) || LESSONS[LESSONS.length - 1];
}
/** Interleave: spread items of different kinds so the same skill never repeats back-to-back. */
function interleave(groups) {
  const out = [], gs = groups.filter(g => g.length).map(g => [...g]);
  while (gs.some(g => g.length)) {
    gs.sort((a, b) => b.length - a.length);
    for (const g of gs) {
      if (!g.length) continue;
      const last = out.at(-1)?.skill;
      // avoid the same skill twice in a row, but only if another group can go next (no infinite loop)
      if (last && g[0].skill === last && gs.some(o => o !== g && o.length && o[0].skill !== last)) continue;
      out.push(g.shift());
    }
  }
  return out;
}
/** New words not yet introduced, in course order (current lesson first). */
export function newWordsQueue(limit) {
  const S = store.state(), out = [];
  const cur = currentLesson(), order = [cur, ...LESSONS.filter(l => l !== cur)];
  for (const l of order) for (const w of lessonWords(l)) {
    if (!S.cards[w.id] && !out.includes(w)) out.push(w);
    if (out.length >= limit) return out;
  }
  return out;
}
/** The one-tap optimal session: due reviews + weakest due grammar + a few new words. */
export function dailyMix() {
  const S = store.state(), now = Date.now();
  const due = store.dueIds(now).map(itemWord).filter(Boolean);
  const reviews = due.slice(0, 18).map(w => vocabQ(w));
  // grammar skills: due ones first, then the current lesson's skills
  const cur = currentLesson();
  const touched = Object.entries(S.skills).filter(([, c]) => c.due <= now).sort((a, b) => a[1].due - b[1].due).map(([k]) => k);
  const skills = [...new Set([...touched, ...cur.skills.filter(s => s !== 'vocab')])].filter(s => SKILL_NAMES[s]).slice(0, due.length > 12 ? 1 : 2);
  const grammar = skills.map(s => tagSkill(skillQs(s, 4)));
  const nNew = Math.max(0, Math.min(6, 20 - reviews.length - grammar.flat().length));
  const fresh = newWordsQueue(nNew).map(w => vocabQ(w));
  const qs = [...fresh.slice(0, 2), ...interleave([reviews, ...grammar, fresh.slice(2)])];
  return { questions: qs, summary: { reviews: reviews.length, fresh: fresh.length, skills } };
}
export function mixSummary() {
  const due = store.dueIds().length, nNew = due >= 18 ? 0 : Math.min(6, Math.max(0, 12 - due));
  return { due, fresh: nNew };
}

// ------------------------------------------------------------ lesson sessions
export function lessonLearn(l) {
  const S = store.state();
  const words = lessonWords(l);
  const unseen = words.filter(w => !S.cards[w.id]).slice(0, 7);
  const known = shuffle(words.filter(w => S.cards[w.id])).slice(0, Math.max(0, 6 - unseen.length));
  const sk = l.skills.filter(s => s !== 'vocab' && SKILL_NAMES[s]);
  const grammar = sk.map(s => tagSkill(skillQs(s, sk.length > 3 ? 3 : 4)));
  return [...unseen.map(w => vocabQ(w)), ...interleave([known.map(w => vocabQ(w)), ...grammar])];
}
export function lessonPractice(l, n = 16) {
  const S = store.state();
  const words = lessonWords(l).sort((a, b) => retrievability(S.cards[a.id]) - retrievability(S.cards[b.id]));
  const sk = l.skills.filter(s => s !== 'vocab' && SKILL_NAMES[s]);
  const nWords = sk.length ? Math.min(words.length, Math.ceil(n * (l.revision ? .35 : .5))) : n;
  const vq = words.slice(0, nWords).map(w => S.cards[w.id] ? vocabQ(w) : vocabQ(w, { force: 'intro' }));
  const per = sk.length ? Math.ceil((n - vq.length) / sk.length) : 0;
  return interleave([vq, ...sk.map(s => tagSkill(skillQs(s, per)))]);
}
export function lessonTest(l, n = 20) {
  const words = shuffle(lessonWords(l)).slice(0, l.skills.length > 1 ? 8 : n);
  const sk = l.skills.filter(s => s !== 'vocab' && SKILL_NAMES[s]);
  const vq = words.map(w => vocabQ(w, { force: w.pos === 'p' || w.fi.includes(' ') ? 'mcEnFi' : 'typeEnFi' }));
  const per = sk.length ? Math.ceil((n - vq.length) / sk.length) : 0;
  return shuffle([...vq, ...sk.flatMap(s => tagSkill(skillQs(s, per)))]).slice(0, n);
}
export const skillDrill = (s, n = 12) => tagSkill(skillQs(s, n));

// ------------------------------------------------------------ vocab trainer sources
export function sourceWords(src) {
  const S = store.state();
  if (src === 'due') return store.dueIds().map(itemWord).filter(Boolean);
  if (src === 'weak') return Object.entries(S.cards).filter(([, c]) => isLeech(c) || (c.lapses >= 2 && retrievability(c) < .85)).map(([id]) => itemWord(id)).filter(Boolean);
  if (src === 'learned') return Object.keys(S.cards).map(itemWord).filter(Boolean);
  if (src === 'all') return VOCAB;
  if (src.startsWith('list:')) return (S.lists.find(l => l.id === src.slice(5))?.items || []).map(itemWord).filter(Boolean);
  if (src.startsWith('topic:')) return (TOPIC_BY_ID[src.slice(6)]?.words || []).map(id => VOCAB_BY_ID[id]);
  if (src.startsWith('lesson:')) return lessonWords(LESSON_BY_ID[src.slice(7)]);
  return [];
}
export function trainerQuestions(words, mode, n = 20) {
  const pool = shuffle(words).slice(0, n);
  const one = w => w.pos === 'custom' ? customQ(w, mode) : null;
  switch (mode) {
    case 'flashFi': return pool.map(w => flashQ(w, 'fi'));
    case 'flashEn': return pool.map(w => flashQ(w, 'en'));
    case 'write': return pool.map(w => one(w) || vocabQ(w, { force: w.fi.split(' ').length >= 3 ? 'tiles' : 'typeEnFi' }));
    case 'listen': return pool.map(w => one(w) || vocabQ(w, { force: 'listenType' }));
    case 'mc': return pool.map(w => one(w) || vocabQ(w, { force: Math.random() < .5 ? 'mcFiEn' : 'mcEnFi' }));
    case 'speed': return shuffle(words).slice(0, 80).map(w => one(w) || vocabQ(w, { force: Math.random() < .5 ? 'mcFiEn' : 'mcEnFi' }));
    default: return pool.map(w => one(w) || vocabQ(w));
  }
}
function customQ(w, mode) {
  if (mode === 'flashFi' || mode === 'flashEn') return flashQ(w, mode === 'flashEn' ? 'en' : 'fi');
  if (mode === 'listen') return { kind: 'type', listen: true, item: w.id, say: w.fi, prompt: '<div class="big"><svg class="ic xl" viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4zM16.5 9a4 4 0 0 1 0 6M19 6.5a7.5 7.5 0 0 1 0 11"/></svg></div>', sub: 'Type what you hear', answer: w.fi, reveal: w.en };
  return { kind: 'type', item: w.id, say: w.fi, prompt: `<div class="big">${w.en.replace(/</g, '&lt;')}</div>`, sub: 'In Finnish', answer: w.fi };
}
