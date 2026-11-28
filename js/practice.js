// In-app versions of the course's external resources (data/practice/*). Turns a set into a session or a reading page.
import * as store from './store.js';
import { PRACTICE } from '../data/practice/index.js';
import { VOCAB_BY_ID } from '../data/vocab.js';
import { LESSON_BY_ID } from '../data/course.js';
import { runSession } from './session.js';
import { esc, fw, fwIf, shuffle, toast, confetti } from './ui.js';
import { icon } from './icons.js';
import { speak, stopSpeaking, sfx } from './audio.js';
import { startMatch } from './views/words.js';
import { t, tx, lessonText } from './i18n.js';
import { isFinnish } from './lexicon.js';
import { PRACTICE_TR as PTR } from '../data/practice/tr.js';

/** A set kind's name in the learner's language. */
export const kindLabel = k => ({ pairs: t('Words & matching'), mc: t('Multiple choice'), gap: t('Fill the gap'), order: t('Build sentences'), tf: t('True or false'), listen: t('Listening'), read: t('Reading') })[k] || k;
export const KIND_ICON = { pairs: 'grid', mc: 'choice', gap: 'pen', order: 'bricks', tf: 'check', listen: 'headphones', read: 'read' };
export const setsFor = (lesson, src) => (PRACTICE[lesson] || []).filter(s => !src || s.src === src);
export const setIndex = (lesson, set) => (PRACTICE[lesson] || []).indexOf(set);

const P = (fi, en) => `<div class="big fi">${fw(fi)}</div>${en ? `<div class="en-hint">${esc(en)}</div>` : ''}`;
/** A question that may be in the learner's language ("Which word means cat?") or Finnish. */
const PQ = q => `<div class="big">${fwIf(q)}</div>`;
const fiLike = s => /[äöÄÖ]/.test(s); // reading-set options with ä/ö are Finnish: shown as they are
const vocabId = fi => { const id = 'w:' + String(fi).toLowerCase(); return VOCAB_BY_ID[id] ? id : undefined; };
const clean = s => String(s).replace(/[.!?]+$/, '');
/** Translate options (English ones; Finnish ones map to themselves), dropping any that become identical. */
const trOpts = o => [...new Set(o.map(x => t(x)))];

/** Compile a practice set into session questions. */
export function setQuestions(set) {
  const it = set.items || [];
  switch (set.kind) {
    case 'pairs': {
      // meanings are translated once, so the prompt, the choices and the answer are the same strings
      const tr = it.map(([fi, en]) => [fi, t(en)]), ens = tr.map(p => p[1]), fis = it.map(p => p[0]);
      return shuffle(tr).flatMap(([fi, en], i) => {
        const others = (arr, x) => shuffle([...new Set(arr)].filter(y => y !== x)).slice(0, 3);
        const base = { item: vocabId(fi), say: fi, full: fi, tr: en };
        return i % 3 === 2
          ? [{ ...base, kind: 'type', prompt: `<div class="big">${esc(en)}</div>`, sub: t('In Finnish'), answer: clean(fi) }]
          : i % 3 === 1
            ? [{ ...base, kind: 'mc', prompt: `<div class="big">${esc(en)}</div>`, sub: t('Choose the Finnish'), answer: fi, choices: shuffle([fi, ...others(fis, fi)]), fiChoices: true }]
            : [{ ...base, kind: 'mc', prompt: P(fi), sub: t('What does it mean?'), answer: en, choices: shuffle([en, ...others(ens, en)]), autoSay: true }];
      });
    }
    case 'mc': return it.map(q => {
      const ans = t(q.o[q.a]), fiQ = isFinnish(q.q), fiA = isFinnish(ans);
      // the whole Finnish of the item: a gap filled in; a Finnish question with its Finnish answer ("Mitä kuuluu?
      // Hyvää, kiitos."); else the Finnish side. Drill-like prompts (minä + ottaa, silta → si__alla) give the answer.
      const drill = /[+→…]|_{2}/.test(q.q) && !/_{3,}/.test(q.q);
      const full = q.say || (fiQ && /_{3,}/.test(q.q) ? q.q.replace(/_{3,}/, ans) : fiQ && fiA && !drill ? `${q.q.replace(/\s*[—-]+\s*$/, '')} ${ans}` : fiA ? ans : fiQ && !drill ? q.q : '');
      return { kind: 'mc', prompt: PQ(t(q.q)), answer: ans, choices: shuffle(trOpts(q.o)), fiChoices: fiA, say: q.say, sub: tx(q.en) || '', full, tr: tx(q.en) || tx(PTR[full]) || (fiA ? '' : ans) };
    });
    case 'gap': return it.map(q => {
      const acc = Array.isArray(q.a) ? q.a : [q.a];
      const whole = /(^|\s)_{2,}/.test(q.s) || /\s/.test(q.s) ? q.s.replace(/_{2,}/, acc[0]) : q.s.replace(/_{2,}/, acc[0]);
      return { kind: 'type', strict: true, prompt: P(q.s), sub: tx(q.en) || t('Fill in the gap'), answer: acc, say: whole, full: whole, tr: tx(q.en) || tx(PTR[whole]) };
    });
    case 'order': return it.map(q => {
      const toks = clean(q.fi).replace(/[,]/g, '').split(/\s+/);
      return { kind: 'tiles', prompt: `<div class="big">${esc(t(q.en))}</div>`, sub: t('Build it in Finnish'), answer: toks.join(' '), tiles: shuffle(toks), say: q.fi, full: q.fi, tr: t(q.en) };
    });
    case 'tf': return it.map(q => ({ kind: 'mc', prompt: P(q.s), sub: t('Totta vai tarua? (true or false)'), answer: q.a ? 'Totta' : 'Tarua', choices: ['Totta', 'Tarua'], say: q.s, full: q.s, tr: tx(q.en) }));
    case 'listen': return it.map(q => ({ kind: 'type', listen: true, prompt: `<div class="big">${icon('speaker', 'xl')}</div>`, sub: t('Listen and write what you hear'), answer: clean(q.fi), say: q.fi, full: q.fi, tr: tx(q.en), item: vocabId(q.fi) }));
    default: return [];
  }
}

function markDone(lesson, set, r) {
  if (!r || r.quit) return;
  const S = store.state();
  if (r.acc >= .6 && !S.res[set.src]) { S.res[set.src] = Date.now(); store.addXp(1.25); }
  store.save();
}

/** Start a set. `back` is called when the session closes. */
export function playSet(lesson, set, back) {
  if (set.kind === 'read') { location.hash = `#/set/${lesson}/${setIndex(lesson, set)}`; return; }
  const qs = setQuestions(set);
  if (!qs.length) return toast(t('This set is empty'), 'alert');
  runSession({ title: set.title, mode: 'drill', questions: qs, onFinish: r => markDone(lesson, set, r), onClose: back, again: () => playSet(lesson, set, back),
    endExtra: () => set.kind === 'pairs' && set.items.length >= 4 ? `<p class="center"><button class="btn sm ghost" id="pm">${icon('puzzle')} ${t('Play match pairs with these words')}</button></p>` : '' });
  if (set.kind === 'pairs') {
    const iv = setInterval(() => { const b = document.getElementById('pm'); if (b) { clearInterval(iv); b.onclick = () => { document.querySelector('#session .end .go')?.click(); setTimeout(() => startMatch(set.items.map(([fi, en]) => ({ id: 'p:' + fi, fi, en }))), 50); }; } if (document.getElementById('session').hidden) clearInterval(iv); }, 300);
  }
}

const count = s => { const n = s.kind === 'read' ? s.text?.length || 0 : s.items?.length || 0; return s.kind === 'read' ? (n === 1 ? t('{n} sentence', { n }) : t('{n} sentences', { n })) : n === 1 ? t('{n} item', { n }) : t('{n} items', { n }); };
/** Card list of sets for a lesson (used in the lesson's Practice + Resources tabs). */
export function setCards(lesson, sets) {
  const S = store.state();
  return sets.map(s => `<button class="pset ${S.res[s.src] ? 'done' : ''}" data-set="${setIndex(lesson, s)}">
    <span class="ps-ico">${icon(KIND_ICON[s.kind] || 'puzzle')}</span>
    <span class="ps-t"><b>${esc(t(s.title))}</b><small>${esc(kindLabel(s.kind))} · ${count(s)}${s.note ? ' · ' + esc(t(s.note)) : ''}</small></span>
    <span class="ps-go">${icon('play')}</span></button>`).join('');
}
export function wireSetCards(root, lesson, back) {
  root.querySelectorAll('[data-set]').forEach(b => b.onclick = () => playSet(lesson, PRACTICE[lesson][+b.dataset.set], back));
}

/** Reading set page: #/set/<lesson>/<index> */
export function renderSet(el, lesson, idx) {
  const set = PRACTICE[lesson]?.[+idx];
  if (!set || set.kind !== 'read') { location.hash = '#/lesson/' + lesson + '/res'; return; } // only reading sets have a page
  const l = LESSON_BY_ID[lesson];
  el.innerHTML = `<a class="back" href="#/lesson/${lesson}/res">‹ ${esc(l ? lessonText(l).title : t('Lesson'))}</a>
    <h1 class="pg fi">${esc(t(set.title))}</h1>${set.note ? `<p class="muted">${esc(t(set.note))}</p>` : ''}
    <div class="row-btns"><button class="btn sm" id="play">${icon('play')} ${t('Read aloud')}</button><button class="btn sm ghost" id="tr">${t('Show translation')}</button></div>
    <article class="card text">${set.text.map(([fi, en], i) => `<p class="sent" data-i="${i}"><span class="fi">${fw(fi)}</span> <button class="s-say" data-i="${i}" aria-label="${t('Listen')}">${icon('speaker')}</button><span class="tr" hidden>${esc(tx(en))}</span></p>`).join('')}</article>
    ${set.q?.length ? `<h3 class="sec">Kysymykset · ${t('Questions')}</h3><div class="qs">${set.q.map((q, k) => `<div class="card rq" data-k="${k}"><b class="fi">${fw(q.q)}</b><div class="muted small">${esc(tx(q.en) || '')}</div>
      <div class="choices col no-tap">${q.o.map((o, j) => `<button class="choice" data-j="${j}">${fw(fiLike(o) ? o : t(o))}</button>`).join('')}</div></div>`).join('')}</div>` : ''}
    <div class="row-btns"><button class="btn big-btn wide" id="done">${set.q?.length ? t('Answer the questions') : t('Done reading')}</button></div>`;
  let playing = false;
  const sents = [...el.querySelectorAll('.sent')];
  const playFrom = i => {
    sents.forEach(s => s.classList.remove('hl'));
    if (!playing || i >= sents.length) { playing = false; el.querySelector('#play').innerHTML = icon('play') + ' ' + t('Read aloud'); return; }
    sents[i].classList.add('hl'); sents[i].scrollIntoView({ block: 'center', behavior: 'smooth' });
    speak(set.text[i][0], { onend: () => playFrom(i + 1) });
  };
  el.querySelector('#play').onclick = e => { playing = !playing; e.currentTarget.innerHTML = playing ? icon('pause') + ' ' + t('Stop') : icon('play') + ' ' + t('Read aloud'); if (playing) playFrom(0); else { stopSpeaking(); sents.forEach(s => s.classList.remove('hl')); } };
  let shown = false;
  el.querySelector('#tr').onclick = e => { const show = shown = !shown; el.querySelectorAll('.tr').forEach(x => x.hidden = !show); e.currentTarget.textContent = show ? t('Hide translation') : t('Show translation'); };
  el.querySelectorAll('.s-say').forEach(b => b.onclick = () => speak(set.text[+b.dataset.i][0]));
  const answers = {}, btn = el.querySelector('#done'), nq = set.q?.length || 0;
  if (nq) btn.disabled = true;
  el.querySelectorAll('.rq').forEach(card => card.querySelectorAll('.choice').forEach(b => b.onclick = () => {
    if (card.classList.contains('answered')) return;
    const k = +card.dataset.k, j = +b.dataset.j, ok = set.q[k].a === j;
    answers[k] = ok; card.classList.add('answered'); card.querySelector('.choices').classList.remove('no-tap');
    card.querySelectorAll('.choice').forEach((c, jj) => { c.disabled = true; if (jj === set.q[k].a) c.classList.add('right'); else if (c === b) c.classList.add('wrong'); });
    sfx(ok ? 'ok' : 'bad');
    if (Object.keys(answers).length === nq) { btn.disabled = false; btn.textContent = t('Finish'); }
  }));
  btn.onclick = () => {
    stopSpeaking();
    const score = Object.values(answers).filter(Boolean).length, S = store.state(), first = !S.res[set.src];
    const xp = ((first ? 15 : 3) + score * 5) / 4;
    S.res[set.src] = S.res[set.src] || Date.now(); store.addXp(xp); const d = store.dayRec(); d.read = (d.read || 0) + 1; store.save();
    if (nq && score === nq) confetti(80);
    toast(nq ? t('{score}/{total} correct · +{xp} XP', { score, total: nq, xp: store.fmtXp(xp) }) : t('+{xp} XP', { xp: store.fmtXp(xp) }), 'read', 2400);
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
