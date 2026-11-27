// End-of-session reward chest: shakes, opens, and counts up the XP + markkaa you just earned.
import { sfx } from './audio.js';

const CHEST = `<svg class="chest-svg" viewBox="0 0 120 100" aria-hidden="true">
  <g class="lid"><path d="M14 44 Q14 18 60 18 Q106 18 106 44 Z" fill="var(--chest-a,#c7772e)" stroke="#5a3415" stroke-width="3"/>
    <path d="M14 44 Q14 18 60 18 Q106 18 106 44" fill="none" stroke="#ffd166" stroke-width="5" opacity=".9"/>
    <rect x="52" y="36" width="16" height="12" rx="3" fill="#ffd166" stroke="#5a3415" stroke-width="2.5"/></g>
  <rect x="14" y="44" width="92" height="46" rx="6" fill="var(--chest-b,#a8611f)" stroke="#5a3415" stroke-width="3"/>
  <rect x="14" y="58" width="92" height="7" fill="#ffd166" opacity=".85"/>
  <rect x="54" y="52" width="12" height="16" rx="3" fill="#ffd166" stroke="#5a3415" stroke-width="2.5"/>
  <g class="glow"><circle cx="60" cy="44" r="30" fill="#ffd166" opacity=".55"/></g>
</svg>`;

/** HTML for the chest block. r = session result {xp, coins}. */
export function chestHTML(r) {
  return `<div class="reward-chest" data-xp="${Math.round(r.xp || 0)}" data-coins="${r.coins || 0}">
    <button class="rc-box" aria-label="Open chest">${CHEST}<span class="rc-tap">Tap to open</span></button>
    <div class="rc-loot"><div class="rc-item xp"><b>+<span class="n">0</span></b><small>XP</small></div><div class="rc-item coins"><b>+<span class="n">0</span></b><small>markkaa</small></div></div>
  </div>`;
}
function countUp(el, to, ms = 700) {
  const t0 = performance.now();
  const step = t => { const p = Math.min(1, (t - t0) / ms); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
/** Wire the chest inside `root`; it auto-opens after a short shake if not tapped. */
export function wireChest(root) {
  const c = root.querySelector('.reward-chest'); if (!c) return;
  let opened = false;
  const open = () => {
    if (opened) return; opened = true;
    c.classList.add('open'); sfx('coin');
    setTimeout(() => { c.classList.add('show'); countUp(c.querySelector('.xp .n'), +c.dataset.xp); countUp(c.querySelector('.coins .n'), +c.dataset.coins); sfx('win'); }, 350);
  };
  c.querySelector('.rc-box').onclick = open;
  setTimeout(() => c.classList.add('shake'), 300);
  setTimeout(open, 1600);
}
