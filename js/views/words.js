import * as store from '../store.js';
import { icon } from '../icons.js';
import { esc, fw, modal, toast, shuffle, addCustomDialog, confetti, mascotSVG } from '../ui.js';
import { speak, sfx } from '../audio.js';
import { runSession } from '../session.js';
import { VOCAB, TOPICS, VOCAB_BY_ID } from '../../data/vocab.js';
import { VERBS, VERB_BY_INF } from '../../data/verbs.js';
import { LESSONS } from '../../data/course.js';
import { present, negative, past, PERSONS } from '../fi.js';
import { strength, retrievability } from '../srs.js';
import { sourceWords, trainerQuestions, itemWord } from '../plan.js';
import { unlock } from '../gamify.js';
import { rerender, go } from '../app.js';

const POS = { n: 'noun', a: 'adj.', p: 'phrase', adv: 'adverb', q: 'question', pr: 'pronoun', num: 'number', x: 'word', v: 'verb', custom: 'my word' };
export function wordRow(w) {
  const c = store.state().cards[w.id], s = strength(c), saved = store.state().lists.some(l => l.items.includes(w.id));
  return `<button class="wrow" data-id="${esc(w.id)}"><div class="wr-t"><b class="fi">${esc(w.fi)}</b><span>${esc(w.en)}</span></div>
    <div class="wr-r">${saved ? '<span title="In a list">' + icon('pin') + '</span>' : ''}<span class="str" title="memory strength"><i style="width:${Math.round(s * 100)}%;${!c ? 'opacity:0' : ''}"></i></span></div></button>`;
}
export function wireWordRows(root) { root.querySelectorAll('.wrow').forEach(b => b.onclick = () => wordDetail(b.dataset.id)); }

export function wordDetail(id) {
  const vb = id.startsWith('v:') ? VERB_BY_INF[id.slice(2)] : null;
  const w = vb ? { id, fi: vb.inf, en: vb.en, pos: 'v' } : itemWord(id);
  if (!w) return;
  const S = store.state(), c = S.cards[id];
  const verb = vb || VERB_BY_INF[w.fi];
  const vt = verb ? (() => {
    const pr = present(verb), ng = negative(verb), ps = past(verb);
    return `<div class="tbl"><table class="conj"><tr><th></th><th>present</th><th>negative</th>${ps ? '<th>past</th>' : ''}</tr>
      ${PERSONS.map((p, i) => `<tr><td class="muted">${p}</td><td class="fi">${fw(pr[i])}</td><td class="fi">${fw(ng[i])}</td>${ps ? `<td class="fi">${fw(ps[i])}</td>` : ''}</tr>`).join('')}</table></div>
      <p class="muted small">Verb type ${verb.type || '–'}${verb.grad ? ' · consonant gradation' : ''}</p>`;
  })() : '';
  const due = c ? Math.round((c.due - Date.now()) / 86400000) : null;
  const m = modal(`<div class="wd">
    <div class="wd-h"><button class="spk big-spk" data-say="${esc(w.fi)}">${icon('speaker')}</button><div><div class="big fi">${esc(w.fi)}</div><div class="en-big">${esc(w.en)}</div><span class="pos">${POS[w.pos] || ''}</span></div></div>
    ${w.gen ? `<div class="forms"><span>genitive <b>${esc(w.gen)}</b></span><span>partitive <b>${esc(w.part)}</b></span><span>plural <b>${esc(w.pl)}</b></span></div>` : ''}
    ${vt}
    ${c ? `<p class="muted small">Memory: ${Math.round(retrievability(c) * 100)}% · stability ${c.s.toFixed(1)} days · ${due <= 0 ? 'due now' : `next review in ${due} day${due > 1 ? 's' : ''}`} · ${c.lapses} lapse${c.lapses === 1 ? '' : 's'}</p>` : `<p class="muted small">Not learned yet.</p>`}
    <h4>Save to list</h4><div class="chips">${S.lists.map(l => `<button class="chip ${store.inList(l.id, id) ? 'on' : ''}" data-l="${l.id}">${store.inList(l.id, id) ? '✓' : '＋'} ${esc(l.name)}</button>`).join('')}</div>
    <div class="row-btns"><button class="btn sm ghost" data-slow>${icon('slow')} Slow</button><a class="btn sm ghost" target="_blank" rel="noopener" href="https://en.wiktionary.org/wiki/${encodeURIComponent(w.fi.toLowerCase().replace(/[.!?]/g, ''))}#Finnish">Wiktionary ↗</a>
    ${w.pos === 'custom' ? `<button class="btn sm danger" data-del>Delete word</button>` : ''}</div></div>`);
  speak(w.fi);
  m.el.querySelector('[data-say]').onclick = () => speak(w.fi);
  m.el.querySelector('[data-slow]').onclick = () => speak(w.fi, { rate: .55 });
  m.el.querySelectorAll('[data-l]').forEach(b => b.onclick = () => { const on = store.toggleList(b.dataset.l, id); b.classList.toggle('on', on); b.textContent = (on ? '✓ ' : '＋ ') + S.lists.find(l => l.id === b.dataset.l).name; sfx('tap'); });
  m.el.querySelector('[data-del]')?.addEventListener('click', () => { delete S.custom[id]; S.lists.forEach(l => l.items = l.items.filter(x => x !== id)); delete S.cards[id]; store.save(); m.close(); rerender(); });
}

export function renderWords(el, sub = 'all', arg) {
  const S = store.state();
  const tabs = [['all', 'Sanasto'], ['lists', 'My lists'], ['verbs', 'Verbs'], ['train', 'Train']];
  el.innerHTML = `<h1 class="pg">Sanat <span class="muted">· ${store.learnedCount()} learned</span></h1>
    <nav class="tabs">${tabs.map(([k, n]) => `<a class="${k === sub ? 'on' : ''}" href="#/words/${k}">${n}</a>`).join('')}</nav><div class="w-body"></div>`;
  const body = el.querySelector('.w-body');
  if (sub === 'all') {
    body.innerHTML = `<input class="search" placeholder="Search Finnish or English…" type="search" autocapitalize="off" autocomplete="off">
      <div class="chips topic-chips"><button class="chip on" data-t="">All</button>${TOPICS.filter(t => t.words.length).map(t => `<button class="chip" data-t="${t.id}">${icon(t.icon)} ${esc(t.title)}</button>`).join('')}</div>
      <div class="wlist"></div><button class="fab" title="Add your own word">＋</button>`;
    let topic = '', q = '';
    const list = body.querySelector('.wlist');
    const draw = () => {
      const norm = s => s.toLowerCase();
      const custom = Object.entries(S.custom).map(([id, c]) => ({ id, ...c, pos: 'custom', topics: [] }));
      const words = [...custom, ...VOCAB].filter(w => (!topic || w.topics.includes(topic)) && (!q || norm(w.fi).includes(q) || norm(w.en).includes(q)));
      list.innerHTML = words.slice(0, 400).map(wordRow).join('') || '<p class="muted center">No matches. Tap ＋ to add your own word.</p>';
      wireWordRows(list);
    };
    body.querySelector('.search').oninput = e => { q = e.target.value.trim().toLowerCase(); draw(); };
    body.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { topic = b.dataset.t; body.querySelectorAll('[data-t]').forEach(x => x.classList.toggle('on', x === b)); draw(); });
    body.querySelector('.fab').onclick = () => addCustomDialog();
    draw();
  }
  if (sub === 'lists') {
    body.innerHTML = S.lists.map(l => `<section class="card list-card">
        <div class="row-h"><h3>${icon('pin')} ${esc(l.name)} <span class="muted small">${l.items.length}</span></h3>
        <div><button class="btn sm" data-train="${l.id}" ${l.items.length ? '' : 'disabled'}>Train</button> <button class="btn sm ghost" data-edit="${l.id}">⋯</button></div></div>
        <div class="wlist">${l.items.map(itemWord).filter(Boolean).map(wordRow).join('') || '<p class="muted small">Empty. Tap any Finnish word in SuomiT, or select text, to add it here.</p>'}</div></section>`).join('') +
      `<div class="row-btns"><button class="btn" id="nl">＋ New list</button><button class="btn ghost" id="nw">＋ Add a word</button></div>`;
    wireWordRows(body);
    body.querySelector('#nl').onclick = () => { const n = prompt('Name of the new list?'); if (n?.trim()) { store.newList(n.trim()); rerender(); } };
    body.querySelector('#nw').onclick = () => addCustomDialog();
    body.querySelectorAll('[data-train]').forEach(b => b.onclick = () => go(`#/words/train/list:${b.dataset.train}`));
    body.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => {
      const l = S.lists.find(x => x.id === b.dataset.edit);
      const m = modal(`<h3>${esc(l.name)}</h3><button class="btn wide ghost" id="rn">Rename</button><button class="btn wide ghost" id="cl">Remove all words</button>${l.id !== 'mine' ? '<button class="btn wide danger" id="dl">Delete list</button>' : ''}`);
      m.el.querySelector('#rn').onclick = () => { const n = prompt('New name', l.name); if (n?.trim()) store.renameList(l.id, n.trim()); m.close(); rerender(); };
      m.el.querySelector('#cl').onclick = () => { if (confirm('Remove all words from this list?')) { l.items = []; store.save(); } m.close(); rerender(); };
      m.el.querySelector('#dl')?.addEventListener('click', () => { if (confirm('Delete this list?')) store.deleteList(l.id); m.close(); rerender(); });
    });
  }
  if (sub === 'verbs') {
    body.innerHTML = `<input class="search" placeholder="Search verbs…" type="search" autocapitalize="off">
      <div class="chips"><button class="chip on" data-vt="">All</button>${[1, 2, 3, 4, 5, 6].map(t => `<button class="chip" data-vt="${t}">Type ${t}</button>`).join('')}</div><div class="wlist"></div>`;
    let t = '', q = '';
    const draw = () => {
      const vs = VERBS.filter(v => (!t || v.type === +t) && (!q || v.inf.includes(q) || v.en.includes(q)));
      body.querySelector('.wlist').innerHTML = vs.map(v => `<button class="wrow" data-v="${v.id}"><div class="wr-t"><b class="fi">${esc(v.inf)}</b><span>${esc(v.en)}</span></div><div class="wr-r"><span class="pos">type ${v.type || 'irr.'}</span><span class="muted small fi">${present(v)[0]} · ${present(v)[2]}</span></div></button>`).join('');
      body.querySelectorAll('[data-v]').forEach(b => b.onclick = () => wordDetail(b.dataset.v));
    };
    body.querySelector('.search').oninput = e => { q = e.target.value.trim().toLowerCase(); draw(); };
    body.querySelectorAll('[data-vt]').forEach(b => b.onclick = () => { t = b.dataset.vt; body.querySelectorAll('[data-vt]').forEach(x => x.classList.toggle('on', x === b)); draw(); });
    draw();
  }
  if (sub === 'train') renderTrainer(body, arg);
}

const MODES = [
  ['smart', icon('grid'), 'Smart', 'adapts to how well you know each word'],
  ['flashFi', icon('cards'), 'Flashcards FI→EN', 'flip & rate yourself'],
  ['flashEn', icon('swap'), 'Flashcards EN→FI', 'the harder direction'],
  ['write', icon('pen'), 'Write it', 'type the Finnish'],
  ['listen', icon('headphones'), 'Listen & write', 'dictation'],
  ['mc', icon('choice'), 'Quick choice', 'multiple choice'],
  ['match', icon('puzzle'), 'Match pairs', 'beat the clock'],
  ['speed', icon('bolt'), 'Speed round', '60 seconds'],
];
function renderTrainer(body, preset) {
  const S = store.state();
  const sources = [
    ['due', `${icon('repeat')} Due now`, store.dueIds().length],
    ['weak', icon('alert') + ' Weak words', sourceWords('weak').length],
    ['learned', icon('check') + ' All learned', Object.keys(S.cards).length],
    ...S.lists.map(l => ['list:' + l.id, icon('pin') + ' ' + esc(l.name), l.items.length]),
    ...LESSONS.filter(l => sourceWords('lesson:' + l.id).length).map(l => ['lesson:' + l.id, `${icon(l.icon)} ${esc(l.title)}`, sourceWords('lesson:' + l.id).length]),
    ['all', icon('book') + ' Everything', VOCAB.length],
  ];
  let src = preset && sources.find(s => s[0] === preset) ? preset : (sources.find(s => s[2] > 0)?.[0] || 'all'), mode = 'smart';
  body.innerHTML = `<h3 class="sec">1 · Which words?</h3><div class="chips src">${sources.map(([k, n, c]) => `<button class="chip ${k === src ? 'on' : ''}" data-src="${esc(k)}" ${c ? '' : 'disabled'}>${n} <small>${c}</small></button>`).join('')}</div>
    <h3 class="sec">2 · How?</h3><div class="modes">${MODES.map(([k, i, n, d]) => `<button class="mode ${k === mode ? 'on' : ''}" data-mode="${k}"><span>${i}</span><b>${n}</b><small>${d}</small></button>`).join('')}</div>
    <div class="sticky-cta"><button class="btn big-btn wide" id="tgo">${icon('play')} Start training</button></div>`;
  body.querySelectorAll('[data-src]').forEach(b => b.onclick = () => { src = b.dataset.src; body.querySelectorAll('[data-src]').forEach(x => x.classList.toggle('on', x === b)); });
  body.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => { mode = b.dataset.mode; body.querySelectorAll('[data-mode]').forEach(x => x.classList.toggle('on', x === b)); });
  body.querySelector('#tgo').onclick = function start() {
    const words = sourceWords(src);
    if (!words.length) return toast('No words in this selection yet', 'help');
    if (mode === 'match') return startMatch(words);
    runSession({
      title: 'Training', mode: mode === 'speed' ? 'speed' : mode.startsWith('flash') ? 'flash' : 'review', seconds: mode === 'speed' ? 60 : 0,
      questions: trainerQuestions(words, mode, 20),
      onFinish: r => { if (mode === 'speed') { if (r.ok > (S.best.speed || 0)) { S.best.speed = r.ok; store.save(); } if (r.ok >= 30) unlock('speed30'); } },
      onClose: rerender, again: start,
    });
  };
}

// ------------------------------------------------------------ Match pairs game
export function startMatch(words) {
  const pool = shuffle(words.filter(w => w.en.length < 40)).slice(0, 6);
  if (pool.length < 3) return toast('Learn a few more words first', 'sprout');
  const root = document.getElementById('session'); root.hidden = false; document.body.classList.add('in-session');
  const tiles = shuffle([...pool.map(w => ({ id: w.id, t: w.fi, fi: 1 })), ...pool.map(w => ({ id: w.id, t: w.en.split(';')[0], fi: 0 }))]);
  const t0 = Date.now(); let sel = null, left = pool.length, penalty = 0, timer;
  root.innerHTML = `<div class="s-top"><button class="s-x">✕</button><div class="s-bar"><div class="s-fill" style="width:0"></div></div><div class="s-timer">${icon('clock')} <b>0</b></div></div>
    <div class="s-body"><h3 class="center">Match the pairs</h3><div class="match">${tiles.map((x, k) => `<button class="mt ${x.fi ? 'fi' : ''}" data-k="${k}">${esc(x.t)}</button>`).join('')}</div></div>`;
  const close = () => { clearInterval(timer); root.hidden = true; root.innerHTML = ''; document.body.classList.remove('in-session'); rerender(); };
  root.querySelector('.s-x').onclick = close;
  timer = setInterval(() => { const tb = root.querySelector('.s-timer b'); if (tb) tb.textContent = Math.floor((Date.now() - t0) / 1000) + penalty; }, 250);
  root.querySelectorAll('.mt').forEach(b => b.onclick = () => {
    const x = tiles[+b.dataset.k]; if (b.classList.contains('gone')) return;
    if (x.fi) speak(x.t);
    if (!sel) { sel = b; b.classList.add('sel'); sfx('tap'); return; }
    if (sel === b) { b.classList.remove('sel'); sel = null; return; }
    const y = tiles[+sel.dataset.k];
    if (x.id === y.id && x.fi !== y.fi) {
      sfx('ok'); [b, sel].forEach(e => { e.classList.remove('sel'); e.classList.add('gone'); }); sel = null; left--;
      root.querySelector('.s-fill').style.width = (1 - left / pool.length) * 100 + '%';
      if (!left) end();
    } else { sfx('bad'); penalty += 2; [b, sel].forEach(e => { e.classList.add('shake'); setTimeout(() => e.classList.remove('shake', 'sel'), 400); }); sel = null; }
  });
  function end() {
    clearInterval(timer);
    const secs = Math.round((Date.now() - t0) / 1000) + penalty, S = store.state(), best = S.best.match;
    if (!best || secs < best) S.best.match = secs;
    store.addXp(pool.length * 3); if (secs < 30) unlock('match');
    confetti(); sfx('win');
    root.innerHTML = `<div class="end">${mascotSVG(undefined, { size: 120, mood: 'wow' })}<h2>${secs} s${!best || secs < best ? ' · New record!' : ''}</h2>
      <div class="end-stats"><div><b>+${pool.length * 3}</b><span>XP</span></div><div><b>${penalty}</b><span>penalty s</span></div><div><b>${S.best.match}s</b><span>best</span></div></div>
      <div class="end-btns"><button class="btn ghost again">↻ Again</button><button class="btn go">Continue</button></div></div>`;
    root.querySelector('.go').onclick = close;
    root.querySelector('.again').onclick = () => { root.innerHTML = ''; startMatch(words); };
  }
}
