import * as store from '../store.js';
import { icon } from '../icons.js';
import { mascotSVG, esc, fw } from '../ui.js';
import { runSession } from '../session.js';
import { dailyMix, mixSummary, currentLesson, lessonLearn, sourceWords, trainerQuestions } from '../plan.js';
import { quests } from '../gamify.js';
import { MODULE_BY_ID } from '../../data/course.js';
import { SKILL_NAMES } from '../exercises.js';
import { hasFinnishVoice, hasNeuralAudio } from '../audio.js';
import { rerender, go } from '../app.js';
import { startMatch } from './words.js';
import { openLootBox, lootPool, LOOT_PRICE } from '../gamify.js';

const GREET = () => {
  const h = new Date().getHours();
  return h < 5 ? ['Hyvää yötä!', 'Good night!'] : h < 10 ? ['Hyvää huomenta!', 'Good morning!'] : h < 17 ? ['Hyvää päivää!', 'Good day!'] : h < 22 ? ['Hyvää iltaa!', 'Good evening!'] : ['Hyvää yötä!', 'Good night!'];
};
const TIPS = [
  ['Sano ääneen!', 'Say every answer out loud. Speaking doubles the memory trace.'],
  ['Pieni päivässä', 'Short and daily beats long and weekly. 15 minutes a day is the sweet spot.'],
  ['Virheet ovat hyviä', "Mistakes are good: a failed recall followed by the answer is one of the strongest ways to learn."],
  ['Kuuntele', 'Put on Yle Selkouutiset or a podcast while cooking. Understanding 50% is fine.'],
  ['Kerää sanoja', 'Tap any Finnish word in the app and save it. Words you choose yourself stick better.'],
  ['Puoli neljä = 3:30', '"Half four" in Finnish is half-way TO four. Classic trap!'],
];

export function renderHome(el) {
  const S = store.state(), goal = S.profile.goal, dxp = store.dayRec().xp, pct = Math.min(1, dxp / goal);
  const [g, gEn] = GREET(), mix = mixSummary(), cur = currentLesson(), mod = MODULE_BY_ID[cur.mod];
  const tip = TIPS[new Date().getDate() % TIPS.length];
  const qs = quests();
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const R = 52, C = 2 * Math.PI * R;
  el.innerHTML = `
  <section class="hero">
    <div class="hero-m">${mascotSVG(undefined, { size: 96, mood: pct >= 1 ? 'wow' : 'happy' })}</div>
    <div class="bubble"><b class="fi">${fw(g)}</b><span>${gEn}${S.profile.name ? ', ' + esc(S.profile.name) : ''}</span></div>
  </section>

  <section class="card mix">
    <div class="ring"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="${R}" class="rbg"/><circle cx="60" cy="60" r="${R}" class="rfg" style="stroke-dasharray:${C};stroke-dashoffset:${C * (1 - pct)}"/></svg>
      <div class="ring-t"><b>${dxp}</b><span>/ ${goal} XP</span></div></div>
    <div class="mix-r">
      <h2>Päivän treeni</h2><p class="muted">Today's smart mix</p>
      <div class="mix-chips">${mix.due ? `<span class="chip">${icon('repeat')} ${mix.due} review${mix.due > 1 ? 's' : ''}</span>` : ''}${mix.fresh ? `<span class="chip">${icon('sprout')} ${mix.fresh} new</span>` : ''}<span class="chip">${icon('puzzle')} grammar</span></div>
      <button class="btn big-btn" id="mix">${icon('play')} Start</button>
    </div>
  </section>

  <a class="card cont" href="#/lesson/${cur.id}" style="--mc:${mod.color}">
    <div class="cont-ico">${icon(cur.icon)}</div>
    <div><div class="muted small">Continue · Module ${mod.n}</div><b>${esc(cur.title)}</b><div class="fi small">${esc(cur.fi)}</div></div>
    <span class="arrow">›</span>
  </a>

  <section class="card">
    <div class="row-h"><h3>${icon('list')} Daily quests</h3><span class="muted small">reset at midnight</span></div>
    ${qs.map(q => `<div class="quest ${q.claimed ? 'done' : ''}"><div class="q-t">${q.claimed ? icon('check') : icon('dots')} ${esc(q.title)}</div>
      <div class="q-bar"><div style="width:${q.prog / q.target * 100}%"></div></div><div class="q-r">${q.prog}/${q.target} · ${icon('coin')}${q.coins}</div></div>`).join('')}
  </section>

  ${lootPool().length ? `<button class="card loot-home" id="loot"><span class="lh-ico">${icon('gift')}</span><div><b>Yllätyslaatikko</b><div class="muted small">Surprise box: a random cosmetic you don't own · ${lootPool().length} left</div></div><span class="lh-p">${icon('coin')} ${LOOT_PRICE}</span></button>` : ''}
  <section class="grid2">
    <button class="tile-btn" data-m="speed"><span>${icon('bolt')}</span><b>Speed round</b><small>60 seconds · best ${S.best.speed || 0}</small></button>
    <button class="tile-btn" data-m="match"><span>${icon('grid')}</span><b>Match pairs</b><small>best ${S.best.match ? S.best.match + ' s' : '–'}</small></button>
    <button class="tile-btn" data-m="listen"><span>${icon('headphones')}</span><b>Listening</b><small>hear & write</small></button>
    <button class="tile-btn" data-m="weak"><span>${icon('alert')}</span><b>Weak words</b><small>${sourceWords('weak').length} to fix</small></button>
  </section>

  <section class="card tip"><b class="fi">${icon('bulb')} ${esc(tip[0])}</b><p>${esc(tip[1])}</p></section>
  ${!hasFinnishVoice() && !hasNeuralAudio() ? `<section class="card warn-card"><b>${icon('mute')} No Finnish voice found</b><p class="small">Pronunciation uses your device's voice. iPhone: Settings → Accessibility → Spoken Content → Voices → Finnish (Satu). Mac: System Settings → Accessibility → Spoken Content → System voice → Manage voices → Finnish.</p></section>` : ''}
  ${!standalone ? `<section class="card install"><b>${icon('phone')} Install SuomiT</b><p class="small">iPhone: Safari → Share → <i>Add to Home Screen</i>. Mac: Safari → File → <i>Add to Dock</i>, or Chrome → Install. Works offline.</p></section>` : ''}
  `;
  el.querySelector('#mix').onclick = () => {
    const m = dailyMix();
    if (!m.questions.length) return go('#/lesson/' + cur.id);
    runSession({ title: 'Daily mix', questions: m.questions, mode: 'review', onClose: rerender, again: () => document.getElementById('mix')?.click() });
  };
  el.querySelector('#loot')?.addEventListener('click', () => openLootBox({ onClose: rerender }));
  el.querySelectorAll('[data-m]').forEach(b => b.onclick = () => {
    const m = b.dataset.m;
    const learned = sourceWords('learned');
    const pool = learned.length >= 12 ? learned : sourceWords('lesson:' + cur.id).concat(learned);
    if (m === 'match') return startMatch(pool);
    if (m === 'speed') return runSession({ title: 'Speed round', mode: 'speed', seconds: 60, questions: trainerQuestions(pool, 'speed'), onFinish: r => { if (r.ok > (S.best.speed || 0)) { S.best.speed = r.ok; store.save(); } if (r.ok >= 30) import('../gamify.js').then(g => g.unlock('speed30')); }, onClose: rerender, again: () => b.click() });
    if (m === 'listen') return runSession({ title: 'Listening', mode: 'drill', questions: trainerQuestions(pool, 'listen', 12), onClose: rerender, again: () => b.click() });
    if (m === 'weak') { const w = sourceWords('weak'); return runSession({ title: 'Weak words', mode: 'review', questions: trainerQuestions(w.length ? w : pool, 'smart', 15), onClose: rerender }); }
  });
}
