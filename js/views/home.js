import * as store from '../store.js';
import { icon } from '../icons.js';
import { t, lessonText, lang, LANGS, flagSVG } from '../i18n.js';
import { mascotSVG, esc, fw } from '../ui.js';
import { runSession } from '../session.js';
import { dailyMix, mixSummary, currentLesson, lessonLearn, sourceWords, trainerQuestions, wordsKnown } from '../plan.js';
import { wordBar } from './path.js';
import { sentenceQs } from '../sentences.js';
import { quests } from '../gamify.js';
import { MODULE_BY_ID } from '../../data/course.js';
import { SKILL_NAMES } from '../exercises.js';
import { hasFinnishVoice, hasNeuralAudio } from '../audio.js';
import { rerender, go } from '../app.js';
import { startMatch } from './words.js';
import { openLootBox, lootPool, LOOT_PRICE } from '../gamify.js';

const GREET = () => {
  const h = new Date().getHours();
  return h < 5 ? ['Hyvää yötä!', t('Good night!')] : h < 10 ? ['Hyvää huomenta!', t('Good morning!')] : h < 17 ? ['Hyvää päivää!', t('Good day!')] : h < 22 ? ['Hyvää iltaa!', t('Good evening!')] : ['Hyvää yötä!', t('Good night!')];
};
// a function, so the tips are translated when the page is built
const TIPS = () => [
  ['Sano ääneen!', t('Say every answer out loud. Speaking doubles the memory trace.')],
  ['Pieni päivässä', t('Short and daily beats long and weekly. 15 minutes a day is the sweet spot.')],
  ['Virheet ovat hyviä', t('Mistakes are good: a failed recall followed by the answer is one of the strongest ways to learn.')],
  ['Kuuntele', t('Put on Yle Selkouutiset or a podcast while cooking. Understanding 50% is fine.')],
  ['Kerää sanoja', t('Tap any Finnish word in the app and save it. Words you choose yourself stick better.')],
  ['Puoli neljä = 3:30', t('"Half four" in Finnish is half-way TO four. Classic trap!')],
];

/** "Good night!" + Thomas → "Good night, Thomas!" (also "¡Buenas noches, Thomas!") */
const withName = (greet, name) => /[!.]$/.test(greet) ? greet.replace(/([!.])$/, `, ${name}$1`) : `${greet}, ${name}`;
export function renderHome(el) {
  const S = store.state(), goal = S.profile.goal, dxp = store.dayRec().xp, pct = Math.min(1, dxp / goal);
  const [g, gEn] = GREET(), mix = mixSummary(), cur = currentLesson(), mod = MODULE_BY_ID[cur.mod];
  const tips = TIPS(), tip = tips[new Date().getDate() % tips.length];
  const qs = quests();
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const R = 52, C = 2 * Math.PI * R;
  el.innerHTML = `
  <section class="hero">
    <div class="hero-m">${mascotSVG(undefined, { size: 72, mood: pct >= 1 ? 'wow' : 'happy' })}</div>
    <div class="greet"><b class="fi">${fw(g)}</b><span>${S.profile.name ? withName(gEn, esc(S.profile.name)) : gEn}</span></div>
    <div class="lang-pick"><button class="lang-flag" id="lang-btn" aria-label="${t('Your language')}" aria-expanded="false">${flagSVG(lang())}</button>
      <div class="lang-menu" id="lang-menu" hidden>${Object.entries(LANGS).map(([k, n]) => `<button class="${k === lang() ? 'on' : ''}" data-lang="${k}"><span class="lang-flag sm">${flagSVG(k)}</span>${n}</button>`).join('')}</div></div>
  </section>

  <section class="card today">
    <div class="today-h">
      <div class="today-t"><div class="eyebrow">${t("Today's practice")}</div><h2 class="fi">Päivän treeni</h2>
        <p>${[mix.due ? (mix.due > 1 ? t('{n} reviews', { n: mix.due }) : t('{n} review', { n: mix.due })) : '', mix.fresh ? t('{n} new', { n: mix.fresh }) : '', t('grammar')].filter(Boolean).join(' · ')}</p></div>
      <div class="ring ${pct >= 1 ? 'met' : ''}"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="${R}" class="rbg"/><circle cx="60" cy="60" r="${R}" class="rfg" style="stroke-dasharray:${C};stroke-dashoffset:${C * (1 - pct)}"/></svg>
        <div class="ring-t"><b>${store.fmtXp(dxp)}</b><span>/ ${goal} XP</span></div></div>
    </div>
    <button class="btn big-btn" id="mix">${icon('play')} ${pct >= 1 ? t('Keep going') : t('Start')}</button>
  </section>

  <a class="card cont" href="#/lesson/${cur.id}" style="--mc:${mod.color}">
    <div class="cont-ico">${icon(cur.icon)}</div>
    <div class="cont-b"><div class="eyebrow">${t('Continue · Module {n}', { n: mod.n })}</div><b>${esc(lessonText(cur).title)}</b><div class="fi small muted">${esc(cur.fi)}</div>${wordBar(wordsKnown(cur))}</div>
    <span class="arrow">›</span>
  </a>

  <div class="quick">
    <button class="qk" data-m="sentences" style="--qc:#0a84ff"><span class="qk-i">${icon('bricks')}</span><b>${t('Say it in Finnish')}</b><small>${t('build sentences')}</small></button>
    <button class="qk" data-m="speed" style="--qc:#ff9f0a"><span class="qk-i">${icon('bolt')}</span><b>${t('Speed round')}</b><small>${t('60 seconds · best {n}', { n: S.best.speed || 0 })}</small></button>
    <button class="qk" data-m="match" style="--qc:#bf5af2"><span class="qk-i">${icon('grid')}</span><b>${t('Match pairs')}</b><small>${t('best {n}', { n: S.best.match ? S.best.match + ' s' : '–' })}</small></button>
    <button class="qk" data-m="listen" style="--qc:#64d2ff"><span class="qk-i">${icon('headphones')}</span><b>${t('Listening')}</b><small>${t('hear & write')}</small></button>
    <button class="qk" data-m="weak" style="--qc:#ff453a"><span class="qk-i">${icon('alert')}</span><b>${t('Weak words')}</b><small>${t('{n} to fix', { n: sourceWords('weak').length })}</small></button>
    <a class="qk" href="#/twisters" style="--qc:#30d158"><span class="qk-i">${icon('chat')}</span><b class="fi">Kielisolmut</b><small>${t('Tongue twisters')}</small></a>
  </div>

  <section class="card">
    <div class="row-h"><h3>${t('Daily quests')}</h3><span class="muted small">${t('reset at midnight')}</span></div>
    ${qs.map(q => `<div class="quest ${q.claimed ? 'done' : ''}"><div class="q-t">${q.claimed ? icon('check') : ''}${esc(q.title)}</div>
      <div class="q-bar"><div style="width:${q.prog / q.target * 100}%"></div></div><div class="q-r">${Math.floor(q.prog)}/${q.target} · ${icon('coin')}${q.coins}</div></div>`).join('')}
  </section>

  ${lootPool().length ? `<button class="card loot-home" id="loot"><span class="lh-ico">${icon('gift')}</span><div><b class="fi">Yllätyslaatikko</b><div class="muted small">${t("Surprise box: a random cosmetic you don't own · {n} left", { n: lootPool().length })}</div></div><span class="lh-p">${icon('coin')} ${LOOT_PRICE}</span></button>` : ''}
  <section class="card tip"><b class="fi">${icon('bulb')} ${esc(tip[0])}</b><p>${esc(tip[1])}</p></section>
  ${!hasFinnishVoice() && !hasNeuralAudio() ? `<section class="card warn-card"><b>${icon('mute')} ${t('No Finnish voice found')}</b><p class="small">${t("Pronunciation uses your device's voice. iPhone: Settings → Accessibility → Spoken Content → Voices → Finnish (Satu). Mac: System Settings → Accessibility → Spoken Content → System voice → Manage voices → Finnish.")}</p></section>` : ''}
  ${!standalone ? `<section class="card install"><b>${icon('phone')} ${t('Install SuomiT')}</b><p class="small">${t('iPhone: Safari → Share → <i>Add to Home Screen</i>. Mac: Safari → File → <i>Add to Dock</i>, or Chrome → Install. Works offline.')}</p></section>` : ''}
  `;
  // language: the flag opens a small menu; a new language reloads the app so every screen is built in it
  const lb = el.querySelector('#lang-btn'), lm = el.querySelector('#lang-menu');
  const closeMenu = e => { if (!e || !e.target.closest('.lang-pick')) { lm.hidden = true; lb.setAttribute('aria-expanded', 'false'); document.removeEventListener('pointerdown', closeMenu, true); } };
  lb.onclick = () => { lm.hidden = !lm.hidden; lb.setAttribute('aria-expanded', String(!lm.hidden)); if (!lm.hidden) document.addEventListener('pointerdown', closeMenu, true); else closeMenu(); };
  lm.querySelectorAll('[data-lang]').forEach(b => b.onclick = () => { if (b.dataset.lang === lang()) return closeMenu(); store.setProfile({ lang: b.dataset.lang }); store.flush(); location.reload(); });
  el.querySelector('#mix').onclick = () => {
    const m = dailyMix();
    if (!m.questions.length) return go('#/lesson/' + cur.id);
    runSession({ title: t('Daily mix'), questions: m.questions, mode: 'review', onClose: rerender, again: () => document.getElementById('mix')?.click() });
  };
  el.querySelector('#loot')?.addEventListener('click', () => openLootBox({ onClose: rerender }));
  el.querySelectorAll('[data-m]').forEach(b => b.onclick = () => {
    const m = b.dataset.m;
    const learned = sourceWords('learned');
    const pool = learned.length >= 12 ? learned : sourceWords('lesson:' + cur.id).concat(learned);
    if (m === 'match') return startMatch(pool);
    if (m === 'sentences') return runSession({ title: t('Say it in Finnish'), mode: 'drill', questions: sentenceQs(10), onClose: rerender, again: () => b.click() });
    if (m === 'speed') return runSession({ title: t('Speed round'), mode: 'speed', seconds: 60, questions: trainerQuestions(pool, 'speed'), onFinish: r => { if (r.ok > (S.best.speed || 0)) { S.best.speed = r.ok; store.save(); } if (r.ok >= 30) import('../gamify.js').then(g => g.unlock('speed30')); }, onClose: rerender, again: () => b.click() });
    if (m === 'listen') return runSession({ title: t('Listening'), mode: 'drill', questions: trainerQuestions(pool, 'listen', 12), onClose: rerender, again: () => b.click() });
    if (m === 'weak') { const w = sourceWords('weak'); return runSession({ title: t('Weak words'), mode: 'review', questions: trainerQuestions(w.length ? w : pool, 'smart', 15), onClose: rerender }); }
  });
}
