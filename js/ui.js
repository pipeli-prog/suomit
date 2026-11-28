// UI helpers: escaping, markup, tap-to-translate, popovers, modals, toasts, confetti, mascot.
import { WORD_RE } from './fi.js';
import { icon } from './icons.js';
import { t, lang, LANGS } from './i18n.js';
import { lookup } from './lexicon.js';
import { speak, sfx } from './audio.js';
/** The built-in list is shown in the learner's language until they rename it (same rule as views/words.js listName). */
const listLabel = l => l.id === 'mine' && l.name === 'My words' ? t('My words') : l.name;
import * as store from './store.js';

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const pick = a => a[Math.floor(Math.random() * a.length)];
export const sample = (a, n) => shuffle(a).slice(0, n);

/** Wrap Finnish words so they can be tapped for translation. */
export { fw, fwIf } from './lexicon.js';
/** Lesson markup → HTML. *fi*, **bold**, |table|, > tip */
export function md(src) {
  const inline = s => esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/\*(.+?)\*/g, (_, t) => `<span class="fi">${t.replace(WORD_RE, m => lookup(m) ? `<span class="fw">${m}</span>` : m)}</span>`);
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
  wrap.innerHTML = `<div class="modal ${cls}" role="dialog" aria-modal="true"><button class="x" aria-label="${esc(t('Close'))}">✕</button>${html}</div>`;
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
  const forms = e?.gen ? `<div class="forms"><span>${t('gen')} <b>${e.gen}</b></span><span>${t('part')} <b>${e.part}</b></span>${e.pl ? `<span>${t('pl')} <b>${e.pl}</b></span>` : ''}</div>` : '';
  pop.innerHTML = e ? `
    <div class="pop-h"><button class="spk" data-say="${esc(word)}">${icon('speaker')}</button><div><div class="pop-fi">${esc(word)}${e.fi.toLowerCase() !== word.toLowerCase() ? ` <span class="lemma">← ${esc(e.fi)}</span>` : ''}</div>
    <div class="pop-en">${esc(e.en)}</div>${e.note ? `<div class="pop-note">${esc(e.note)}</div>` : ''}</div></div>${forms}
    <div class="pop-a">${id ? listButtons(id) : `<button class="btn sm" data-addc="${esc(e.fi)}" data-en="${esc(e.en)}">＋ ${t('Add to my words')}</button>`}</div>`
    : `<div class="pop-h"><button class="spk" data-say="${esc(word)}">${icon('speaker')}</button><div><div class="pop-fi">${esc(word)}</div><div class="pop-en muted">${t("Not in SuomiT's dictionary yet")}</div></div></div>
    <div class="pop-a"><button class="btn sm" data-addc="${esc(word)}">＋ ${t('Add with my own translation')}</button>
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
  return lists.map(l => `<button class="chip ${store.inList(l.id, id) ? 'on' : ''}" data-tog="${l.id}" data-id="${esc(id)}">${store.inList(l.id, id) ? '✓' : '＋'} ${esc(listLabel(l))}</button>`).join('');
}
function wirePop(p) {
  p.addEventListener('click', ev => {
    const b = ev.target.closest('button'); if (!b) return;
    if (b.dataset.say) speak(b.dataset.say);
    if (b.dataset.tog) {
      const added = store.toggleList(b.dataset.tog, b.dataset.id);
      b.classList.toggle('on', added); b.textContent = (added ? '✓ ' : '＋ ') + store.state().lists.find(l => l.id === b.dataset.tog).name;
      sfx('tap'); if (added) toast(t('Added to your list'), 'pin', 1400);
    }
    if (b.dataset.addc != null) { closePop(); addCustomDialog(b.dataset.addc, b.dataset.en || ''); }
  });
}
export function addCustomDialog(fi = '', en = '') {
  // the meaning is typed in the learner's own language, so that field is labelled with the language's name
  const m = modal(`<h3>${t('Add a word')}</h3>
    <label class="fld"><span>Suomi</span><input id="cfi" value="${esc(fi)}" autocomplete="off" autocapitalize="off"></label>
    <label class="fld"><span>${LANGS[lang()]}</span><input id="cen" value="${esc(en)}" autocomplete="off" placeholder="${esc(t('your translation'))}"></label>
    <label class="fld"><span>${t('List')}</span><select id="clist">${store.state().lists.map(l => `<option value="${l.id}">${esc(listLabel(l))}</option>`).join('')}</select></label>
    <button class="btn wide" id="csave">${t('Save to list')}</button>`);
  const go = () => {
    const f = $('#cfi', m.el).value.trim(), e = $('#cen', m.el).value.trim();
    if (!f || !e) return toast(t('Fill in both fields'), 'pen');
    const ex = lookup(f);
    const id = ex?.id && ex.fi.toLowerCase() === f.toLowerCase() ? ex.id : store.addCustom(f, e);
    if (!store.inList($('#clist', m.el).value, id)) store.toggleList($('#clist', m.el).value, id);
    toast(t('“{word}” saved', { word: f }), 'pin'); m.close();
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
  const fab = document.createElement('button'); fab.className = 'sel-fab'; fab.textContent = '＋ ' + t('Add to my words'); fab.hidden = true;
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

// ------------------------------------------------------------ mascot (Nuppu the norppa and friends): drawn in mascots.js
export { mascotSVG, ACCESSORY_SVG, SEAL_COLORS } from './mascots.js';
export const fmtNum = n => n >= 10000 ? (n / 1000).toFixed(1).replace('.0', '') + 'k' : String(n);
