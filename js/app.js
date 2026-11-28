// SuomiT app shell: router, header, bottom nav, boot.
import * as store from './store.js';
import { setLang, t } from './i18n.js';
import { initViewport } from './viewport.js';
import { icon } from './icons.js';
import { applyTheme, claimQuests } from './gamify.js';
import { initWordTaps, closePop, toast } from './ui.js';
import { sfx, buzz } from './audio.js';
import { maybeShowTutorial } from './tutorial.js';
import { renderHome } from './views/home.js';
import { renderPath, renderLesson } from './views/path.js';
import { renderWords } from './views/words.js';
import { renderRead, renderStory } from './views/read.js';
import { renderMe, renderShop, renderSettings, renderAbout } from './views/me.js';
import { renderSet } from './practice.js';
import { renderTwisters } from './views/twisters.js';

const routes = [
  [/^\/?$|^\/home$/, renderHome, 'home'],
  [/^\/path$/, renderPath, 'path'],
  [/^\/lesson\/([\w-]+)(?:\/(\w+))?$/, renderLesson, 'path'],
  [/^\/words(?:\/(\w+))?(?:\/(.+))?$/, renderWords, 'words'],
  [/^\/read$/, renderRead, 'read'],
  [/^\/twisters$/, renderTwisters, 'read'],
  [/^\/read\/([\w-]+)$/, renderStory, 'read'],
  [/^\/set\/([\w-]+)\/(\d+)$/, renderSet, 'path'],
  [/^\/me$/, renderMe, 'me'],
  [/^\/shop$/, renderShop, 'me'],
  [/^\/settings$/, renderSettings, 'me'],
  [/^\/about$/, renderAbout, 'me'],
];
const NAV = [['home', '#/home', 'Koti', icon('home')], ['path', '#/path', 'Polku', icon('map')], ['words', '#/words', 'Sanat', icon('book')], ['read', '#/read', 'Lue', icon('read')], ['me', '#/me', 'Minä', icon('seal')]];

export function go(hash) { if (location.hash === hash) route(); else location.hash = hash; }
export function rerender() { route(true); }

function route(keepScroll) {
  closePop();
  const path = decodeURIComponent(location.hash.slice(1) || '/home');
  const main = document.getElementById('main');
  for (const [re, fn, tab] of routes) {
    const m = path.match(re);
    if (m) {
      const tabs = [...document.querySelectorAll('.nav a')];
      tabs.forEach(a => a.classList.toggle('on', a.dataset.tab === tab));
      document.querySelector('.nav')?.style.setProperty('--i', Math.max(0, tabs.findIndex(a => a.dataset.tab === tab)));
      const y = scrollY;
      main.innerHTML = '';
      fn(main, ...m.slice(1));
      // a new screen slides in softly (not on a re-render of the same screen)
      if (!keepScroll) { main.classList.remove('enter'); void main.offsetWidth; main.classList.add('enter'); }
      if (keepScroll) scrollTo(0, y); else scrollTo(0, 0);
      renderHeader();
      return;
    }
  }
  location.hash = '#/home';
}
export function renderHeader() {
  const S = store.state(), st = store.streak(), todayMet = (S.days[store.today()]?.xp || 0) >= S.profile.goal;
  document.getElementById('hdr').innerHTML = `
    <a href="#/home" class="logo">Suomi<span>T</span></a>
    <div class="hstats">
      <a href="#/me" class="hs streak ${todayMet ? 'lit' : ''}" title="${t('Streak')}">${icon('flame')}<b>${st}</b></a>
      <a href="#/shop" class="hs coins" title="Markkaa">${icon('coin')}<b>${store.coins()}</b></a>
      <a href="#/me" class="hs lvl" title="${t('Level')}">${icon('star')}<b>${store.level()}</b></a>
    </div>`;
}
/** Weak phones (little memory / few cores, not iPhones) get the "lite" look: same design, no live blur. */
function markLite() {
  const n = navigator, ios = /iPhone|iPad|iPod/.test(n.userAgent) || (n.platform === 'MacIntel' && n.maxTouchPoints > 1);
  if (!ios && ((n.deviceMemory && n.deviceMemory <= 3) || (n.hardwareConcurrency && n.hardwareConcurrency <= 4))) document.documentElement.classList.add('lite');
}
async function boot() {
  markLite();
  // the language pack must be loaded before anything renders (strings are translated as they are built)
  try { await setLang(store.state().profile.lang); } catch (e) { console.error('language pack', e); await setLang('en'); }
  applyTheme();
  document.getElementById('nav').innerHTML = '<span class="nav-lens" aria-hidden="true"></span>' + NAV.map(([tab, h, n, i]) => `<a href="${h}" data-tab="${tab}"><span>${i}</span><small>${n}</small></a>`).join('');
  initWordTaps();
  // every button and link answers a tap with a soft click (+ a light haptic tick). Answer buttons are left out:
  // they get the right/wrong sound instead.
  document.addEventListener('click', e => {
    const b = e.target.closest('button, a, .chip, label.tog, [role="button"]');
    if (!b || b.disabled || b.closest('.choice, [data-quiet]')) return;
    sfx('tap'); buzz('light');
  }, { capture: true });
  initViewport();
  const used = store.applyFreezes();
  if (used) setTimeout(() => toast(used > 1 ? t('A Sisu shield saved your streak ({n} days)', { n: used }) : t('A Sisu shield saved your streak ({n} day)', { n: used }), 'shield', 4000), 600);
  claimQuests();
  window.addEventListener('hashchange', () => route());
  store.subscribe(() => renderHeader());
  route();
  maybeShowTutorial();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    // the app is served from the offline cache; when a new version has been downloaded, switch to it, but never in
    // the middle of a practice session (then it happens the next time the app opens)
    const hadController = !!navigator.serviceWorker.controller;
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadController || reloaded || !document.getElementById('session').hidden) return;
      reloaded = true; store.flush(); location.reload();
    });
    navigator.serviceWorker.register('sw.js').then(r => r.update?.()).catch(() => { });
    // voice clips saved by older versions move out of Cache Storage (they made every cold start slow on iPhone)
    setTimeout(() => import('./offline.js').then(m => m.migrateAudioCache()).catch(() => { }), 2500);
  }
}
if (typeof document.getElementById === 'function') boot(); // not when imported by the Node tools
