// First-run tutorial: four short cards (language, the one daily button + goal, the course, tap-a-word).
// Shown once (profile.tutorial); Settings → "Show the tutorial again" replays it.
import * as store from './store.js';
import { t, lang, LANGS, flagSVG } from './i18n.js';
import { icon } from './icons.js';
import { mascotSVG } from './ui.js';

const GOALS = () => [[20, t('Chill')], [50, t('Regular')], [100, t('Serious')], [150, t('Intense')], [250, 'Sisu']];
const STEPS = () => [
  {
    art: mascotSVG(undefined, { size: 104, mood: 'happy' }), title: 'Tervetuloa!', fi: true,
    text: t('SuomiT teaches you Finnish in a few minutes a day. First: in which language should we explain things?'),
    extra: `<div class="tut-langs">${Object.entries(LANGS).map(([k, n]) => `<button class="${k === lang() ? 'on' : ''}" data-lang="${k}"><span class="lang-flag">${flagSVG(k)}</span>${n}</button>`).join('')}</div>`,
  },
  {
    art: icon('play'), title: t('One button a day'),
    text: t('Päivän treeni mixes the words you need to review, a few new ones and some grammar. Tap Start and SuomiT picks for you.'),
    extra: `<div class="eyebrow" style="margin-top:14px">${t('Your daily goal')}</div><div class="chips">${GOALS().map(([g, n]) => `<button class="chip ${store.state().profile.goal === g ? 'on' : ''}" data-goal="${g}">${n} · ${g} XP</button>`).join('')}</div>`,
  },
  {
    art: icon('map'), title: t('Your course, step by step'),
    text: t('In Polku every lesson explains one thing, then you practise it. The bar under a lesson shows how many of its words you know.'),
  },
  {
    art: icon('book'), title: t('Tap any Finnish word'),
    text: t('You see what it means and hear how it sounds. Save the ones you like to your word list.'),
    extra: `<p class="small">${t('Sounds and haptics can be switched off in Settings.')}</p>`,
  },
];

export function showTutorial(start = 0) {
  document.querySelector('.tut')?.remove();
  const wrap = document.createElement('div');
  wrap.className = 'tut'; wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-modal', 'true');
  document.body.appendChild(wrap);
  let i = start;
  const done = () => { store.setProfile({ tutorial: 1 }); wrap.remove(); };
  const draw = () => {
    const steps = STEPS(), s = steps[i], last = i === steps.length - 1;
    wrap.innerHTML = `<div class="tut-card"><div class="tut-step">
        <div class="tut-art">${s.art}</div>
        <h2 class="${s.fi ? 'fi' : ''}">${s.title}</h2><p>${s.text}</p>${s.extra || ''}
      </div>
      <div class="tut-foot"><div class="tut-dots">${steps.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div>
        ${last ? '' : `<button class="tut-skip">${t('Skip')}</button>`}
        <button class="btn" id="tut-next">${last ? 'Aloitetaan!' : t('Next')}</button></div></div>`;
    wrap.querySelector('#tut-next').onclick = () => { if (last) done(); else { i++; draw(); } };
    wrap.querySelector('.tut-skip')?.addEventListener('click', done);
    // a new language reloads the app; the tutorial comes back on this card in that language
    wrap.querySelectorAll('[data-lang]').forEach(b => b.onclick = () => {
      if (b.dataset.lang === lang()) return;
      store.setProfile({ lang: b.dataset.lang }); store.flush(); location.reload();
    });
    wrap.querySelectorAll('[data-goal]').forEach(b => b.onclick = () => {
      store.setProfile({ goal: +b.dataset.goal });
      wrap.querySelectorAll('[data-goal]').forEach(x => x.classList.toggle('on', x === b));
    });
  };
  draw();
}
export const maybeShowTutorial = () => { if (!store.state().profile.tutorial) showTutorial(); };
