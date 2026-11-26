// In-app versions of the course's external resources (data/practice/*). Turns a set into a session or a reading page.
import * as store from './store.js';
import { PRACTICE } from '../data/practice/index.js';
import { VOCAB_BY_ID } from '../data/vocab.js';
import { LESSON_BY_ID } from '../data/course.js';
import { runSession } from './session.js';
import { esc, fw, shuffle, toast, confetti } from './ui.js';
import { icon } from './icons.js';
import { speak, stopSpeaking, sfx } from './audio.js';
import { startMatch } from './views/words.js';

export const KIND_LABEL = { pairs: 'Words & matching', mc: 'Multiple choice', gap: 'Fill the gap', order: 'Build sentences', tf: 'True or false', listen: 'Listening', read: 'Reading' };
export const KIND_ICON = { pairs: 'grid', mc: 'choice', gap: 'pen', order: 'bricks', tf: 'check', listen: 'headphones', read: 'read' };
export const setsFor = (lesson, src) => (PRACTICE[lesson] || []).filter(s => !src || s.src === src);
export const setIndex = (lesson, set) => (PRACTICE[lesson] || []).indexOf(set);

const P = (fi, en) => `<div class="big fi">${fw(fi)}</div>${en ? `<div class="en-hint">${esc(en)}</div>` : ''}`;
const vocabId = fi => { const id = 'w:' + String(fi).toLowerCase(); return VOCAB_BY_ID[id] ? id : undefined; };
const clean = s => String(s).replace(/[.!?]+$/, '');

/** Compile a practice set into session questions. */
export function setQuestions(set) {
  const it = set.items || [];
  switch (set.kind) {
    case 'pairs': {
      const ens = it.map(p => p[1]), fis = it.map(p => p[0]);
      return shuffle(it).flatMap(([fi, en], i) => {
        const others = (arr, x) => shuffle(arr.filter(y => y !== x)).slice(0, 3);
        const base = { item: vocabId(fi), say: fi };
        return i % 3 === 2
          ? [{ ...base, kind: 'type', prompt: `<div class="big">${esc(en)}</div>`, sub: 'In Finnish', answer: clean(fi) }]
          : i % 3 === 1
            ? [{ ...base, kind: 'mc', prompt: `<div class="big">${esc(en)}</div>`, sub: 'Choose the Finnish', answer: fi, choices: shuffle([fi, ...others(fis, fi)]), fiChoices: true }]
            : [{ ...base, kind: 'mc', prompt: P(fi), sub: 'What does it mean?', answer: en, choices: shuffle([en, ...others(ens, en)]), autoSay: true }];
      });
    }
    case 'mc': return it.map(q => ({ kind: 'mc', prompt: P(q.q), answer: q.o[q.a], choices: shuffle([...q.o]), fiChoices: true, say: q.say, sub: q.en || '' }));
    case 'gap': return it.map(q => {
      const acc = Array.isArray(q.a) ? q.a : [q.a];
      return { kind: 'type', strict: true, prompt: P(q.s), sub: q.en || 'Fill in the gap', answer: acc, say: q.s.replace(/_{2,}/, acc[0]) };
    });
    case 'order': return it.map(q => {
      const toks = clean(q.fi).replace(/[,]/g, '').split(/\s+/);
      return { kind: 'tiles', prompt: `<div class="big">${esc(q.en)}</div>`, sub: 'Build it in Finnish', answer: toks.join(' '), tiles: shuffle(toks), say: q.fi };
    });
    case 'tf': return it.map(q => ({ kind: 'mc', prompt: P(q.s), sub: 'Totta vai tarua? (true or false)', answer: q.a ? 'Totta' : 'Tarua', choices: ['Totta', 'Tarua'], say: q.s, reveal: q.en }));
    case 'listen': return it.map(q => ({ kind: 'type', listen: true, prompt: `<div class="big">${icon('speaker', 'xl')}</div>`, sub: 'Listen and write what you hear', answer: clean(q.fi), say: q.fi, reveal: q.en, item: vocabId(q.fi) }));
    default: return [];
  }
}

function markDone(lesson, set, r) {
  if (!r || r.quit) return;
  const S = store.state();
  if (r.acc >= .6 && !S.res[set.src]) { S.res[set.src] = Date.now(); store.addXp(5); }
  store.save();
}

/** Start a set. `back` is called when the session closes. */
export function playSet(lesson, set, back) {
  if (set.kind === 'read') { location.hash = `#/set/${lesson}/${setIndex(lesson, set)}`; return; }
  const qs = setQuestions(set);
  if (!qs.length) return toast('This set is empty', 'alert');
  runSession({ title: set.title, mode: 'drill', questions: qs, onFinish: r => markDone(lesson, set, r), onClose: back, again: () => playSet(lesson, set, back),
    endExtra: () => set.kind === 'pairs' && set.items.length >= 4 ? `<p class="center"><button class="btn sm ghost" id="pm">${icon('puzzle')} Play match pairs with these words</button></p>` : '' });
  if (set.kind === 'pairs') {
    const t = setInterval(() => { const b = document.getElementById('pm'); if (b) { clearInterval(t); b.onclick = () => { document.querySelector('#session .end .go')?.click(); setTimeout(() => startMatch(set.items.map(([fi, en]) => ({ id: 'p:' + fi, fi, en }))), 50); }; } if (document.getElementById('session').hidden) clearInterval(t); }, 300);
  }
}

/** Card list of sets for a lesson (used in the lesson's Practice + Resources tabs). */
export function setCards(lesson, sets) {
  const S = store.state();
  return sets.map(s => `<button class="pset ${S.res[s.src] ? 'done' : ''}" data-set="${setIndex(lesson, s)}">
    <span class="ps-ico">${icon(KIND_ICON[s.kind] || 'puzzle')}</span>
    <span class="ps-t"><b>${esc(s.title)}</b><small>${esc(KIND_LABEL[s.kind] || s.kind)} · ${s.kind === 'read' ? (s.text?.length || 0) + ' sentences' : (s.items?.length || 0) + ' items'}${s.note ? ' · ' + esc(s.note) : ''}</small></span>
    <span class="ps-go">${icon('play')}</span></button>`).join('');
}
export function wireSetCards(root, lesson, back) {
  root.querySelectorAll('[data-set]').forEach(b => b.onclick = () => playSet(lesson, PRACTICE[lesson][+b.dataset.set], back));
}

/** Reading set page: #/set/<lesson>/<index> */
export function renderSet(el, lesson, idx) {
  const set = PRACTICE[lesson]?.[+idx];
  if (!set) { location.hash = '#/lesson/' + lesson + '/res'; return; }
  const l = LESSON_BY_ID[lesson];
  el.innerHTML = `<a class="back" href="#/lesson/${lesson}/res">‹ ${esc(l?.title || 'Lesson')}</a>
    <h1 class="pg fi">${esc(set.title)}</h1>${set.note ? `<p class="muted">${esc(set.note)}</p>` : ''}
    <div class="row-btns"><button class="btn sm" id="play">${icon('play')} Read aloud</button><button class="btn sm ghost" id="tr">Show translation</button></div>
    <article class="card text">${set.text.map(([fi, en], i) => `<p class="sent" data-i="${i}"><span class="fi">${fw(fi)}</span> <button class="s-say" data-i="${i}" aria-label="Listen">${icon('speaker')}</button><span class="tr" hidden>${esc(en)}</span></p>`).join('')}</article>
    ${set.q?.length ? `<h3 class="sec">Kysymykset · Questions</h3><div class="qs">${set.q.map((q, k) => `<div class="card rq" data-k="${k}"><b class="fi">${fw(q.q)}</b><div class="muted small">${esc(q.en || '')}</div>
      <div class="choices col no-tap">${q.o.map((o, j) => `<button class="choice" data-j="${j}">${fw(o)}</button>`).join('')}</div></div>`).join('')}</div>` : ''}
    <div class="row-btns"><button class="btn big-btn wide" id="done">${set.q?.length ? 'Answer the questions' : 'Done reading'}</button></div>`;
  let playing = false;
  const sents = [...el.querySelectorAll('.sent')];
  const playFrom = i => {
    sents.forEach(s => s.classList.remove('hl'));
    if (!playing || i >= sents.length) { playing = false; el.querySelector('#play').innerHTML = icon('play') + ' Read aloud'; return; }
    sents[i].classList.add('hl'); sents[i].scrollIntoView({ block: 'center', behavior: 'smooth' });
    speak(set.text[i][0], { onend: () => playFrom(i + 1) });
  };
  el.querySelector('#play').onclick = e => { playing = !playing; e.currentTarget.innerHTML = playing ? icon('pause') + ' Stop' : icon('play') + ' Read aloud'; if (playing) playFrom(0); else { stopSpeaking(); sents.forEach(s => s.classList.remove('hl')); } };
  el.querySelector('#tr').onclick = e => { const show = e.currentTarget.textContent.startsWith('Show'); el.querySelectorAll('.tr').forEach(t => t.hidden = !show); e.currentTarget.textContent = show ? 'Hide translation' : 'Show translation'; };
  el.querySelectorAll('.s-say').forEach(b => b.onclick = () => speak(set.text[+b.dataset.i][0]));
  const answers = {}, btn = el.querySelector('#done'), nq = set.q?.length || 0;
  if (nq) btn.disabled = true;
  el.querySelectorAll('.rq').forEach(card => card.querySelectorAll('.choice').forEach(b => b.onclick = () => {
    if (card.classList.contains('answered')) return;
    const k = +card.dataset.k, j = +b.dataset.j, ok = set.q[k].a === j;
    answers[k] = ok; card.classList.add('answered'); card.querySelector('.choices').classList.remove('no-tap');
    card.querySelectorAll('.choice').forEach((c, jj) => { c.disabled = true; if (jj === set.q[k].a) c.classList.add('right'); else if (c === b) c.classList.add('wrong'); });
    sfx(ok ? 'ok' : 'bad');
    if (Object.keys(answers).length === nq) { btn.disabled = false; btn.textContent = 'Finish'; }
  }));
  btn.onclick = () => {
    stopSpeaking();
    const score = Object.values(answers).filter(Boolean).length, S = store.state(), first = !S.res[set.src];
    const xp = (first ? 15 : 3) + score * 5;
    S.res[set.src] = S.res[set.src] || Date.now(); store.addXp(xp); const d = store.dayRec(); d.read = (d.read || 0) + 1; store.save();
    if (nq && score === nq) confetti(80);
    toast(nq ? `${score}/${nq} correct · +${xp} XP` : `+${xp} XP`, 'read', 2400);
    location.hash = '#/lesson/' + lesson + '/res';
  };
}
/** All Finnish↔English pairs from practice sets (for tap-to-translate). */
export function practicePairs() {
  const out = [];
  for (const sets of Object.values(PRACTICE)) for (const s of sets) {
    if (s.kind === 'pairs') for (const [fi, en] of s.items) out.push([fi, en]);
    if (s.kind === 'listen') for (const q of s.items) if (q.en) out.push([q.fi, q.en]);
  }
  return out;
}
