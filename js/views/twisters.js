// Kielisolmut (tongue twisters): their own page, with slow / normal / fast playback and two practice games.
import * as store from '../store.js';
import { TWISTERS } from '../../data/twisters.js';
import { icon } from '../icons.js';
import { esc, fw, shuffle } from '../ui.js';
import { speak, stopSpeaking } from '../audio.js';
import { runSession } from '../session.js';
import { rerender } from '../app.js';
import { t } from '../i18n.js';

const SPEEDS = [['slow', 0.55, 'slow'], ['normal', 0, 'speaker'], ['fast', 1.35, 'bolt']];
const speedName = k => ({ slow: t('Slow'), normal: t('Normal'), fast: t('Fast') })[k];
const clean = s => s.replace(/[.!?]+$/, '');

function tilesQ(tw) {
  const toks = clean(tw.fi).replace(/,/g, '').split(/\s+/);
  return { kind: 'tiles', prompt: `<div class="big">${esc(t(tw.en))}</div>`, sub: t('Build the tongue twister'), answer: toks.join(' '), tiles: shuffle(toks), say: tw.fi };
}
function listenQ(tw) {
  return { kind: 'type', listen: true, prompt: `<div class="big">${icon('headphones', 'xl')}</div>`, sub: t('Listen and write the tongue twister (tap the speaker again any time)'), answer: clean(tw.fi), say: tw.fi, reveal: t(tw.en) };
}

export function renderTwisters(el) {
  const S = store.state(), done = S.twisters || {};
  el.innerHTML = `<a class="back" href="#/read">‹ Lue</a>
    <h1 class="pg fi">Kielisolmut <span class="muted">· ${t('tongue twisters')}</span></h1>
    <p class="muted">${t('Pure pronunciation practice: long vs. short sounds, double consonants, ä/ö/y. Listen slowly, say it with the voice, then speed up. These never show up in your word reviews.')}</p>
    <div class="row-btns"><button class="btn" id="tw-build">${icon('bricks')} ${t('Build them')}</button><button class="btn ghost" id="tw-listen">${icon('headphones')} ${t('Listen & write')}</button></div>
    <div class="tw-list">${TWISTERS.map((tw, i) => `<div class="card tw ${done[i] ? 'done' : ''}" data-i="${i}">
      <div class="tw-h"><b class="fi">${fw(tw.fi)}</b>${done[i] ? `<span class="tw-ok">${icon('check')}</span>` : ''}</div>
      <div class="muted small">${esc(t(tw.en))} · <i>${esc(t(tw.focus))}</i></div>
      <div class="tw-btns">${SPEEDS.map(([k, , ic]) => `<button class="chip" data-sp="${k}">${icon(ic)} ${speedName(k)}</button>`).join('')}
        <button class="chip" data-said="1">${icon('check')} ${t('I said it 3× fast')}</button></div></div>`).join('')}</div>`;
  el.querySelectorAll('.tw').forEach(card => {
    const tw = TWISTERS[+card.dataset.i];
    card.querySelectorAll('[data-sp]').forEach(b => b.onclick = () => { const sp = SPEEDS.find(s => s[0] === b.dataset.sp); stopSpeaking(); speak(tw.fi, { rate: sp[1] || undefined }); });
    card.querySelector('[data-said]').onclick = () => {
      const T = (store.state().twisters ||= {}), first = !T[card.dataset.i];
      T[card.dataset.i] = Date.now();
      if (first) store.addXp(1.25);
      store.save(); rerender();
    };
  });
  const play = (make, title) => runSession({ title, mode: 'drill', questions: shuffle(TWISTERS).slice(0, 6).map(make), onClose: rerender, again: () => play(make, title) });
  el.querySelector('#tw-build').onclick = () => play(tilesQ, 'Kielisolmut: build');
  el.querySelector('#tw-listen').onclick = () => play(listenQ, 'Kielisolmut: listen');
}
