// Practice session runner: renders questions, checks answers, schedules reviews, awards XP.
import * as store from './store.js';
import { icon } from './icons.js';
import { gradeAnswer, same } from './fi.js';
import { chestHTML, wireChest } from './chest.js';
import { speak, sfx, buzz, stopSpeaking } from './audio.js';
import { esc, fw, toast, confetti, mascotSVG, shuffle } from './ui.js';
import { vocabQ } from './exercises.js';
import { VOCAB_BY_ID } from '../data/vocab.js';
import { itemWord } from './plan.js';
import * as G from './gamify.js';

const PRAISE = ['Oikein!', 'Hienoa!', 'Mahtavaa!', 'Loistavaa!', 'Upeaa!', 'Hyvä!', 'Täydellistä!', 'Juuri niin!', 'Erinomaista!', 'Nappiin!'];
const pickP = a => a[Math.floor(Math.random() * a.length)];
/** After a wrong answer you type the Finnish word yourself before moving on. null = nothing sensible to type
 *  (digits, English answers, whole sentences). */
export function copyTarget(q) {
  const w = q.item && itemWord(q.item);
  let t = w ? w.fi : q.kind === 'mc' && q.fiChoices ? q.answer : q.kind === 'type' && !q.numeric ? (Array.isArray(q.answer) ? q.answer[0] : q.answer) : null;
  if (!t) return null;
  t = String(t).replace(/[.!?]+$/, '').trim();
  if (!/[a-zåäö]/i.test(t) || /\d|€/.test(t) || /^type /i.test(t) || t.split(/\s+/).length > 6) return null;
  return t;
}

/**
 * opts: { title, questions, mode: 'learn'|'review'|'drill'|'speed'|'flash', seconds, onFinish(result), xpPer }
 */
export function runSession(opts) {
  // nothing to ask (no learned words yet, an empty list, …): don't open an empty session that scores 0 %
  if (!opts.questions?.length) { toast('Nothing to practise here yet. Learn a few words first!', 'alert'); return; }
  const root = document.getElementById('session');
  const S = store.state();
  const queue = [...opts.questions];
  const total0 = queue.length;
  const graded = new Set(), skillStats = {};
  let i = 0, combo = 0, bestCombo = 0, ok = 0, bad = 0, xp = 0, done = 0, finished = false, startT = Date.now(), qStart = 0;
  const xpBefore = store.dayRec().xp, coinsBefore = store.coins();
  let timer = null, timeLeft = opts.seconds || 0;
  root.hidden = false; document.body.classList.add('in-session');
  root.innerHTML = `
    <div class="s-top">
      <button class="s-x" aria-label="Quit">✕</button>
      <div class="s-bar"><div class="s-fill"></div></div>
      ${opts.seconds ? `<div class="s-timer">${icon('clock')} <b>${timeLeft}</b></div>` : ''}
      <div class="s-combo" title="Combo"><span>${icon('flame')}</span><b>0</b></div>
    </div>
    <div class="s-body"><div class="s-card"></div></div>
    <div class="s-foot"></div>`;
  const $ = s => root.querySelector(s);
  $('.s-x').onclick = () => { if (done < 2 || confirm('Quit this session? Progress so far is saved.')) finish(true); };
  if (opts.seconds) timer = setInterval(() => { timeLeft--; $('.s-timer b').textContent = timeLeft; if (timeLeft <= 5) $('.s-timer').classList.add('hot'); if (timeLeft <= 0) finish(); }, 1000);

  function progress() {
    const pct = opts.seconds ? (1 - timeLeft / opts.seconds) * 100 : Math.min(100, done / Math.max(1, done + queue.length - i) * 100);
    $('.s-fill').style.width = pct + '%';
    const c = $('.s-combo'); c.querySelector('b').textContent = combo; c.classList.toggle('on', combo >= 3);
  }

  function next() {
    if (finished) return;
    if (i >= queue.length) return finish();
    const q = queue[i];
    qStart = Date.now();
    render(q);
    progress();
  }

  function render(q) {
    const card = $('.s-card'), foot = $('.s-foot');
    card.className = 's-card pop-in no-tap'; foot.innerHTML = ''; foot.className = 's-foot';
    const listenBtns = q.listen || q.kind === 'intro' || q.kind === 'flash'
      ? `<div class="listen"><button class="say" data-r="1">${icon('speaker')}</button><button class="say slow" data-r=".55">${icon('slow')}</button></div>` : '';
    if (q.kind === 'intro') {
      const w = q.word;
      card.innerHTML = `<div class="tag new">New word</div>
        <div class="big fi">${fw(w.fi)}</div><div class="en-big">${esc(w.en)}</div>
        ${w.gen ? `<div class="forms"><span>genitive <b>${w.gen}</b></span><span>partitive <b>${w.part}</b></span><span>plural <b>${w.pl}</b></span></div>` : ''}
        ${w.ex ? `<p class="fi ex">${fw(w.ex.fi)}<br><span class="muted">${esc(w.ex.en)}</span></p>` : ''}${listenBtns}
        <p class="muted small">Say it out loud twice. Saying it helps you remember.</p>`;
      foot.innerHTML = `<button class="btn wide go">Got it →</button>`;
      foot.querySelector('.go').onclick = () => {
        // follow up with a recall question 2–3 cards later
        queue.splice(Math.min(queue.length, i + 3), 0, vocabQ(w, { force: Math.random() < .5 ? 'mcFiEn' : 'mcEnFi' }));
        i++; next();
      };
      speak(w.fi); wireSay(q); return;
    }
    if (q.kind === 'flash') return renderFlash(q);
    const head = `${q.skill ? `<div class="tag">${esc(q.skillName || '')}</div>` : ''}${q.prompt}${q.sub ? `<div class="sub">${esc(q.sub)}</div>` : ''}${listenBtns}`;
    if (q.kind === 'mc') {
      card.innerHTML = head + `<div class="choices ${q.choices.some(c => c.length > 22) ? 'col' : ''}">${q.choices.map((c, k) => `<button class="choice" data-k="${k}"><span class="kn">${k + 1}</span>${q.fiChoices ? fw(c) : esc(c)}</button>`).join('')}</div>`;
      card.querySelectorAll('.choice').forEach(b => b.onclick = e => { if (e.target.closest('.fw') && !b.disabled && b.closest('.answered')) return; answer(q, q.choices[+b.dataset.k], b); });
    } else if (q.kind === 'type') {
      card.innerHTML = head + `<div class="type-wrap"><input class="ans" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="done" placeholder="${q.numeric ? '123' : 'Kirjoita…'}" ${q.numeric ? 'inputmode="numeric"' : ''}>
        ${q.numeric ? '' : `<div class="dots"><button data-ch="ä">ä</button><button data-ch="ö">ö</button></div>`}</div>`;
      foot.innerHTML = `<button class="btn ghost skip">I don't know</button><button class="btn go">Check</button>`;
      const inp = card.querySelector('.ans');
      card.querySelectorAll('[data-ch]').forEach(b => b.onpointerdown = e => { e.preventDefault(); const s = inp.selectionStart; inp.value = inp.value.slice(0, s) + b.dataset.ch + inp.value.slice(inp.selectionEnd); inp.setSelectionRange(s + 1, s + 1); });
      inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); if (inp.value.trim()) answer(q, inp.value); } };
      foot.querySelector('.go').onclick = () => inp.value.trim() ? answer(q, inp.value) : inp.focus();
      foot.querySelector('.skip').onclick = () => answer(q, '');
      setTimeout(() => inp.focus({ preventScroll: true }), 60);
    } else if (q.kind === 'tiles') {
      card.innerHTML = head + `<div class="tile-ans"></div><div class="tile-bank">${q.tiles.map((t, k) => `<button class="tile" data-k="${k}">${esc(t)}</button>`).join('')}</div>`;
      const ans = card.querySelector('.tile-ans'), bank = card.querySelector('.tile-bank');
      bank.onclick = e => { const b = e.target.closest('.tile'); if (!b || b.classList.contains('used')) return; sfx('tap'); b.classList.add('used'); const c = b.cloneNode(true); c.dataset.src = b.dataset.k; ans.appendChild(c); };
      ans.onclick = e => { const b = e.target.closest('.tile'); if (!b) return; bank.querySelector(`[data-k="${b.dataset.src}"]`).classList.remove('used'); b.remove(); };
      foot.innerHTML = `<button class="btn ghost skip">I don't know</button><button class="btn go">Check</button>`;
      foot.querySelector('.go').onclick = () => answer(q, [...ans.children].map(t => t.textContent).join(' '));
      foot.querySelector('.skip').onclick = () => answer(q, '');
    }
    wireSay(q);
    if (q.listen) { // the big speaker / phone / cloud picture in the prompt plays the sound too
      const big = card.querySelector('.big');
      if (big) { big.classList.add('say-big'); big.setAttribute('role', 'button'); big.setAttribute('aria-label', 'Play again'); big.onclick = () => speak(q.say); }
      setTimeout(() => speak(q.say), 250);
    }
    else if (q.autoSay && store.state().profile.autoSpeak) setTimeout(() => speak(q.say), 200);
  }
  function wireSay(q) { root.querySelectorAll('.say').forEach(b => b.onclick = () => speak(q.say, { rate: +b.dataset.r === 1 ? undefined : +b.dataset.r })); }

  function renderFlash(q) {
    const w = q.word, card = $('.s-card'), foot = $('.s-foot');
    const front = q.dir === 'en' ? `<div class="big">${esc(w.en)}</div>` : `<div class="big fi">${fw(w.fi)}</div>`;
    card.innerHTML = `<div class="flash"><div class="flash-front">${front}<div class="sub">Tap to flip</div></div></div>`;
    foot.innerHTML = `<button class="btn wide go">Show answer</button>`;
    if (q.dir !== 'en') speak(w.fi);
    const flip = () => {
      sfx('flip');
      card.innerHTML = `<div class="flash flipped">${front}<hr><div class="${q.dir === 'en' ? 'big fi' : 'en-big'}">${q.dir === 'en' ? fw(w.fi) : esc(w.en)}</div>
        ${w.gen ? `<div class="forms"><span>gen <b>${w.gen}</b></span><span>part <b>${w.part}</b></span><span>pl <b>${w.pl}</b></span></div>` : ''}
        <div class="listen"><button class="say" data-r="1">${icon('speaker')}</button><button class="say slow" data-r=".55">${icon('slow')}</button></div></div>`;
      wireSay(q); if (q.dir === 'en') speak(w.fi);
      foot.innerHTML = `<div class="grades">${[['Again', 1, 'g1'], ['Hard', 2, 'g2'], ['Good', 3, 'g3'], ['Easy', 4, 'g4']].map(([n, g, c]) => `<button class="btn ${c}" data-g="${g}"><small>${g}</small>${n}</button>`).join('')}</div>`;
      foot.querySelectorAll('[data-g]').forEach(b => b.onclick = () => flashGrade(q, +b.dataset.g));
    };
    card.onclick = e => { if (!e.target.closest('.say,.fw') && !card.querySelector('.flipped')) flip(); };
    foot.querySelector('.go').onclick = flip;
    q._flip = flip;
  }
  function flashGrade(q, g) {
    store.grade(q.item, g);
    const good = g >= 2;
    if (good) { ok++; combo++; addXp(5); } else { bad++; combo = 0; if (!q._retry) queue.push({ ...q, _retry: true }); }
    track(good, q); done++; i++; next();
  }

  function addXp(n) { xp += n; store.addXp(n); }
  function track(good, q) {
    const d = store.dayRec(); d.ans++; if (good) d.ok++; if (q.listen && good) d.listen++;
    bestCombo = Math.max(bestCombo, combo); d.best = Math.max(d.best || 0, combo);
    if (combo > (store.state().best.combo || 0)) store.state().best.combo = combo;
    if (q.skill) { const s = skillStats[q.skill] ||= { ok: 0, n: 0 }; s.n++; if (good) s.ok++; }
    store.save();
  }

  function answer(q, input, btn) {
    const card = $('.s-card'), foot = $('.s-foot');
    if (card.classList.contains('answered')) return;
    card.classList.add('answered'); card.classList.remove('no-tap');
    const res = gradeAnswer(q, input, { strictDots: S.profile.strictDots });
    const good = res.ok, first = !q._retry;
    // UI marks
    if (q.kind === 'mc') card.querySelectorAll('.choice').forEach(b => {
      b.disabled = true; const c = q.choices[+b.dataset.k];
      if (same(c, q.answer)) b.classList.add('right'); else if (b === btn) b.classList.add('wrong');
    });
    card.querySelectorAll('input').forEach(x => { x.disabled = true; x.classList.add(good ? 'right' : 'wrong'); });
    card.querySelector('.tile-ans')?.classList.add(good ? 'right' : 'wrong');
    // scoring
    if (good) {
      ok++; combo++;
      addXp(opts.mode === 'speed' ? 5 : first ? 10 : 5);
      if (combo > 0 && combo % 5 === 0) { addXp(5); sfx('combo'); buzz(30); $('.s-combo').classList.add('burst'); setTimeout(() => $('.s-combo')?.classList.remove('burst'), 600); }
      else sfx('ok');
    } else { bad++; combo = 0; sfx('bad'); buzz(60); card.classList.add('shake'); }
    track(good, q);
    // spaced repetition
    if (q.item && !graded.has(q.item)) {
      graded.add(q.item);
      const fast = Date.now() - qStart < 6000;
      const g = !good ? 1 : res.grade !== 'exact' || res.alt ? 2 : (q.kind === 'type' || q.kind === 'tiles') && fast && store.card(q.item)?.reps ? 4 : 3;
      store.grade(q.item, g);
    }
    if (!good && !q._retry && opts.mode !== 'speed') {
      // a missed word comes back as a typing question: you have to produce it, not just recognise it
      const again = q.item && VOCAB_BY_ID[q.item] ? vocabQ(VOCAB_BY_ID[q.item], { force: 'typeEnFi' }) : { ...q };
      queue.splice(Math.min(queue.length, i + 3 + Math.floor(Math.random() * 3)), 0, { ...again, skill: q.skill, skillName: q.skillName, _retry: true });
    }
    done++; progress();
    if (opts.mode === 'speed') { setTimeout(() => { i++; next(); }, good ? 250 : 700); return; }
    // feedback sheet
    const ansShown = Array.isArray(q.answer) ? q.answer[0] : q.answer;
    const note = res.grade === 'dots' ? `<div class="warn">Careful with the dots: <b>${esc(res.best)}</b> (ä/ö change the meaning!)</div>`
      : res.grade === 'typo' ? `<div class="warn">Small typo, the correct spelling is <b>${esc(res.best)}</b></div>`
        : res.grade === 'length' ? `<div class="warn">Watch the length! Double letters change the meaning in Finnish.</div>`
          : res.alt ? `<div class="warn">Also correct! The word we were practising: <b>${esc(ansShown)}</b></div>` : '';
    const target = good ? null : copyTarget(q);
    foot.className = 's-foot fb ' + (good ? 'good' : 'bad');
    foot.innerHTML = `<div class="fb-txt">
        <div class="fb-h">${good ? '✓ ' + pickP(PRAISE) : '✗ Oikea vastaus:'}</div>
        ${!good || q.reveal ? `<div class="fb-a ${/[a-zäö]/i.test(ansShown) ? 'fi' : ''}">${good ? '' : fw(ansShown)}${q.reveal ? `<div class="muted">${fw(q.reveal)}</div>` : ''}</div>` : ''}
        ${note}${q.explain && (!good || res.grade !== 'exact') ? `<div class="explain">${q.explain}</div>` : ''}
      </div>
      ${target ? `<div class="copy"><label class="copy-l">Type it to continue: <b class="fi">${esc(target)}</b></label>
        <div class="copy-row"><input class="ans copy-in" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="go" placeholder="Kirjoita…">
        <div class="dots"><button data-ch="ä">ä</button><button data-ch="ö">ö</button></div></div></div>` : ''}
      <div class="fb-btns">${q.say ? `<button class="say-a" aria-label="Listen">${icon('speaker')}</button>` : ''}<button class="btn go" ${target ? 'disabled' : ''}>${good ? 'Continue' : target ? 'Type it first' : 'Got it'}</button></div>`;
    // the right/wrong sound first, then the voice (on iPhone a starting voice clip can cut the sound off)
    const qi = i;
    if ((q.say && !q.listen) || (q.listen && !good)) setTimeout(() => { if (i === qi && !finished) speak(q.say); }, 380);
    foot.querySelector('.say-a')?.addEventListener('click', () => speak(q.say));
    const go = foot.querySelector('.go'); go.onclick = () => { if (!go.disabled) { i++; next(); } };
    if (target) {
      const inp = foot.querySelector('.copy-in');
      const matches = () => gradeAnswer({ kind: 'type', answer: target }, inp.value, { strictDots: true }).grade === 'exact';
      const update = () => { const m = matches(); if (m && go.disabled) sfx('tap'); go.disabled = !m; go.textContent = m ? 'Continue' : 'Type it first'; inp.classList.toggle('right', m); };
      inp.addEventListener('input', update);
      foot.querySelectorAll('[data-ch]').forEach(b => b.onpointerdown = e => { e.preventDefault(); const p = inp.selectionStart ?? inp.value.length; inp.value = inp.value.slice(0, p) + b.dataset.ch + inp.value.slice(inp.selectionEnd ?? p); inp.setSelectionRange(p + 1, p + 1); update(); });
      inp.onkeydown = e => {
        if (e.key !== 'Enter') return;
        e.preventDefault(); e.stopPropagation();
        if (matches()) go.click(); else { inp.classList.remove('shake'); void inp.offsetWidth; inp.classList.add('shake'); sfx('bad'); buzz(30); }
      };
      inp.focus({ preventScroll: true }); // synchronous: still inside the tap, so iOS opens the keyboard
    } else setTimeout(() => go.focus({ preventScroll: true }), 30);
  }

  function onKey(e) {
    if (root.hidden || finished) return;
    const q = queue[i]; if (!q) return;
    const card = $('.s-card'), inInput = e.target.tagName === 'INPUT';
    if (q.kind === 'mc' && !card.classList.contains('answered') && /^[1-4]$/.test(e.key)) { const b = card.querySelectorAll('.choice')[+e.key - 1]; b?.click(); }
    else if (q.kind === 'flash') {
      if (!card.querySelector('.flipped') && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); q._flip?.(); }
      else if (card.querySelector('.flipped') && /^[1-4]$/.test(e.key)) flashGrade(q, +e.key);
    } else if (card.classList.contains('answered') && e.key === 'Enter' && !inInput) { e.preventDefault(); $('.s-foot .go')?.click(); }
    else if (card.classList.contains('answered') && e.key === 'Enter' && inInput) { e.preventDefault(); $('.s-foot .go')?.click(); }
    else if (q.kind === 'intro' && e.key === 'Enter') $('.s-foot .go')?.click();
  }
  document.addEventListener('keydown', onKey);

  function finish(quit = false) {
    if (finished) return; finished = true;
    clearInterval(timer); stopSpeaking(); document.removeEventListener('keydown', onKey);
    for (const [sk, st] of Object.entries(skillStats)) if (st.n >= 3) store.gradeSkill(sk, st.ok / st.n);
    const total = ok + bad, acc = total ? ok / total : 0;
    const result = { ok, bad, total, acc, xp, bestCombo, quit, secs: Math.round((Date.now() - startT) / 1000), coins: store.coins() - coinsBefore };
    if (total >= 1 && !quit) G.unlock('first');
    if (total >= 10 && bad === 0 && opts.mode !== 'flash') G.unlock('perfect');
    opts.onFinish?.(result);
    const chest = total ? G.maybeChest(xpBefore) : 0;
    G.claimQuests(); G.checkAchievements({ session: true });
    if (quit && total < 3) return close();
    showEnd(result, chest);
  }
  function showEnd(r, chest) {
    const goal = store.state().profile.goal, dxp = store.dayRec().xp, pct = Math.min(1, dxp / goal);
    const mood = r.acc >= .8 ? 'wow' : r.acc >= .5 ? 'happy' : 'sad';
    const title = r.acc >= .95 ? 'Täydellistä!' : r.acc >= .8 ? 'Mahtavaa!' : r.acc >= .6 ? 'Hyvää työtä!' : 'Sisua! Keep going';
    if (r.acc >= .8) { confetti(); sfx('win'); }
    root.innerHTML = `<div class="end">
      ${mascotSVG(undefined, { size: 130, mood })}
      <h2>${title}</h2>
      ${chestHTML(r)}
      <div class="end-stats">
        <div><b>${Math.round(r.acc * 100)}%</b><span>accuracy</span></div>
        <div><b>${r.bestCombo}</b><span>best combo</span></div>
        ${opts.mode === 'speed' ? `<div><b>${r.ok}</b><span>points</span></div>` : `<div><b>${Math.floor(r.secs / 60)}:${String(r.secs % 60).padStart(2, '0')}</b><span>time</span></div>`}
      </div>
      <div class="goal-bar"><div style="width:${pct * 100}%"></div><span>${dxp} / ${goal} XP today</span></div>
      ${opts.endExtra?.(r) || ''}
      <div class="end-btns"><button class="btn ghost again">↻ Again</button><button class="btn go">Continue</button></div>
    </div>`;
    root.querySelector('.go').onclick = close;
    root.querySelector('.again').onclick = () => { close(); opts.again?.(); };
    wireChest(root);
    if (chest) setTimeout(() => G.chestModal(chest, store.streak()), 2600);
  }
  function close() { root.hidden = true; root.innerHTML = ''; document.body.classList.remove('in-session'); opts.onClose?.(); }
  next();
}
