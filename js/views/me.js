import * as store from '../store.js';
import { t, tx, LANGS } from '../i18n.js';
import { icon } from '../icons.js';
import { esc, modal, toast, mascotSVG, fmtNum } from '../ui.js';
import { finnishVoices, speak, sfx } from '../audio.js';
import { THEMES, SHOP, ACH, owns, buy, equip, applyTheme, isEquipped, shopItem, cosmeticPreview, themeSwatch, lootBoxSVG, lootPool, openLootBox, LOOT_PRICE, COSMETICS, itemName, itemDesc, achDesc } from '../gamify.js';
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
      <a href="#/shop" class="me-m" title="${esc(petLabel())}">${mascotSVG(undefined, { size: 120 })}<span class="dress">${icon('shirt')} ${t('Dress up')}</span></a>
      <div><input class="name-in" placeholder="${esc(t('Your name'))}" value="${esc(S.profile.name)}" maxlength="24">
        <div class="rank">${esc(store.rank(lv))}</div><div class="pet-name">${icon('heart')} ${esc(petLabel())}</div>
        <div class="lvl-bar"><div style="width:${(xp - lo) / (hi - lo) * 100}%"></div><span>${t('Level {n} · {xp}/{next} XP', { n: lv, xp: store.fmtXp(xp - lo), next: hi - lo })}</span></div></div>
    </section>
    <section class="stats4">
      <div><b>${icon('flame')} ${store.streak()}</b><span>${t('streak')}</span></div><div><b>${icon('trophy')} ${store.bestStreak()}</b><span>${t('best streak')}</span></div>
      <div><b>${icon('book')} ${store.learnedCount()}</b><span>${t('words learned')}</span></div><div><b>${icon('sprout')} ${store.matureCount()}</b><span>${t('long-term')}</span></div>
      <div><b>${icon('star')} ${fmtNum(store.fmtXp(xp))}</b><span>${t('total XP')}</span></div><div><b>${icon('target')} ${ans ? Math.round(okN / ans * 100) : 0}%</b><span>${t('accuracy')}</span></div>
      <div><b>${icon('shield')} ${store.freezesOwned()}</b><span>${t('Sisu shields')}</span></div><div><b>${icon('coin')} ${store.coins()}</b><span>markkaa</span></div>
    </section>
    <section class="card"><h3>${icon('calendar')} ${t('Streak calendar')}</h3><div id="cal"></div></section>
    <section class="card"><h3>${t('Reviews coming up')}</h3><div class="fc">${fc.map((n, i) => `<div><div class="fcb" style="height:${n / fmax * 100}%"></div><b>${n}</b><span>${i === 0 ? t('now') : i === 1 ? t('tmrw') : '+' + i}</span></div>`).join('')}</div></section>
    ${skills.length ? `<section class="card"><h3>${t('Grammar skills')}</h3>${skills.map(([k, c]) => `<div class="skrow"><span>${icon(SKILL_ICON[k] || 'puzzle')} ${esc(SKILL_NAMES[k] || k)}</span><div class="mini-bar"><div style="width:${Math.round((c.acc || 0) * 100)}%"></div></div><b>${Math.round((c.acc || 0) * 100)}%</b></div>`).join('')}</section>` : ''}
    <section class="card"><h3>${t('Achievements')} · ${Object.keys(S.ach).length}/${ACH.length}</h3><div class="achs">${ACH.map(a => `<div class="ach ${S.ach[a.id] ? 'on' : ''}" title="${esc(achDesc(a))}"><span>${icon(a.icon)}</span><b>${esc(a.name)}</b><small>${esc(achDesc(a))}</small></div>`).join('')}</div></section>
    <div class="grid2"><a class="tile-btn" href="#/shop"><span>${icon('bag')}</span><b>Kauppa</b><small>${t('animals, themes & surprise boxes')}</small></a><a class="tile-btn" href="#/settings"><span>${icon('gear')}</span><b>${t('Settings')}</b><small>${t('goal, voice, sync')}</small></a></div>
    <a class="card story-link" href="#/about"><span>${icon('flask')}</span><div><b>${t('Why SuomiT works')}</b><div class="muted small">${t('The learning science behind the app')}</div></div><span class="arrow">›</span></a>`;
  renderCalendar(el.querySelector('#cal'));
  el.querySelector('.name-in').onchange = e => { store.setProfile({ name: e.target.value.trim() }); toast('Hei ' + (e.target.value.trim() || 'sinä') + '!', 'wave'); };
}

/** "Pip · sammakko" for the current mascot. */
function petLabel() { const a = ANIMALS[animalOf(store.state().mascot)]; return `${a.name} · ${a.fi}`; }

// ------------------------------------------------------------ shop
const SHOP_TABS = () => [['animal', 'seal', t('Animals')], ['theme', 'palette', t('Themes')], ['hat', 'hat', t('Hats')], ['face', 'glasses', t('Glasses')], ['neck', 'scarf', t('Neck')], ['color', 'droplet', t('Colours')], ['freeze', 'shield', t('Power-ups')]];
const TAB_KEY = 'suomit.shopTab';
let shopTab = null, tryOn = null; // tryOn: id of a locked item being previewed
const lockText = it => it.id === 'neck:mitali' ? t('Earn it with a 30-day streak') : t('Reward item');
function wornList(m) {
  return ['hat', 'face', 'neck'].map(k => m[k] && ACCESSORIES[k][m[k]]?.name).filter(Boolean);
}
export function renderShop(el, tab) {
  const S = store.state(), coins = store.coins();
  if (!shopTab) { try { shopTab = localStorage.getItem(TAB_KEY); } catch { } }
  const tabs = SHOP_TABS();
  shopTab = tabs.some(x => x[0] === (tab || shopTab)) ? (tab || shopTab) : 'animal';
  const trying = tryOn && !owns(tryOn) ? shopItem(tryOn) : (tryOn = null);
  // live preview: current outfit, plus whatever is being tried on
  const m = { ...S.mascot };
  if (trying && trying.kind !== 'theme') m[trying.kind] = trying.id.split(':')[1];
  const a = ANIMALS[animalOf(m)];
  const worn = wornList(m);
  const pool = lootPool(), total = COSMETICS.length;
  const lootBtn = !pool.length ? `<button class="btn" disabled>${icon('trophy')} ${t('You own everything!')}</button>`
    : coins < LOOT_PRICE ? `<button class="btn" disabled>${icon('coin')} ${LOOT_PRICE} · ${t('need {n} more', { n: LOOT_PRICE - coins })}</button>`
      : `<button class="btn" id="loot">${icon('gift')} ${t('Open for {price}', { price: `${icon('coin')} ${LOOT_PRICE}` })}</button>`;
  const items = SHOP.filter(x => x.kind === shopTab).sort((x, y) => (x.price ?? 1e9) - (y.price ?? 1e9));
  const count = k => { const xs = COSMETICS.filter(x => x.kind === k); return `${xs.filter(x => owns(x.id)).length}/${xs.length}`; };
  el.innerHTML = `<a class="back" href="#/me">‹ Minä</a><h1 class="pg">Kauppa <span class="coins-big">${icon('coin')} ${coins}</span></h1>
    <section class="sh-hero card ${trying ? 'trying' : ''}">
      <div class="sh-stage">${trying?.kind === 'theme' ? themeSwatch(THEMES[trying.theme], 120) : ''}${mascotSVG(m, { size: trying?.kind === 'theme' ? 96 : 140 })}</div>
      <div class="sh-info">
        ${trying ? `<div class="sh-tag">${icon('sparkle')} ${t('Trying on')}</div><h3>${esc(itemName(trying))}</h3><p class="muted small">${esc(itemDesc(trying))}</p>`
      : `<div class="sh-tag">${icon('heart')} ${t('Your mascot')}</div><h3>${esc(a.name)} <span class="muted">· ${esc(a.fi)}</span></h3>
        <p class="muted small">${worn.length ? t('Wearing {items}.', { items: worn.map(esc).join(', ') }) : t('Nothing on yet.')} ${t('Tap any item to try it on.')}</p>`}
      </div>
    </section>
    <section class="loot-card">
      <div class="loot-art">${lootBoxSVG(96)}</div>
      <div class="loot-txt"><h3>Yllätyslaatikko</h3>
        <p class="small">${t("Surprise box: one random item you don't own yet. Every item has the same chance.")}</p>
        <p class="muted small">${pool.length ? t('{n} of {total} items still to find', { n: pool.length, total }) : 'Kokoelma täynnä: ' + t('your collection is complete.')}</p>
        ${lootBtn}</div>
    </section>
    <nav class="tabs shop-tabs" role="tablist">${tabs.map(([k, ic, n]) => `<button role="tab" aria-selected="${k === shopTab}" class="${k === shopTab ? 'on' : ''}" data-tab="${k}">${icon(ic)} ${n}${k === 'freeze' ? '' : ` <small>${count(k)}</small>`}</button>`).join('')}</nav>
    ${shopTab === 'freeze' ? `<p class="muted small">${t('You have {n} of 3 Sisu shields. A shield is used automatically when you miss a day.', { n: store.freezesOwned() })}</p>` : ''}
    <div class="shop">${items.map(it => {
    const own = it.kind !== 'freeze' && owns(it.id), eq = isEquipped(it), sel = trying?.id === it.id;
    const price = eq ? `${icon('check')} ${it.kind === 'theme' || it.kind === 'color' || it.kind === 'animal' ? t('using') : t('wearing')}`
      : own ? (it.kind === 'theme' || it.kind === 'color' ? t('use') : it.kind === 'animal' ? t('choose') : t('wear'))
        : it.price == null ? `${icon('lock')} ${lockText(it)}` : `${icon('coin')} ${it.price}`;
    return `<button class="item ${own ? 'own' : 'locked'} ${eq ? 'eq' : ''} ${sel ? 'sel' : ''}" data-id="${it.id}">${cosmeticPreview(it, 78, S.mascot)}<b>${esc(itemName(it))}</b><small>${esc(itemDesc(it))}</small>
        <span class="price">${price}</span></button>`;
  }).join('')}</div>
    ${trying ? `<div class="try-bar">${trying.kind === 'theme' ? themeSwatch(THEMES[trying.theme], 52) : mascotSVG(m, { size: 56 })}<div><b>${esc(itemName(trying))}</b><small>${trying.price == null ? t('{reason} (or find it in a surprise box)', { reason: esc(lockText(trying)) }) : coins >= trying.price ? t('Like it?') : t('You need {n} more markkaa', { n: trying.price - coins })}</small></div>
      <button class="btn ghost sm" id="untry">${t('Cancel')}</button>${trying.price == null ? '' : `<button class="btn sm" id="buy" ${coins < trying.price ? 'disabled' : ''}>${t('Buy {price}', { price: `${icon('coin')} ${trying.price}` })}</button>`}</div>` : ''}`;

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
  el.innerHTML = `<a class="back" href="#/me">‹ Minä</a><h1 class="pg">${t('Settings')}</h1>
    <section class="card set">
      <h3>${icon('chat')} ${t('Your language')}</h3><p class="muted small">${t('Explanations, meanings and exercises in your language. The Finnish stays the same.')}</p>
      <div class="chips">${Object.entries(LANGS).map(([k, n]) => `<button class="chip ${(p.lang || 'en') === k ? 'on' : ''}" data-lang="${k}">${n}</button>`).join('')}</div>
      <button class="btn sm ghost" id="tut-again" style="margin-top:12px">${t('Show the tutorial again')}</button>
    </section>
    <section class="card set">
      <h3>${t('Daily goal')}</h3><div class="chips">${[[20, t('Chill')], [50, t('Regular')], [100, t('Serious')], [150, t('Intense')], [250, 'Sisu']].map(([g, n]) => `<button class="chip ${p.goal === g ? 'on' : ''}" data-goal="${g}">${n} · ${g} XP</button>`).join('')}</div>
      <p class="muted small">${t('50 XP ≈ 10–15 minutes. Consistency beats intensity.')}</p>
    </section>
    <section class="card set">
      <h3>${t('Sound & voice')}</h3><p class="muted small">${t("SuomiT plays recorded neural Finnish audio (voice: Noora). Anything without a recording uses your device's Finnish voice below.")}</p>
      <label class="tog"><span>${t('Sounds (taps, right / wrong)')}</span><input type="checkbox" data-p="sound" ${p.sound ? 'checked' : ''}></label>
      <label class="tog"><span>${t('Haptic feedback')}</span><input type="checkbox" data-p="haptics" ${p.haptics ? 'checked' : ''}></label>
      <label class="tog"><span>${t('Speak words automatically')}</span><input type="checkbox" data-p="autoSpeak" ${p.autoSpeak ? 'checked' : ''}></label>
      <label class="fld"><span>${t('Device voice (fallback)')}</span><select id="voice">${voices.length ? voices.map(v => `<option ${v.name === p.voice ? 'selected' : ''}>${esc(v.name)}</option>`).join('') : `<option>${t('No Finnish voice installed')}</option>`}</select></label>
      <label class="fld"><span>${t('Speaking speed')} · <b id="rv">${p.rate}</b></span><input type="range" min="0.5" max="1.2" step="0.05" value="${p.rate}" id="rate"></label>
      <button class="btn sm ghost" id="test">${icon('speaker')} ${t('Test: “{phrase}”', { phrase: 'Hyvää huomenta, mitä kuuluu?' })}</button>
    </section>
    <section class="card set">
      <h3>${t('Checking')}</h3>
      <label class="tog"><span>${t('Strict ä/ö (a missing dot counts as wrong)')}</span><input type="checkbox" data-p="strictDots" ${p.strictDots ? 'checked' : ''}></label>
      <p class="muted small">${t('Off: <i>paiva</i> for <i>päivä</i> is accepted with a warning. Doubled letters are always strict: <i>kisa</i> ≠ <i>kissa</i>.')}</p>
    </section>
    <section class="card set" id="offline">
      <h3>${icon('download')} ${t('Offline')}</h3>
      <p class="small">${t('The app, all lessons, drills, stories and practice sets work offline once SuomiT has been opened. Voice clips are saved as you hear them; download them all to have every pronunciation offline (about 120 MB). Videos and outside links always need internet.')}</p>
      <div class="off-stat small muted">${t('Checking…')}</div>
      <div class="off-bar mini-bar" hidden><div style="width:0"></div></div>
      <div class="row-btns"><button class="btn sm" id="off-dl">${icon('download')} ${t('Download all audio')}</button><button class="btn sm ghost" id="off-rm">${t('Remove downloaded audio')}</button></div>
    </section>
    <section class="card set">
      <h3>${icon('phone')} ${t('Sync phone ⇄ Mac')}</h3>
      <p class="small">${t('No account needed. Copy your sync code on one device and paste it on the other. Progress is <b>merged</b>: nothing gets lost.')}</p>
      <div class="row-btns"><button class="btn" id="exp">${t('Copy my sync code')}</button><button class="btn ghost" id="imp">${t('Paste a code')}</button></div>
      <div class="row-btns"><button class="btn sm ghost" id="dl">${icon('download')} ${t('Download backup file')}</button><label class="btn sm ghost">${icon('upload')} ${t('Load backup file')}<input type="file" id="up" accept=".json,.txt" hidden></label></div>
    </section>
    <section class="card set danger-zone"><h3>${t('Danger zone')}</h3><button class="btn sm danger" id="reset">${t('Reset all progress')}</button></section>
    <p class="muted small center">${t('SuomiT · made with sisu · data stays on your device')}</p>`;
  el.querySelector('#tut-again').onclick = () => import('../tutorial.js').then(m => m.showTutorial());
  // a new language reloads the app, so every screen and cached list is built in that language
  el.querySelectorAll('[data-lang]').forEach(b => b.onclick = () => { if (b.dataset.lang === (p.lang || 'en')) return; store.setProfile({ lang: b.dataset.lang }); store.flush(); location.reload(); });
  el.querySelectorAll('[data-goal]').forEach(b => b.onclick = () => { store.setProfile({ goal: +b.dataset.goal }); rerender(); });
  el.querySelectorAll('[data-p]').forEach(i => i.onchange = () => store.setProfile({ [i.dataset.p]: i.checked }));
  el.querySelector('#voice').onchange = e => store.setProfile({ voice: e.target.value });
  el.querySelector('#rate').oninput = e => { el.querySelector('#rv').textContent = e.target.value; store.setProfile({ rate: +e.target.value }); };
  el.querySelector('#test').onclick = () => speak('Hyvää huomenta, mitä kuuluu?');
  (async () => {
    const box = el.querySelector('#offline'); if (!box) return;
    const stat = box.querySelector('.off-stat'), bar = box.querySelector('.off-bar'), fill = bar.firstElementChild, dl = box.querySelector('#off-dl');
    if (!offlineSupported()) { stat.textContent = t('This browser does not support offline storage.'); dl.disabled = true; return; }
    const show = async () => { const n = await cachedClips(), tot = totalClips(), v = { n: n.toLocaleString(), total: tot.toLocaleString() }; stat.textContent = n >= tot ? t('Audio available offline: {n} / {total} clips · complete', v) : t('Audio available offline: {n} / {total} clips', v); dl.disabled = n >= tot; };
    await show();
    dl.onclick = async () => {
      dl.disabled = true; bar.hidden = false;
      try { navigator.storage?.persist?.(); } catch { }
      const r = await downloadAllAudio((d, tot) => { fill.style.width = (d / tot * 100) + '%'; stat.textContent = t('Downloading audio… {n} / {total}', { n: d.toLocaleString(), total: tot.toLocaleString() }); });
      toast(r.failed ? t('Done, {n} clips failed (try again)', { n: r.failed }) : t('All audio is available offline'), r.failed ? 'alert' : 'check', 3000);
      bar.hidden = true; show();
    };
    box.querySelector('#off-rm').onclick = async () => { if (!confirm(t('Remove all downloaded audio? Clips will download again as you use the app.'))) return; await clearAudio(); show(); };
  })();
  el.querySelector('#exp').onclick = async () => {
    const code = await store.exportCode();
    try { await navigator.clipboard.writeText(code); toast(t('Sync code copied! Paste it on your other device.'), 'copy', 3500); }
    catch { modal(`<h3>${t('Your sync code')}</h3><textarea class="code" readonly>${esc(code)}</textarea><p class="muted small">${t('Select all & copy.')}</p>`); }
    if (navigator.share && /iPhone|iPad|Android/.test(navigator.userAgent)) navigator.share({ title: t('SuomiT sync code'), text: code }).catch(() => { });
  };
  el.querySelector('#imp').onclick = () => {
    const m = modal(`<h3>${t('Paste sync code')}</h3><textarea class="code" placeholder="SUOMIT1.…"></textarea><button class="btn wide" id="go">${t('Merge into this device')}</button>`);
    m.el.querySelector('#go').onclick = () => doImport(m.el.querySelector('textarea').value, m.close);
  };
  el.querySelector('#dl').onclick = async () => {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([await store.exportCode()], { type: 'text/plain' }));
    a.download = `suomit-backup-${store.today()}.txt`; a.click();
  };
  el.querySelector('#up').onchange = async e => { const f = e.target.files[0]; if (f) doImport(await f.text()); };
  el.querySelector('#reset').onclick = () => { if (confirm(t('Delete ALL progress on this device? This cannot be undone.')) && confirm(t('Really sure?'))) { store.resetAll(); applyTheme(); go('#/home'); } };
}
async function doImport(code, done) {
  try { const data = await store.decodeCode(code); store.merge(data); applyTheme(); toast(t('Progress merged!'), 'check', 3000); done?.(); rerender(); }
  catch (e) { toast(t('That code did not work: {error}', { error: e.message === 'Not a SuomiT sync code' ? t('Not a SuomiT sync code') : e.message }), 'alert', 4000); }
}

export function renderAbout(el) {
  el.innerHTML = `<a class="back" href="#/me">‹ Minä</a><h1 class="pg">${t('Why SuomiT works')}</h1>
  ${[
      [icon('grid') + ' ' + t('Retrieval practice'), t('You learn by pulling answers out of memory, not by re-reading. Almost every screen asks you to recall, type or say something.')],
      [icon('calendar') + ' ' + t('Spaced repetition (FSRS-6)'), t('Every word has its own memory model. SuomiT schedules a review right before you would forget, aiming for 90% recall. The Daily mix does this for you.')],
      [icon('swap') + ' ' + t('Interleaving'), t('Sessions mix vocabulary with different grammar skills. It feels harder, but mixed practice sticks far better than blocks of the same thing.')],
      [icon('pen') + ' ' + t('Production over recognition'), t('New words start as multiple choice, then graduate to typing and dictation as they get stronger.')],
      [icon('flag') + ' ' + t('Finnish-specific drills'), t('Vowel harmony, kpt-gradation, the partitive, local cases, verb types and the clock are drilled with generated questions until they become automatic.')],
      [icon('headphones') + ' ' + t('Sound first'), t('Length and dots change meaning (tuli/tuuli, kisa/kissa), so SuomiT is strict about them and speaks every answer aloud.')],
      [icon('read') + ' ' + t('Comprehensible input'), t('Graded stories, tap-to-translate everywhere, and the best free Finnish media from your course.')],
      [icon('flame') + ' ' + t('Habit, not punishment'), t('Streaks, quests and rewards keep you coming back, but mistakes never cost you anything. Mistakes are how the scheduler learns what to repeat.')],
    ].map(([h, p]) => `<section class="card"><h3>${h}</h3><p>${p}</p></section>`).join('')}
  <section class="card"><h3>${icon('calendar')} ${t('The 20-minute routine')}</h3><ol><li>${t('Daily mix (reviews + new words + grammar)')}</li><li>${t('One lesson or one grammar drill')}</li><li>${t('5 minutes of Finnish input: Selkouutiset, a story or a podcast')}</li><li>${t('Say every answer out loud')}</li></ol></section>
  <p class="muted small">${t('Course structure follows the Basic Finnish Club modules. All explanations, exercises and stories are original SuomiT content; linked resources belong to their creators. Full write-up with sources: {link}.', { link: '<a href="https://github.com/pipeli-prog/suomit/blob/main/LEARNING_SCIENCE.md" target="_blank" rel="noopener">LEARNING_SCIENCE.md</a>' })}</p>`;
}
