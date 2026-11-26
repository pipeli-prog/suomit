// UI helpers: escaping, markup, tap-to-translate, popovers, modals, toasts, confetti, mascot.
import { WORD_RE } from './fi.js';
import { icon } from './icons.js';
import { lookup } from './lexicon.js';
import { speak, sfx } from './audio.js';
import * as store from './store.js';

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const pick = a => a[Math.floor(Math.random() * a.length)];
export const sample = (a, n) => shuffle(a).slice(0, n);

/** Wrap Finnish words so they can be tapped for translation. */
export function fw(text) {
  return esc(text).replace(WORD_RE, m => `<span class="fw">${m}</span>`);
}
/** Lesson markup → HTML. *fi*, **bold**, |table|, > tip */
export function md(src) {
  const inline = s => esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/\*(.+?)\*/g, (_, t) => `<span class="fi">${t.replace(WORD_RE, m => `<span class="fw">${m}</span>`)}</span>`);
  const lines = src.split('\n'); let out = '', table = null;
  const flush = () => { if (table) { out += `<div class="tbl"><table>${table}</table></div>`; table = null; } };
  for (const raw of lines) {
    const l = raw.trim();
    if (l.startsWith('|')) {
      const cells = l.replace(/^\||\|$/g, '').split('|');
      table = (table || '') + '<tr>' + cells.map(c => `<td>${inline(c.trim())}</td>`).join('') + '</tr>';
      continue;
    }
    flush();
    if (!l) continue;
    if (l.startsWith('> ')) out += `<p class="tip">${icon('bulb')} ${inline(l.slice(2))}</p>`;
    else out += `<p>${inline(l)}</p>`;
  }
  flush();
  return out;
}

// ------------------------------------------------------------ toast & modal
export function toast(msg, ic = 'sparkle', ms = 2400) {
  const t = document.createElement('div');
  t.className = 'toast'; t.innerHTML = `<span class="ti">${icon(ic)}</span><span>${msg}</span>`;
  $('#toasts').appendChild(t);
  setTimeout(() => t.classList.add('out'), ms); setTimeout(() => t.remove(), ms + 400);
}
export function modal(html, { cls = '', onClose } = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'modal-wrap';
  wrap.innerHTML = `<div class="modal ${cls}" role="dialog" aria-modal="true"><button class="x" aria-label="Close">✕</button>${html}</div>`;
  document.body.appendChild(wrap);
  requestAnimationFrame(() => wrap.classList.add('in'));
  const close = () => { wrap.classList.remove('in'); setTimeout(() => wrap.remove(), 250); onClose?.(); };
  wrap.addEventListener('click', e => { if (e.target === wrap || e.target.closest('.x')) close(); });
  return { el: wrap.querySelector('.modal'), close };
}

// ------------------------------------------------------------ word popover (tap-to-translate + add to list)
let pop = null;
export function closePop() { pop?.remove(); pop = null; }
export function wordPopover(word, anchor) {
  closePop();
  const e = lookup(word);
  const id = e?.id;
  pop = document.createElement('div'); pop.className = 'pop';
  const forms = e?.gen ? `<div class="forms"><span>gen <b>${e.gen}</b></span><span>part <b>${e.part}</b></span>${e.pl ? `<span>pl <b>${e.pl}</b></span>` : ''}</div>` : '';
  pop.innerHTML = e ? `
    <div class="pop-h"><button class="spk" data-say="${esc(word)}">${icon('speaker')}</button><div><div class="pop-fi">${esc(word)}${e.fi.toLowerCase() !== word.toLowerCase() ? ` <span class="lemma">← ${esc(e.fi)}</span>` : ''}</div>
    <div class="pop-en">${esc(e.en)}</div>${e.note ? `<div class="pop-note">${esc(e.note)}</div>` : ''}</div></div>${forms}
    <div class="pop-a">${id ? listButtons(id) : `<button class="btn sm" data-addc="${esc(e.fi)}" data-en="${esc(e.en)}">＋ Add to my words</button>`}</div>`
    : `<div class="pop-h"><button class="spk" data-say="${esc(word)}">${icon('speaker')}</button><div><div class="pop-fi">${esc(word)}</div><div class="pop-en muted">Not in SuomiT's dictionary yet</div></div></div>
    <div class="pop-a"><button class="btn sm" data-addc="${esc(word)}">＋ Add with my own translation</button>
    <a class="btn sm ghost" target="_blank" rel="noopener" href="https://en.wiktionary.org/wiki/${encodeURIComponent(word.toLowerCase())}#Finnish">Wiktionary ↗</a></div>`;
  document.body.appendChild(pop);
  const r = anchor.getBoundingClientRect(), pw = Math.min(320, innerWidth - 24);
  pop.style.width = pw + 'px';
  pop.style.left = Math.max(12, Math.min(innerWidth - pw - 12, r.left + r.width / 2 - pw / 2)) + 'px';
  const below = r.bottom + 8, ph = pop.offsetHeight;
  pop.style.top = (below + ph < innerHeight - 10 ? below : Math.max(10, r.top - ph - 8)) + scrollY + 'px';
  if (store.state().profile.autoSpeak) speak(word);
  wirePop(pop);
}
function listButtons(id) {
  const lists = store.state().lists;
  return lists.map(l => `<button class="chip ${store.inList(l.id, id) ? 'on' : ''}" data-tog="${l.id}" data-id="${esc(id)}">${store.inList(l.id, id) ? '✓' : '＋'} ${esc(l.name)}</button>`).join('');
}
function wirePop(p) {
  p.addEventListener('click', ev => {
    const b = ev.target.closest('button'); if (!b) return;
    if (b.dataset.say) speak(b.dataset.say);
    if (b.dataset.tog) {
      const added = store.toggleList(b.dataset.tog, b.dataset.id);
      b.classList.toggle('on', added); b.textContent = (added ? '✓ ' : '＋ ') + store.state().lists.find(l => l.id === b.dataset.tog).name;
      sfx('tap'); if (added) toast('Added to your list', 'pin', 1400);
    }
    if (b.dataset.addc != null) { closePop(); addCustomDialog(b.dataset.addc, b.dataset.en || ''); }
  });
}
export function addCustomDialog(fi = '', en = '') {
  const m = modal(`<h3>Add a word</h3>
    <label class="fld"><span>Finnish</span><input id="cfi" value="${esc(fi)}" autocomplete="off" autocapitalize="off"></label>
    <label class="fld"><span>English</span><input id="cen" value="${esc(en)}" autocomplete="off" placeholder="your translation"></label>
    <label class="fld"><span>List</span><select id="clist">${store.state().lists.map(l => `<option value="${l.id}">${esc(l.name)}</option>`).join('')}</select></label>
    <button class="btn wide" id="csave">Save to list</button>`);
  const go = () => {
    const f = $('#cfi', m.el).value.trim(), e = $('#cen', m.el).value.trim();
    if (!f || !e) return toast('Fill in both fields', 'pen');
    const ex = lookup(f);
    const id = ex?.id && ex.fi.toLowerCase() === f.toLowerCase() ? ex.id : store.addCustom(f, e);
    if (!store.inList($('#clist', m.el).value, id)) store.toggleList($('#clist', m.el).value, id);
    toast(`“${f}” saved`, 'pin'); m.close();
  };
  $('#csave', m.el).onclick = go;
  setTimeout(() => (fi ? $('#cen', m.el) : $('#cfi', m.el)).focus(), 50);
}
export function initWordTaps() {
  document.addEventListener('click', e => {
    const w = e.target.closest('.fw');
    if (w && !w.closest('.no-tap')) { e.stopPropagation(); wordPopover(w.textContent, w); return; }
    if (pop && !e.target.closest('.pop')) closePop();
  }, true);
  window.addEventListener('scroll', closePop, { passive: true });
  // select any text → floating "add" button
  const fab = document.createElement('button'); fab.className = 'sel-fab'; fab.textContent = '＋ Add to my words'; fab.hidden = true;
  document.body.appendChild(fab);
  let selText = '';
  document.addEventListener('selectionchange', () => {
    const s = document.getSelection(); const t = s?.toString().trim();
    if (!t || t.length > 60 || s.anchorNode?.parentElement?.closest('input,textarea,.modal')) { fab.hidden = true; return; }
    selText = t; const r = s.getRangeAt(0).getBoundingClientRect();
    fab.hidden = false; fab.style.top = (r.bottom + scrollY + 10) + 'px'; fab.style.left = Math.max(10, Math.min(innerWidth - 190, r.left)) + 'px';
  });
  fab.addEventListener('pointerdown', e => e.preventDefault());
  fab.addEventListener('click', () => { fab.hidden = true; const e = lookup(selText); addCustomDialog(selText, e?.en || ''); document.getSelection().removeAllRanges(); });
}

// ------------------------------------------------------------ confetti
export function confetti(n = 120) {
  const c = document.createElement('canvas'); c.className = 'confetti';
  c.width = innerWidth * devicePixelRatio; c.height = innerHeight * devicePixelRatio; document.body.appendChild(c);
  const g = c.getContext('2d'); g.scale(devicePixelRatio, devicePixelRatio);
  const cols = ['#3ddc97', '#5ab0ff', '#ffd166', '#ff6f91', '#c58bff', '#ffffff'];
  const P = Array.from({ length: n }, () => ({ x: innerWidth / 2 + (Math.random() - .5) * 120, y: innerHeight * .35, vx: (Math.random() - .5) * 12, vy: -Math.random() * 13 - 4, r: Math.random() * 6 + 3, c: pick(cols), a: Math.random() * 6, va: (Math.random() - .5) * .3 }));
  let f = 0;
  (function tick() {
    g.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of P) { p.vy += .35; p.x += p.vx; p.y += p.vy; p.a += p.va; g.save(); g.translate(p.x, p.y); g.rotate(p.a); g.fillStyle = p.c; g.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); g.restore(); }
    if (++f < 150) requestAnimationFrame(tick); else c.remove();
  })();
}

// ------------------------------------------------------------ Nuppu the norppa (Saimaa ringed seal) mascot
export const SEAL_COLORS = { grey: ['#8e9aa8', '#b7c2cf', '#6e7a88'], sand: ['#c9a77c', '#e6cfa9', '#a3835a'], midnight: ['#3d4a6b', '#61719b', '#2a3450'], mint: ['#6fcfae', '#a8ead3', '#4aa688'], gold: ['#e8b53b', '#ffe08a', '#b8871b'], pink: ['#e99ab8', '#f8c9dc', '#c0708f'] };
const HATS = {
  pipo: `<path d="M30 44 Q60 4 90 44 Z" fill="#e63946"/><rect x="28" y="40" width="64" height="10" rx="5" fill="#f1faee"/><circle cx="60" cy="14" r="8" fill="#f1faee"/>`,
  tonttulakki: `<path d="M30 46 Q50 10 84 6 Q96 4 100 22 Q92 18 86 24 L90 46 Z" fill="#d62828"/><rect x="28" y="40" width="64" height="9" rx="4.5" fill="#fff"/><circle cx="100" cy="24" r="7" fill="#fff"/>`,
  saunahattu: `<path d="M34 44 L42 16 Q60 10 78 16 L86 44 Z" fill="#d9c3a0"/><path d="M26 44 Q60 36 94 44 Q60 52 26 44Z" fill="#c4aa82"/>`,
  kalastajahattu: `<path d="M36 40 Q38 16 60 16 Q82 16 84 40 Z" fill="#4f7d5b"/><path d="M24 42 Q60 30 96 42 L92 48 Q60 40 28 48 Z" fill="#3e6849"/>`,
  kukkaseppele: [24, 38, 52, 66, 80, 94].map((x, i) => `<circle cx="${x + 1}" cy="${42 - Math.sin((i / 5) * Math.PI) * 8}" r="7" fill="${['#ffd166', '#ff6f91', '#fff', '#c58bff', '#ffd166', '#ff6f91'][i]}"/><circle cx="${x + 1}" cy="${42 - Math.sin((i / 5) * Math.PI) * 8}" r="2.5" fill="#f4a261"/>`).join(''),
  ylioppilaslakki: `<path d="M34 42 Q60 18 86 42 Z" fill="#fff" stroke="#ddd"/><rect x="30" y="38" width="60" height="8" rx="3" fill="#111"/><circle cx="60" cy="30" r="3.5" fill="#e8b53b"/>`,
  kruunu: `<path d="M34 44 L36 18 L48 32 L60 12 L72 32 L84 18 L86 44 Z" fill="#ffd166" stroke="#e8a317" stroke-width="2"/><circle cx="60" cy="30" r="3" fill="#e63946"/><circle cx="45" cy="38" r="2.4" fill="#5ab0ff"/><circle cx="75" cy="38" r="2.4" fill="#3ddc97"/>`,
};
const FACES = {
  aurinkolasit: `<rect x="34" y="55" width="22" height="14" rx="6" fill="#111"/><rect x="64" y="55" width="22" height="14" rx="6" fill="#111"/><rect x="55" y="59" width="10" height="3" fill="#111"/><path d="M38 58 l6 0" stroke="#666" stroke-width="2"/>`,
  silmalasit: `<circle cx="46" cy="62" r="11" fill="none" stroke="#3a2a1a" stroke-width="2.5"/><circle cx="74" cy="62" r="11" fill="none" stroke="#3a2a1a" stroke-width="2.5"/><path d="M57 62 h6" stroke="#3a2a1a" stroke-width="2.5"/>`,
  sydanlasit: `<path d="M46 72 l-10-10 a6 6 0 0 1 10-7 a6 6 0 0 1 10 7z" fill="#ff4d8d"/><path d="M74 72 l-10-10 a6 6 0 0 1 10-7 a6 6 0 0 1 10 7z" fill="#ff4d8d"/><path d="M56 62 h8" stroke="#ff4d8d" stroke-width="2.5"/>`,
};
const NECKS = {
  huivi: `<path d="M24 92 Q60 104 96 92 L96 100 Q60 112 24 100 Z" fill="#457b9d"/><path d="M80 98 l6 18 l8 -4 l-6 -14z" fill="#1d3557"/>`,
  rusetti: `<path d="M60 98 l-14 -8 v16 z M60 98 l14 -8 v16 z" fill="#e63946"/><circle cx="60" cy="98" r="4" fill="#b5202d"/>`,
  mitali: `<path d="M50 88 l10 16 l10 -16" fill="none" stroke="#5ab0ff" stroke-width="5"/><circle cx="60" cy="108" r="8" fill="#ffd166" stroke="#e8a317" stroke-width="2"/><text x="60" y="111.5" font-size="9" text-anchor="middle" fill="#a86d00" font-weight="700">1</text>`,
};
export function mascotSVG(m = store.state().mascot, { size = 120, mood = 'happy' } = {}) {
  const [body, belly, dark] = SEAL_COLORS[m.color] || SEAL_COLORS.grey;
  const eyes = mood === 'sad'
    ? `<path d="M40 64 q6 -5 12 0" stroke="#1b1b1b" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M68 64 q6 -5 12 0" stroke="#1b1b1b" stroke-width="3" fill="none" stroke-linecap="round"/>`
    : `<circle cx="46" cy="62" r="7.5" fill="#1b1b1b"/><circle cx="74" cy="62" r="7.5" fill="#1b1b1b"/><circle cx="48.5" cy="59" r="2.6" fill="#fff"/><circle cx="76.5" cy="59" r="2.6" fill="#fff"/>`;
  const mouth = mood === 'wow' ? `<ellipse cx="60" cy="82" rx="4" ry="5" fill="#5a2a2a"/>` : `<path d="M54 80 q3 4 6 0 q3 4 6 0" stroke="#1b1b1b" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  return `<svg class="mascot" viewBox="0 0 120 120" width="${size}" height="${size}" aria-hidden="true">
    <ellipse cx="60" cy="114" rx="36" ry="4" fill="rgba(0,0,0,.18)"/>
    <ellipse cx="26" cy="100" rx="13" ry="7" transform="rotate(-25 26 100)" fill="${dark}"/>
    <ellipse cx="94" cy="100" rx="13" ry="7" transform="rotate(25 94 100)" fill="${dark}"/>
    <path d="M18 74 Q18 34 60 34 Q102 34 102 74 Q102 112 60 112 Q18 112 18 74Z" fill="${body}"/>
    <ellipse cx="60" cy="92" rx="26" ry="17" fill="${belly}" opacity=".75"/>
    <g fill="none" stroke="${dark}" stroke-width="2" opacity=".55"><ellipse cx="32" cy="80" rx="5" ry="3.5"/><ellipse cx="88" cy="84" rx="5" ry="3.5"/><ellipse cx="84" cy="46" rx="4" ry="3"/><ellipse cx="34" cy="48" rx="3.5" ry="2.6"/></g>
    ${eyes}
    <circle cx="38" cy="75" r="5" fill="#ff8fab" opacity=".45"/><circle cx="82" cy="75" r="5" fill="#ff8fab" opacity=".45"/>
    <ellipse cx="60" cy="73" rx="5" ry="3.6" fill="#2b2b2b"/>
    ${mouth}
    <g stroke="${dark}" stroke-width="1.4" stroke-linecap="round" opacity=".8"><path d="M48 76 l-14 -2"/><path d="M48 79 l-13 3"/><path d="M72 76 l14 -2"/><path d="M72 79 l13 3"/></g>
    ${m.face ? FACES[m.face] || '' : ''}${m.neck ? NECKS[m.neck] || '' : ''}${m.hat ? HATS[m.hat] || '' : ''}
  </svg>`;
}
export const ACCESSORY_SVG = { hat: HATS, face: FACES, neck: NECKS };
export const fmtNum = n => n >= 10000 ? (n / 1000).toFixed(1).replace('.0', '') + 'k' : String(n);
