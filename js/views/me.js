import * as store from '../store.js';
import { icon } from '../icons.js';
import { esc, modal, toast, mascotSVG, fmtNum } from '../ui.js';
import { finnishVoices, speak, sfx } from '../audio.js';
import { THEMES, SHOP, ACH, owns, buy, equip, applyTheme, isEquipped, shopItem, cosmeticPreview, themeSwatch, lootBoxSVG, lootPool, openLootBox, LOOT_PRICE, COSMETICS } from '../gamify.js';
import { ANIMALS, ACCESSORIES, animalOf } from '../mascots.js';
import { SKILL_NAMES, SKILL_ICON } from '../exercises.js';
import { rerender, go } from '../app.js';
import { renderCalendar } from '../calendar.js';
import { offlineSupported, totalClips, cachedClips, downloadAllAudio, clearAudio } from '../offline.js';

export function renderMe(el) {
  const S = store.state(), xp = store.totalXp(), lv = store.level(xp), lo = store.levelXp(lv), hi = store.levelXp(lv + 1);
  const days = Object.values(S.days), ans = days.reduce((a, d) => a + (d.ans || 0), 0), okN = days.reduce((a, d) => a + (d.ok || 0), 0);
  const fc = store.forecast(7), fmax = Math.max(1, ...fc);
  const skills = Object.entries(S.skills).sort((a, b) => (a[1].acc || 0) - (b[1].acc || 0));
  el.innerHTML = `
    <section class="me-h">
      <a href="#/shop" class="me-m" title="${esc(petLabel())}">${mascotSVG(undefined, { size: 120 })}<span class="dress">${icon('shirt')} Dress up</span></a>
      <div><input class="name-in" placeholder="Your name" value="${esc(S.profile.name)}" maxlength="24">
        <div class="rank">${esc(store.rank(lv))}</div><div class="pet-name">${icon('heart')} ${esc(petLabel())}</div>
        <div class="lvl-bar"><div style="width:${(xp - lo) / (hi - lo) * 100}%"></div><span>Level ${lv} · ${xp - lo}/${hi - lo} XP</span></div></div>
    </section>
    <section class="stats4">
      <div><b>${icon('flame')} ${store.streak()}</b><span>streak</span></div><div><b>${icon('trophy')} ${store.bestStreak()}</b><span>best streak</span></div>
      <div><b>${icon('book')} ${store.learnedCount()}</b><span>words learned</span></div><div><b>${icon('sprout')} ${store.matureCount()}</b><span>long-term</span></div>
      <div><b>${icon('star')} ${fmtNum(xp)}</b><span>total XP</span></div><div><b>${icon('target')} ${ans ? Math.round(okN / ans * 100) : 0}%</b><span>accuracy</span></div>
      <div><b>${icon('shield')} ${store.freezesOwned()}</b><span>Sisu shields</span></div><div><b>${icon('coin')} ${store.coins()}</b><span>markkaa</span></div>
    </section>
    <section class="card"><h3>${icon('calendar')} Streak calendar</h3><div id="cal"></div></section>
    <section class="card"><h3>Reviews coming up</h3><div class="fc">${fc.map((n, i) => `<div><div class="fcb" style="height:${n / fmax * 100}%"></div><b>${n}</b><span>${i === 0 ? 'now' : i === 1 ? 'tmrw' : '+' + i}</span></div>`).join('')}</div></section>
    ${skills.length ? `<section class="card"><h3>Grammar skills</h3>${skills.map(([k, c]) => `<div class="skrow"><span>${icon(SKILL_ICON[k] || 'puzzle')} ${esc(SKILL_NAMES[k] || k)}</span><div class="mini-bar"><div style="width:${Math.round((c.acc || 0) * 100)}%"></div></div><b>${Math.round((c.acc || 0) * 100)}%</b></div>`).join('')}</section>` : ''}
    <section class="card"><h3>Achievements · ${Object.keys(S.ach).length}/${ACH.length}</h3><div class="achs">${ACH.map(a => `<div class="ach ${S.ach[a.id] ? 'on' : ''}" title="${esc(a.en)}"><span>${icon(a.icon)}</span><b>${esc(a.name)}</b><small>${esc(a.en)}</small></div>`).join('')}</div></section>
    <div class="grid2"><a class="tile-btn" href="#/shop"><span>${icon('bag')}</span><b>Kauppa</b><small>animals, themes & surprise boxes</small></a><a class="tile-btn" href="#/settings"><span>${icon('gear')}</span><b>Settings</b><small>goal, voice, sync</small></a></div>
    <a class="card story-link" href="#/about"><span>${icon('flask')}</span><div><b>Why SuomiT works</b><div class="muted small">The learning science behind the app</div></div><span class="arrow">›</span></a>`;
  renderCalendar(el.querySelector('#cal'));
  el.querySelector('.name-in').onchange = e => { store.setProfile({ name: e.target.value.trim() }); toast('Hei ' + (e.target.value.trim() || 'sinä') + '!', 'wave'); };
}

/** "Pip · sadekonna" for the current mascot. */
function petLabel() { const a = ANIMALS[animalOf(store.state().mascot)]; return `${a.name} · ${a.fi}`; }

// ------------------------------------------------------------ shop
const SHOP_TABS = [['animal', 'seal', 'Animals'], ['theme', 'palette', 'Themes'], ['hat', 'hat', 'Hats'], ['face', 'glasses', 'Glasses'], ['neck', 'scarf', 'Neck'], ['color', 'droplet', 'Colours'], ['freeze', 'shield', 'Power-ups']];
const TAB_KEY = 'suomit.shopTab';
let shopTab = null, tryOn = null; // tryOn: id of a locked item being previewed
const lockText = it => it.id === 'neck:mitali' ? 'Earn it with a 30-day streak' : 'Reward item';
function wornList(m) {
  return ['hat', 'face', 'neck'].map(k => m[k] && ACCESSORIES[k][m[k]]?.name).filter(Boolean);
}
export function renderShop(el, tab) {
  const S = store.state(), coins = store.coins();
  if (!shopTab) { try { shopTab = localStorage.getItem(TAB_KEY); } catch { } }
  shopTab = SHOP_TABS.some(t => t[0] === (tab || shopTab)) ? (tab || shopTab) : 'animal';
  const trying = tryOn && !owns(tryOn) ? shopItem(tryOn) : (tryOn = null);
  // live preview: current outfit, plus whatever is being tried on
  const m = { ...S.mascot };
  if (trying && trying.kind !== 'theme') m[trying.kind] = trying.id.split(':')[1];
  const a = ANIMALS[animalOf(m)];
  const worn = wornList(m);
  const pool = lootPool(), total = COSMETICS.length;
  const lootBtn = !pool.length ? `<button class="btn" disabled>${icon('trophy')} You own everything!</button>`
    : coins < LOOT_PRICE ? `<button class="btn" disabled>${icon('coin')} ${LOOT_PRICE} · need ${LOOT_PRICE - coins} more</button>`
      : `<button class="btn" id="loot">${icon('gift')} Open for ${icon('coin')} ${LOOT_PRICE}</button>`;
  const items = SHOP.filter(x => x.kind === shopTab).sort((x, y) => (x.price ?? 1e9) - (y.price ?? 1e9));
  const count = k => { const xs = COSMETICS.filter(x => x.kind === k); return `${xs.filter(x => owns(x.id)).length}/${xs.length}`; };
  el.innerHTML = `<a class="back" href="#/me">‹ Minä</a><h1 class="pg">Kauppa <span class="coins-big">${icon('coin')} ${coins}</span></h1>
    <section class="sh-hero card ${trying ? 'trying' : ''}">
      <div class="sh-stage">${trying?.kind === 'theme' ? themeSwatch(THEMES[trying.theme], 120) : ''}${mascotSVG(m, { size: trying?.kind === 'theme' ? 96 : 140 })}</div>
      <div class="sh-info">
        ${trying ? `<div class="sh-tag">${icon('sparkle')} Trying on</div><h3>${esc(trying.name)}</h3><p class="muted small">${esc(trying.en)}</p>`
      : `<div class="sh-tag">${icon('heart')} Your mascot</div><h3>${esc(a.name)} <span class="muted">· ${esc(a.fi)}</span></h3>
        <p class="muted small">${worn.length ? 'Wearing ' + worn.map(esc).join(', ') + '.' : 'Nothing on yet.'} Tap any item to try it on.</p>`}
      </div>
    </section>
    <section class="loot-card">
      <div class="loot-art">${lootBoxSVG(96)}</div>
      <div class="loot-txt"><h3>Yllätyslaatikko</h3>
        <p class="small">Surprise box: one random item you don't own yet. Every item has the same chance.</p>
        <p class="muted small">${pool.length ? `${pool.length} of ${total} items still to find` : 'Kokoelma täynnä: your collection is complete.'}</p>
        ${lootBtn}</div>
    </section>
    <nav class="tabs shop-tabs" role="tablist">${SHOP_TABS.map(([k, ic, n]) => `<button role="tab" aria-selected="${k === shopTab}" class="${k === shopTab ? 'on' : ''}" data-tab="${k}">${icon(ic)} ${n}${k === 'freeze' ? '' : ` <small>${count(k)}</small>`}</button>`).join('')}</nav>
    ${shopTab === 'freeze' ? `<p class="muted small">You have ${store.freezesOwned()} of 3 Sisu shields. A shield is used automatically when you miss a day.</p>` : ''}
    <div class="shop">${items.map(it => {
    const own = it.kind !== 'freeze' && owns(it.id), eq = isEquipped(it), sel = trying?.id === it.id;
    const price = eq ? `${icon('check')} ${it.kind === 'theme' || it.kind === 'color' || it.kind === 'animal' ? 'using' : 'wearing'}`
      : own ? (it.kind === 'theme' || it.kind === 'color' ? 'use' : it.kind === 'animal' ? 'choose' : 'wear')
        : it.price == null ? `${icon('lock')} ${lockText(it)}` : `${icon('coin')} ${it.price}`;
    return `<button class="item ${own ? 'own' : 'locked'} ${eq ? 'eq' : ''} ${sel ? 'sel' : ''}" data-id="${it.id}">${cosmeticPreview(it, 78, S.mascot)}<b>${esc(it.name)}</b><small>${esc(it.en)}</small>
        <span class="price">${price}</span></button>`;
  }).join('')}</div>
    ${trying ? `<div class="try-bar">${trying.kind === 'theme' ? themeSwatch(THEMES[trying.theme], 52) : mascotSVG(m, { size: 56 })}<div><b>${esc(trying.name)}</b><small>${trying.price == null ? esc(lockText(trying)) + ' (or find it in a surprise box)' : coins >= trying.price ? 'Like it?' : `You need ${trying.price - coins} more markkaa`}</small></div>
      <button class="btn ghost sm" id="untry">Cancel</button>${trying.price == null ? '' : `<button class="btn sm" id="buy" ${coins < trying.price ? 'disabled' : ''}>Buy ${icon('coin')} ${trying.price}</button>`}</div>` : ''}`;

  el.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => {
    shopTab = b.dataset.tab; tryOn = null; try { localStorage.setItem(TAB_KEY, shopTab); } catch { }
    sfx('tap'); renderShop(el);
  });
  el.querySelectorAll('.item').forEach(b => b.onclick = () => {
    const it = shopItem(b.dataset.id); if (!it) return;
    if (it.kind === 'freeze') { buy(it); return rerender(); }
    if (owns(it.id)) { tryOn = null; equip(it); sfx('tap'); return rerender(); }
    tryOn = tryOn === it.id ? null : it.id; sfx('flip');
    rerender();
  });
  el.querySelector('#untry')?.addEventListener('click', () => { tryOn = null; rerender(); });
  el.querySelector('#buy')?.addEventListener('click', () => {
    if (!buy(trying)) return;
    tryOn = null; equip(trying); rerender();
  });
  el.querySelector('#loot')?.addEventListener('click', () => { tryOn = null; openLootBox({ onClose: rerender }); });
}

export function renderSettings(el) {
  const S = store.state(), p = S.profile, voices = finnishVoices();
  el.innerHTML = `<a class="back" href="#/me">‹ Minä</a><h1 class="pg">Settings</h1>
    <section class="card set">
      <h3>Daily goal</h3><div class="chips">${[[20, 'Chill'], [50, 'Regular'], [100, 'Serious'], [150, 'Intense'], [250, 'Sisu']].map(([g, n]) => `<button class="chip ${p.goal === g ? 'on' : ''}" data-goal="${g}">${n} · ${g} XP</button>`).join('')}</div>
      <p class="muted small">50 XP ≈ 10–15 minutes. Consistency beats intensity.</p>
    </section>
    <section class="card set">
      <h3>Sound & voice</h3><p class="muted small">SuomiT plays recorded neural Finnish audio (voice: Noora). Anything without a recording uses your device's Finnish voice below.</p>
      <label class="tog"><span>Sound effects</span><input type="checkbox" data-p="sound" ${p.sound ? 'checked' : ''}></label>
      <label class="tog"><span>Vibration (Android)</span><input type="checkbox" data-p="haptics" ${p.haptics ? 'checked' : ''}></label>
      <label class="tog"><span>Speak words automatically</span><input type="checkbox" data-p="autoSpeak" ${p.autoSpeak ? 'checked' : ''}></label>
      <label class="fld"><span>Device voice (fallback)</span><select id="voice">${voices.length ? voices.map(v => `<option ${v.name === p.voice ? 'selected' : ''}>${esc(v.name)}</option>`).join('') : '<option>No Finnish voice installed</option>'}</select></label>
      <label class="fld"><span>Speaking speed · <b id="rv">${p.rate}</b></span><input type="range" min="0.5" max="1.2" step="0.05" value="${p.rate}" id="rate"></label>
      <button class="btn sm ghost" id="test">${icon('speaker')} Test: “Hyvää huomenta, mitä kuuluu?”</button>
    </section>
    <section class="card set">
      <h3>Checking</h3>
      <label class="tog"><span>Strict ä/ö (a missing dot counts as wrong)</span><input type="checkbox" data-p="strictDots" ${p.strictDots ? 'checked' : ''}></label>
      <p class="muted small">Off: <i>paiva</i> for <i>päivä</i> is accepted with a warning. Doubled letters are always strict: <i>kisa</i> ≠ <i>kissa</i>.</p>
    </section>
    <section class="card set" id="offline">
      <h3>${icon('download')} Offline</h3>
      <p class="small">The app, all lessons, drills, stories and practice sets work offline once SuomiT has been opened. Voice clips are saved as you hear them; download them all to have every pronunciation offline (about 120 MB). Videos and outside links always need internet.</p>
      <div class="off-stat small muted">Checking…</div>
      <div class="off-bar mini-bar" hidden><div style="width:0"></div></div>
      <div class="row-btns"><button class="btn sm" id="off-dl">${icon('download')} Download all audio</button><button class="btn sm ghost" id="off-rm">Remove downloaded audio</button></div>
    </section>
    <section class="card set">
      <h3>${icon('phone')} Sync phone ⇄ Mac</h3>
      <p class="small">No account needed. Copy your sync code on one device and paste it on the other. Progress is <b>merged</b>: nothing gets lost.</p>
      <div class="row-btns"><button class="btn" id="exp">Copy my sync code</button><button class="btn ghost" id="imp">Paste a code</button></div>
      <div class="row-btns"><button class="btn sm ghost" id="dl">${icon('download')} Download backup file</button><label class="btn sm ghost">${icon('upload')} Load backup file<input type="file" id="up" accept=".json,.txt" hidden></label></div>
    </section>
    <section class="card set danger-zone"><h3>Danger zone</h3><button class="btn sm danger" id="reset">Reset all progress</button></section>
    <p class="muted small center">SuomiT · made with sisu · data stays on your device</p>`;
  el.querySelectorAll('[data-goal]').forEach(b => b.onclick = () => { store.setProfile({ goal: +b.dataset.goal }); rerender(); });
  el.querySelectorAll('[data-p]').forEach(i => i.onchange = () => store.setProfile({ [i.dataset.p]: i.checked }));
  el.querySelector('#voice').onchange = e => store.setProfile({ voice: e.target.value });
  el.querySelector('#rate').oninput = e => { el.querySelector('#rv').textContent = e.target.value; store.setProfile({ rate: +e.target.value }); };
  el.querySelector('#test').onclick = () => speak('Hyvää huomenta, mitä kuuluu?');
  (async () => {
    const box = el.querySelector('#offline'); if (!box) return;
    const stat = box.querySelector('.off-stat'), bar = box.querySelector('.off-bar'), fill = bar.firstElementChild, dl = box.querySelector('#off-dl');
    if (!offlineSupported()) { stat.textContent = 'This browser does not support offline storage.'; dl.disabled = true; return; }
    const show = async () => { const n = await cachedClips(), t = totalClips(); stat.textContent = `Audio available offline: ${n.toLocaleString()} / ${t.toLocaleString()} clips${n >= t ? ' · complete' : ''}`; dl.disabled = n >= t; };
    await show();
    dl.onclick = async () => {
      dl.disabled = true; bar.hidden = false;
      try { navigator.storage?.persist?.(); } catch { }
      const r = await downloadAllAudio((d, t) => { fill.style.width = (d / t * 100) + '%'; stat.textContent = `Downloading audio… ${d.toLocaleString()} / ${t.toLocaleString()}`; });
      toast(r.failed ? `Done, ${r.failed} clips failed (try again)` : 'All audio is available offline', r.failed ? 'alert' : 'check', 3000);
      bar.hidden = true; show();
    };
    box.querySelector('#off-rm').onclick = async () => { if (!confirm('Remove all downloaded audio? Clips will download again as you use the app.')) return; await clearAudio(); show(); };
  })();
  el.querySelector('#exp').onclick = async () => {
    const code = await store.exportCode();
    try { await navigator.clipboard.writeText(code); toast('Sync code copied! Paste it on your other device.', 'copy', 3500); }
    catch { modal(`<h3>Your sync code</h3><textarea class="code" readonly>${esc(code)}</textarea><p class="muted small">Select all & copy.</p>`); }
    if (navigator.share && /iPhone|iPad|Android/.test(navigator.userAgent)) navigator.share({ title: 'SuomiT sync code', text: code }).catch(() => { });
  };
  el.querySelector('#imp').onclick = () => {
    const m = modal(`<h3>Paste sync code</h3><textarea class="code" placeholder="SUOMIT1.…"></textarea><button class="btn wide" id="go">Merge into this device</button>`);
    m.el.querySelector('#go').onclick = () => doImport(m.el.querySelector('textarea').value, m.close);
  };
  el.querySelector('#dl').onclick = async () => {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([await store.exportCode()], { type: 'text/plain' }));
    a.download = `suomit-backup-${store.today()}.txt`; a.click();
  };
  el.querySelector('#up').onchange = async e => { const f = e.target.files[0]; if (f) doImport(await f.text()); };
  el.querySelector('#reset').onclick = () => { if (confirm('Delete ALL progress on this device? This cannot be undone.') && confirm('Really sure?')) { store.resetAll(); applyTheme(); go('#/home'); } };
}
async function doImport(code, done) {
  try { const data = await store.decodeCode(code); store.merge(data); applyTheme(); toast('Progress merged!', 'check', 3000); done?.(); rerender(); }
  catch (e) { toast('That code did not work: ' + e.message, 'alert', 4000); }
}

export function renderAbout(el) {
  el.innerHTML = `<a class="back" href="#/me">‹ Minä</a><h1 class="pg">Why SuomiT works</h1>
  ${[
      [icon('grid') + ' Retrieval practice', 'You learn by pulling answers out of memory, not by re-reading. Almost every screen asks you to recall, type or say something.'],
      [icon('calendar') + ' Spaced repetition (FSRS-6)', 'Every word has its own memory model. SuomiT schedules a review right before you would forget, aiming for 90% recall. The Daily mix does this for you.'],
      [icon('swap') + ' Interleaving', 'Sessions mix vocabulary with different grammar skills. It feels harder, but mixed practice sticks far better than blocks of the same thing.'],
      [icon('pen') + ' Production over recognition', 'New words start as multiple choice, then graduate to typing and dictation as they get stronger.'],
      [icon('flag') + ' Finnish-specific drills', 'Vowel harmony, kpt-gradation, the partitive, local cases, verb types and the clock are drilled with generated questions until they become automatic.'],
      [icon('headphones') + ' Sound first', 'Length and dots change meaning (tuli/tuuli, kisa/kissa), so SuomiT is strict about them and speaks every answer aloud.'],
      [icon('read') + ' Comprehensible input', 'Graded stories, tap-to-translate everywhere, and the best free Finnish media from your course.'],
      [icon('flame') + ' Habit, not punishment', 'Streaks, quests and rewards keep you coming back, but mistakes never cost you anything. Mistakes are how the scheduler learns what to repeat.'],
    ].map(([h, p]) => `<section class="card"><h3>${h}</h3><p>${p}</p></section>`).join('')}
  <section class="card"><h3>${icon('calendar')} The 20-minute routine</h3><ol><li>Daily mix (reviews + new words + grammar)</li><li>One lesson or one grammar drill</li><li>5 minutes of Finnish input: Selkouutiset, a story or a podcast</li><li>Say every answer out loud</li></ol></section>
  <p class="muted small">Course structure follows the Basic Finnish Club modules. All explanations, exercises and stories are original SuomiT content; linked resources belong to their creators. Full write-up with sources: <a href="https://github.com/pipeli-prog/suomit/blob/main/LEARNING_SCIENCE.md" target="_blank" rel="noopener">LEARNING_SCIENCE.md</a>.</p>`;
}
