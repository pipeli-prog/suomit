import * as store from '../store.js';
import { icon } from '../icons.js';
import { esc, modal, toast, mascotSVG, ACCESSORY_SVG, SEAL_COLORS, fmtNum } from '../ui.js';
import { finnishVoices, speak, sfx } from '../audio.js';
import { THEMES, SHOP, ACH, owns, buy, equip, applyTheme } from '../gamify.js';
import { SKILL_NAMES, SKILL_ICON } from '../exercises.js';
import { rerender, go } from '../app.js';

export function renderMe(el) {
  const S = store.state(), xp = store.totalXp(), lv = store.level(xp), lo = store.levelXp(lv), hi = store.levelXp(lv + 1);
  const days = Object.values(S.days), ans = days.reduce((a, d) => a + (d.ans || 0), 0), okN = days.reduce((a, d) => a + (d.ok || 0), 0);
  const fc = store.forecast(7), fmax = Math.max(1, ...fc);
  // heatmap: last 16 weeks
  const cells = []; const t = store.today();
  const start = store.dayOffset(t, -(7 * 16 - 1) - ((new Date().getDay() + 6) % 7 === 6 ? 0 : 0));
  for (let i = 0; i < 7 * 16; i++) { const k = store.dayOffset(start, i); const x = S.days[k]?.xp || 0; cells.push(`<i title="${k}: ${x} XP" class="h${x === 0 ? (S.frozen[k] ? 'f' : 0) : x < S.profile.goal / 2 ? 1 : x < S.profile.goal ? 2 : x < S.profile.goal * 2 ? 3 : 4}"></i>`); }
  const skills = Object.entries(S.skills).sort((a, b) => (a[1].acc || 0) - (b[1].acc || 0));
  el.innerHTML = `
    <section class="me-h">
      <a href="#/shop" class="me-m">${mascotSVG(undefined, { size: 120 })}<span class="dress">${icon('shirt')} Dress up</span></a>
      <div><input class="name-in" placeholder="Your name" value="${esc(S.profile.name)}" maxlength="24">
        <div class="rank">${esc(store.rank(lv))}</div>
        <div class="lvl-bar"><div style="width:${(xp - lo) / (hi - lo) * 100}%"></div><span>Level ${lv} · ${xp - lo}/${hi - lo} XP</span></div></div>
    </section>
    <section class="stats4">
      <div><b>${icon('flame')} ${store.streak()}</b><span>streak</span></div><div><b>${icon('trophy')} ${store.bestStreak()}</b><span>best streak</span></div>
      <div><b>${icon('book')} ${store.learnedCount()}</b><span>words learned</span></div><div><b>${icon('sprout')} ${store.matureCount()}</b><span>long-term</span></div>
      <div><b>${icon('star')} ${fmtNum(xp)}</b><span>total XP</span></div><div><b>${icon('target')} ${ans ? Math.round(okN / ans * 100) : 0}%</b><span>accuracy</span></div>
      <div><b>${icon('shield')} ${store.freezesOwned()}</b><span>Sisu shields</span></div><div><b>${icon('coin')} ${store.coins()}</b><span>markkaa</span></div>
    </section>
    <section class="card"><h3>Activity · last 16 weeks</h3><div class="heat">${cells.join('')}</div></section>
    <section class="card"><h3>Reviews coming up</h3><div class="fc">${fc.map((n, i) => `<div><div class="fcb" style="height:${n / fmax * 100}%"></div><b>${n}</b><span>${i === 0 ? 'now' : i === 1 ? 'tmrw' : '+' + i}</span></div>`).join('')}</div></section>
    ${skills.length ? `<section class="card"><h3>Grammar skills</h3>${skills.map(([k, c]) => `<div class="skrow"><span>${icon(SKILL_ICON[k] || 'puzzle')} ${esc(SKILL_NAMES[k] || k)}</span><div class="mini-bar"><div style="width:${Math.round((c.acc || 0) * 100)}%"></div></div><b>${Math.round((c.acc || 0) * 100)}%</b></div>`).join('')}</section>` : ''}
    <section class="card"><h3>Achievements · ${Object.keys(S.ach).length}/${ACH.length}</h3><div class="achs">${ACH.map(a => `<div class="ach ${S.ach[a.id] ? 'on' : ''}" title="${esc(a.en)}"><span>${icon(a.icon)}</span><b>${esc(a.name)}</b><small>${esc(a.en)}</small></div>`).join('')}</div></section>
    <div class="grid2"><a class="tile-btn" href="#/shop"><span>${icon('bag')}</span><b>Kauppa</b><small>themes & skins</small></a><a class="tile-btn" href="#/settings"><span>${icon('gear')}</span><b>Settings</b><small>goal, voice, sync</small></a></div>
    <a class="card story-link" href="#/about"><span>${icon('flask')}</span><div><b>Why SuomiT works</b><div class="muted small">The learning science behind the app</div></div><span class="arrow">›</span></a>`;
  el.querySelector('.name-in').onchange = e => { store.setProfile({ name: e.target.value.trim() }); toast('Hei ' + (e.target.value.trim() || 'sinä') + '!', 'wave'); };
}

export function renderShop(el, tab) {
  const S = store.state();
  const sections = [['theme', icon('palette') + ' Themes'], ['hat', icon('hat') + ' Hats'], ['face', icon('glasses') + ' Glasses'], ['neck', icon('scarf') + ' Neck'], ['color', icon('seal') + ' Seal colour'], ['freeze', icon('shield') + ' Power-ups']];
  const preview = it => {
    if (it.kind === 'theme') { const t = THEMES[it.theme]; return `<div class="sw" style="background:linear-gradient(135deg,${t.bg} 0 45%,${t.card} 45% 70%,${t.acc} 70% 85%,${t.acc2} 85%)"></div>`; }
    if (it.kind === 'freeze') return `<div class="sw ico">${icon('shield')}</div>`;
    const m = { ...S.mascot }; if (it.kind === 'color') m.color = it.id.split(':')[1]; else m[it.kind] = it.id.split(':')[1];
    return mascotSVG(m, { size: 78 });
  };
  const equipped = it => it.kind === 'theme' ? S.profile.theme === it.theme : it.kind === 'freeze' ? false : S.mascot[it.kind] === it.id.split(':')[1];
  el.innerHTML = `<a class="back" href="#/me">‹ Minä</a><h1 class="pg">Kauppa <span class="coins-big">${icon('coin')} ${store.coins()}</span></h1>
    <div class="shop-hero">${mascotSVG(undefined, { size: 130 })}<p class="muted small">Earn markkaa: 1 per 10 XP, plus quests and the daily chest.</p></div>
    ${sections.map(([k, h]) => {
    const items = [...(k === 'theme' ? [{ id: 'theme:talviyo', kind: 'theme', name: 'Talviyö', en: 'Winter night (default)', price: 0, theme: 'talviyo' }] : []), ...(k === 'color' ? [{ id: 'color:grey', kind: 'color', name: 'Harmaa', en: 'Classic grey norppa', price: 0 }] : []), ...SHOP.filter(x => x.kind === k)];
    return `<h3 class="sec">${h}</h3><div class="shop">${items.map(it => {
      const own = it.kind !== 'freeze' && (owns(it.id) || it.price === 0), eq = equipped(it);
      return `<button class="item ${own ? 'own' : ''} ${eq ? 'eq' : ''}" data-id="${it.id}">${preview(it)}<b>${esc(it.name)}</b><small>${esc(it.en)}</small>
          <span class="price">${eq ? '✓ wearing' : own ? (it.kind === 'theme' || it.kind === 'color' ? 'use' : 'wear') : it.price == null ? icon('lock') + ' achievement' : `${icon('coin')} ${it.price}`}</span></button>`;
    }).join('')}</div>`;
  }).join('')}`;
  el.querySelectorAll('.item').forEach(b => b.onclick = () => {
    let it = SHOP.find(x => x.id === b.dataset.id) || (b.dataset.id === 'theme:talviyo' ? { id: 'theme:talviyo', kind: 'theme', theme: 'talviyo', price: 0 } : { id: 'color:grey', kind: 'color', price: 0 });
    if (it.kind === 'freeze') { buy(it); return rerender(); }
    if (!owns(it.id) && it.price) { if (it.price == null) return toast('Unlock it with an achievement', 'lock'); if (!confirm(`Buy ${it.name} for ${it.price} markkaa?`)) return; if (!buy(it)) return; }
    else if (!owns(it.id) && it.price === null) return toast('Unlock it with a 30-day streak', 'lock');
    equip(it); sfx('tap'); rerender();
  });
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
