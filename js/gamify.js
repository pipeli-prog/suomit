// Rewards: daily quests, achievements, chests, shop catalogue, themes.
import * as store from './store.js';
import { icon } from './icons.js';
import { toast, confetti, modal, mascotSVG, esc } from './ui.js';
import { ANIMALS, ACCESSORIES, COLORS } from './mascots.js';
import { sfx } from './audio.js';
import { LESSONS, MODULES } from '../data/course.js';
import { READINGS } from '../data/readings.js';

// ------------------------------------------------------------ themes ("skins" for the whole app)
export const THEMES = {
  talviyo: { name: 'Talviyö', en: 'Winter night', price: 0, bg: '#0b1426', bg2: '#13213b', card: '#182a49', ink: '#eaf2ff', mute: '#93a6c4', acc: '#3ddc97', acc2: '#5ab0ff', light: false },
  revontulet: { name: 'Revontulet', en: 'Northern lights', price: 150, bg: '#07121c', bg2: '#0f2230', card: '#122d3a', ink: '#e9fff6', mute: '#8fb7ae', acc: '#59f0b0', acc2: '#b388ff', light: false, aurora: true },
  kesayo: { name: 'Kesäyö', en: 'Midsummer night', price: 150, bg: '#fff6ec', bg2: '#ffeedd', card: '#ffffff', ink: '#2b2140', mute: '#7d6f8e', acc: '#ff7a59', acc2: '#5a6cff', light: true },
  mokki: { name: 'Mökki', en: 'Summer cottage', price: 200, bg: '#f6efe4', bg2: '#ece0cd', card: '#fffaf2', ink: '#3b2416', mute: '#8a6c55', acc: '#b5382a', acc2: '#2f6f4e', light: true },
  sauna: { name: 'Sauna', en: 'Sauna', price: 200, bg: '#2a1a12', bg2: '#3a2418', card: '#46301f', ink: '#ffeedd', mute: '#c8a586', acc: '#ff9d4d', acc2: '#ffd166', light: false },
  mustikka: { name: 'Mustikka', en: 'Blueberry', price: 250, bg: '#1a1033', bg2: '#251848', card: '#2f1f5c', ink: '#f1eaff', mute: '#a89cc8', acc: '#8f7bff', acc2: '#ff6fb5', light: false },
  lakka: { name: 'Lakka', en: 'Cloudberry', price: 250, bg: '#fff8e6', bg2: '#ffefc7', card: '#ffffff', ink: '#3d2a00', mute: '#8c7440', acc: '#f39c12', acc2: '#e74c3c', light: true },
  sisu: { name: 'Sisu', en: 'Grit (high contrast)', price: 300, bg: '#000000', bg2: '#0d0d0d', card: '#161616', ink: '#ffffff', mute: '#a0a0a0', acc: '#ffffff', acc2: '#1e90ff', light: false },
  kaamos: { name: 'Kaamos', en: 'Polar night', price: 180, bg: '#0a0f24', bg2: '#141b3a', card: '#1b2448', ink: '#e8ecff', mute: '#9aa3cc', acc: '#7fb2ff', acc2: '#c3a6ff', light: false },
  tunturi: { name: 'Tunturi', en: 'Lapland fell', price: 200, bg: '#141a1c', bg2: '#1e2629', card: '#253034', ink: '#eef3ef', mute: '#a2b0aa', acc: '#b8d98a', acc2: '#e6a86a', light: false },
  metsa: { name: 'Metsä', en: 'Deep forest', price: 160, bg: '#0d1a12', bg2: '#15261b', card: '#1b3123', ink: '#eaf7ec', mute: '#9bb8a2', acc: '#6fdc8c', acc2: '#ffb35c', light: false },
  jarvi: { name: 'Järvi', en: 'Lake at dusk', price: 160, bg: '#061a24', bg2: '#0b2733', card: '#0f3240', ink: '#e6f7ff', mute: '#8fb4c4', acc: '#4fd1e0', acc2: '#ffd166', light: false },
  salmiakki: { name: 'Salmiakki', en: 'Salty liquorice', price: 220, bg: '#0e0e0e', bg2: '#1a1a1a', card: '#222222', ink: '#f2f2f2', mute: '#a8a8a8', acc: '#d9d9d9', acc2: '#ff4d4d', light: false },
  puolukka: { name: 'Puolukka', en: 'Lingonberry', price: 200, bg: '#1f0a10', bg2: '#2d0f18', card: '#3a1420', ink: '#ffeef2', mute: '#c99aa6', acc: '#ff5a6e', acc2: '#7fd38a', light: false },
  ruska: { name: 'Ruska', en: 'Autumn colours', price: 220, bg: '#1e130b', bg2: '#2b1b10', card: '#372314', ink: '#fff1e2', mute: '#c7a487', acc: '#ff8c42', acc2: '#ffd23f', light: false },
  myrsky: { name: 'Myrsky', en: 'Thunderstorm', price: 180, bg: '#12161c', bg2: '#1b2129', card: '#232b35', ink: '#eef2f7', mute: '#9aa6b5', acc: '#ffd23f', acc2: '#6cb4ff', light: false },
  terva: { name: 'Terva', en: 'Pine tar', price: 240, bg: '#120d08', bg2: '#1c150e', card: '#261c13', ink: '#f7ecdf', mute: '#b39d85', acc: '#e8a33d', acc2: '#d98159', light: false },
  tahtitaivas: { name: 'Tähtitaivas', en: 'Starry sky with aurora', price: 400, bg: '#050816', bg2: '#0b1030', card: '#11173d', ink: '#eef0ff', mute: '#9aa0cf', acc: '#ffe27a', acc2: '#8fa8ff', light: false, aurora: true },
  kuutamo: { name: 'Kuutamo', en: 'Moonlight', price: 260, bg: '#0b1220', bg2: '#141e33', card: '#1a2640', ink: '#f1f4fa', mute: '#a3adc2', acc: '#e9e4c8', acc2: '#8ab4f8', light: false },
  joulu: { name: 'Joulu', en: 'Christmas', price: 300, bg: '#0b1f16', bg2: '#112c20', card: '#163828', ink: '#fff6ea', mute: '#a9c4b2', acc: '#ff6b6b', acc2: '#ffd166', light: false },
  tanssilava: { name: 'Tanssilava', en: 'Dance pavilion neon', price: 350, bg: '#160b26', bg2: '#221238', card: '#2c1748', ink: '#fbefff', mute: '#b9a0d0', acc: '#ff6fd8', acc2: '#40e0ff', light: false },
  kuura: { name: 'Kuura', en: 'Hoarfrost', price: 180, bg: '#f2f7fc', bg2: '#e3eef8', card: '#ffffff', ink: '#13263b', mute: '#5b6f85', acc: '#1f6fd1', acc2: '#7a4fd6', light: true },
  koivu: { name: 'Koivu', en: 'Birch bark', price: 160, bg: '#f7f6f1', bg2: '#ebe8dd', card: '#ffffff', ink: '#1f2420', mute: '#686f66', acc: '#2f6f4e', acc2: '#a95a34', light: true },
  mansikka: { name: 'Mansikka', en: 'Strawberry', price: 200, bg: '#fff2f4', bg2: '#ffe1e6', card: '#ffffff', ink: '#3a1018', mute: '#8c5a64', acc: '#d62845', acc2: '#2f8f4e', light: true },
  kanerva: { name: 'Kanerva', en: 'Heather', price: 200, bg: '#f8f2fb', bg2: '#efe2f6', card: '#ffffff', ink: '#2c1838', mute: '#7a6488', acc: '#8e44ad', acc2: '#d6457a', light: true },
  hiekkaranta: { name: 'Hiekkaranta', en: 'Sandy beach', price: 180, bg: '#fbf5e9', bg2: '#f3e7cf', card: '#fffdf8', ink: '#2a2418', mute: '#7d7058', acc: '#0f7f81', acc2: '#b8562a', light: true },
  sumu: { name: 'Sumu', en: 'Morning fog', price: 150, bg: '#eef0f2', bg2: '#e1e5e9', card: '#fafbfc', ink: '#1d232a', mute: '#5f6973', acc: '#4a6782', acc2: '#8a6f9e', light: true },
  vappu: { name: 'Vappu', en: 'May Day party', price: 250, bg: '#fffbea', bg2: '#fff1c2', card: '#ffffff', ink: '#2a2340', mute: '#756c88', acc: '#d6336c', acc2: '#1c7ed6', light: true },
  kevat: { name: 'Kevät', en: 'Spring green', price: 160, bg: '#f3faef', bg2: '#e2f3d9', card: '#ffffff', ink: '#1c2d17', mute: '#5f7458', acc: '#3a832b', acc2: '#a86f00', light: true },
  kahvi: { name: 'Kahvi', en: 'Coffee break', price: 200, bg: '#f6efe7', bg2: '#eadccb', card: '#fffaf4', ink: '#2e1f14', mute: '#7f6a58', acc: '#7b4a2a', acc2: '#a2601f', light: true },
  suomi: { name: 'Suomi', en: 'Blue and white', price: 300, bg: '#f5f8fc', bg2: '#e6edf7', card: '#ffffff', ink: '#0d1f3c', mute: '#56688a', acc: '#003580', acc2: '#2f80ed', light: true },
  pulla: { name: 'Pulla', en: 'Cardamom bun', price: 220, bg: '#fff7ec', bg2: '#f9e7cf', card: '#fffdf9', ink: '#3a2614', mute: '#86694c', acc: '#a85d22', acc2: '#5a8a3a', light: true },
};
export function applyTheme(id = store.state().profile.theme) {
  const t = THEMES[id] || THEMES.talviyo, r = document.documentElement.style;
  for (const [k, v] of Object.entries({ bg: t.bg, bg2: t.bg2, card: t.card, ink: t.ink, mute: t.mute, acc: t.acc, acc2: t.acc2 })) r.setProperty('--' + k, v);
  document.documentElement.dataset.light = t.light ? '1' : '';
  document.documentElement.dataset.aurora = t.aurora ? '1' : '';
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', t.bg);
}

// ------------------------------------------------------------ shop
const entries = (kind, src, extra = () => ({})) => Object.entries(src).map(([k, v]) => ({ id: kind + ':' + k, kind, name: v.name, en: v.en, price: v.price, ...extra(k, v) }));
/** Every cosmetic (defaults have price 0, reward-only items price null). */
export const COSMETICS = [
  ...entries('animal', ANIMALS, (k, a) => ({ fi: a.fi })),
  ...entries('theme', THEMES, k => ({ theme: k })),
  ...entries('hat', ACCESSORIES.hat),
  ...entries('face', ACCESSORIES.face),
  ...entries('neck', ACCESSORIES.neck),
  ...entries('color', COLORS),
];
for (const it of COSMETICS) if (it.kind === 'animal') it.en = `${it.fi[0].toUpperCase() + it.fi.slice(1)} · ${ANIMALS[it.id.split(':')[1]].en}`;
export const SHOP = [
  { id: 'freeze', kind: 'freeze', name: 'Sisu shield', en: 'Streak freeze: protects your streak for 1 missed day', icon: 'shield', price: 200 },
  ...COSMETICS,
];
const BY_ID = new Map(SHOP.map(x => [x.id, x]));
export const shopItem = id => BY_ID.get(id);
export const owns = id => !!store.state().owned[id] || BY_ID.get(id)?.price === 0;
export function grant(id, why) {
  const S = store.state(); if (owns(id)) return false;
  S.owned[id] = 1; store.save();
  const it = BY_ID.get(id);
  if (it && why !== false) toast(`Unlocked: ${it.name}${why ? ' · ' + why : ''}`, 'gift', 3200);
  return true;
}
export function buy(it) {
  if (it.kind === 'freeze') {
    if (store.freezesOwned() >= 3) return toast('You can hold max 3 shields', 'shield'), false;
    if (!store.spend('freeze:' + Date.now(), it.price)) return toast('Not enough markkaa yet', 'coin'), false;
    sfx('coin'); toast('Sisu shield ready!', 'shield'); return true;
  }
  if (owns(it.id)) return false;
  if (it.price == null) return toast('This one is a reward: earn it, or find it in a Yllätyslaatikko', 'lock'), false;
  if (!store.spend('buy:' + it.id, it.price)) return toast('Not enough markkaa yet', 'coin'), false;
  store.state().owned[it.id] = 1; store.save(); sfx('coin'); toast(`${it.name} is yours!`, 'bag');
  unlock('shopper');
  return true;
}
/** Wear / use an owned item. Hats, glasses and neck items toggle; animal, colour and theme just switch. */
export function equip(it) {
  const S = store.state();
  if (it.kind === 'theme') { store.setProfile({ theme: it.theme }); applyTheme(); return; }
  const slot = it.kind, val = it.id.split(':')[1];
  S.mascot[slot] = S.mascot[slot] === val && (slot === 'hat' || slot === 'face' || slot === 'neck') ? null : val;
  store.save();
}
export const isEquipped = it => {
  const S = store.state(), val = it.id.split(':')[1];
  if (it.kind === 'theme') return (S.profile.theme || 'talviyo') === it.theme;
  if (it.kind === 'animal') return (ANIMALS[S.mascot.animal] ? S.mascot.animal : 'norppa') === val;
  if (it.kind === 'color') return (COLORS[S.mascot.color] ? S.mascot.color : 'grey') === val;
  return it.kind !== 'freeze' && S.mascot[it.kind] === val;
};

// ------------------------------------------------------------ Yllätyslaatikko (surprise box): uniform random over unowned cosmetics
export const LOOT_PRICE = 120;
export const KIND_LABEL = { animal: 'New friend', theme: 'New theme', hat: 'New hat', face: 'New glasses', neck: 'New neckwear', color: 'New colour' };
/** Cosmetics the player does not own yet: every one has exactly the same chance. */
export const lootPool = () => COSMETICS.filter(it => !owns(it.id));
/** A closed box as SVG (uses the theme accent colours). */
export function lootBoxSVG(size = 120) {
  return `<svg class="lootbox-svg" viewBox="0 0 120 120" width="${size}" height="${size}" aria-hidden="true">
    <ellipse cx="60" cy="110" rx="40" ry="5" fill="rgba(0,0,0,.2)"/>
    <g class="lb-base"><rect x="22" y="50" width="76" height="56" rx="8" fill="var(--acc2)"/><rect x="22" y="50" width="76" height="56" rx="8" fill="#000" opacity=".12"/>
    <rect x="52" y="50" width="16" height="56" fill="var(--acc)"/><path d="M28 62 H92" stroke="#fff" stroke-width="2" opacity=".18"/></g>
    <g class="lb-lid"><rect x="16" y="36" width="88" height="18" rx="6" fill="var(--acc2)"/><rect x="50" y="36" width="20" height="18" fill="var(--acc)"/>
    <path d="M60 36 C48 18 30 22 38 32 C42 36 52 36 60 36 C68 36 78 36 82 32 C90 22 72 18 60 36Z" fill="var(--acc)"/></g>
    <text x="60" y="94" text-anchor="middle" font-size="30" font-weight="900" fill="#fff" opacity=".92" font-family="Nunito,system-ui,sans-serif">?</text>
  </svg>`;
}
/** Preview art for any cosmetic, drawn on top of the current outfit. */
export function cosmeticPreview(it, size = 78, base = store.state().mascot) {
  if (it.kind === 'theme') { const t = THEMES[it.theme]; return themeSwatch(t, size); }
  if (it.kind === 'freeze') return `<div class="sw ico">${icon('shield')}</div>`;
  const m = { ...base }, val = it.id.split(':')[1];
  if (it.kind === 'animal') Object.assign(m, { animal: val, color: 'grey', hat: null, face: null, neck: null });
  else m[it.kind] = val;
  return mascotSVG(m, { size });
}
export function themeSwatch(t, size = 78) {
  return `<div class="tsw" style="width:${size}px;height:${size}px;background:linear-gradient(160deg,${t.bg2},${t.bg});--t-ink:${t.ink};--t-mute:${t.mute};--t-card:${t.card};--t-acc:${t.acc};--t-acc2:${t.acc2}">
    <i class="tsw-card"><b></b><s></s><u></u></i><i class="tsw-btn"></i><i class="tsw-dot"></i></div>`;
}
/**
 * Buy and open a Yllätyslaatikko (surprise box) for LOOT_PRICE markkaa: shows a full-screen reveal and grants
 * one random cosmetic the player does not own yet. Resolves with the won SHOP item, or null if nothing happened.
 * onClose runs after the overlay closes (e.g. to re-render the current view).
 */
export function openLootBox({ onClose } = {}) {
  const pool = lootPool();
  if (!pool.length) { toast('You already own everything. Täydellinen kokoelma!', 'trophy'); return Promise.resolve(null); }
  if (store.coins() < LOOT_PRICE) { toast(`A surprise box costs ${LOOT_PRICE} markkaa`, 'coin'); return Promise.resolve(null); }
  if (!store.spend('box:' + Date.now(), LOOT_PRICE)) return Promise.resolve(null);
  const it = pool[Math.floor(Math.random() * pool.length)];
  store.state().owned[it.id] = 1; store.save();
  sfx('coin'); unlock('shopper');
  return new Promise(resolve => {
    const wrap = document.createElement('div');
    wrap.className = 'lb-wrap'; wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-modal', 'true'); wrap.setAttribute('aria-label', 'Yllätyslaatikko');
    wrap.innerHTML = `<div class="lb-stage">
      <div class="lb-rays"></div>
      <div class="lb-box">${lootBoxSVG(180)}</div>
      <div class="lb-reveal">
        <div class="lb-kind">${esc(KIND_LABEL[it.kind] || 'New item')}</div>
        <div class="lb-art">${cosmeticPreview(it, 170)}</div>
        <h2 class="lb-name">${esc(it.name)}</h2>
        <p class="lb-en">${esc(it.en)}</p>
        <div class="lb-btns"><button class="btn" data-eq>${icon('check')} Equip now</button><button class="btn ghost" data-close>Close</button></div>
      </div>
      <p class="lb-hint">Tap to open</p>
    </div>`;
    document.body.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add('in'));
    let opened = false, done = false;
    const reveal = () => {
      if (opened) return; opened = true; clearTimeout(t);
      wrap.classList.add('open'); sfx('win'); confetti(110);
      setTimeout(() => wrap.querySelector('[data-eq]')?.focus(), 400);
    };
    const t = setTimeout(reveal, 1300);
    const close = () => {
      if (done) return; done = true; clearTimeout(t);
      wrap.classList.remove('in'); document.removeEventListener('keydown', key);
      setTimeout(() => wrap.remove(), 250); onClose?.(); resolve(it);
    };
    const key = e => { if (e.key === 'Escape') close(); else if (!opened && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); reveal(); } };
    document.addEventListener('keydown', key);
    wrap.addEventListener('click', e => {
      if (!opened) return reveal();
      if (e.target.closest('[data-eq]')) { equip(it); sfx('tap'); toast(`Wearing ${it.name}`, it.kind === 'theme' ? 'palette' : 'shirt'); close(); }
      else if (e.target.closest('[data-close]')) close();
    });
  });
}

// ------------------------------------------------------------ daily quests
const QUEST_POOL = [
  { id: 'xp', t: g => `Earn ${g} XP`, target: () => store.state().profile.goal, metric: 'xp', coins: 15 },
  { id: 'ok15', t: () => 'Answer 15 questions correctly', target: () => 15, metric: 'ok', coins: 10 },
  { id: 'ok40', t: () => 'Answer 40 questions correctly', target: () => 40, metric: 'ok', coins: 25 },
  { id: 'rev', t: () => 'Review 20 cards', target: () => 20, metric: 'rev', coins: 15 },
  { id: 'new', t: () => 'Learn 5 new words', target: () => 5, metric: 'new', coins: 15 },
  { id: 'listen', t: () => 'Answer 8 listening questions', target: () => 8, metric: 'listen', coins: 15 },
  { id: 'combo', t: () => 'Get a 10-answer streak', target: () => 10, metric: 'best', coins: 20 },
  { id: 'read', t: () => 'Read a story', target: () => 1, metric: 'read', coins: 20 },
];
function seedRand(seed) { let x = 0; for (const c of seed) x = (x * 31 + c.charCodeAt(0)) >>> 0; return () => ((x = (x * 1103515245 + 12345) >>> 0) / 4294967296); }
export function quests(day = store.today()) {
  const r = seedRand(day), pool = [...QUEST_POOL], out = [pool.shift()]; // XP quest always
  while (out.length < 3) out.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
  const d = store.state().days[day] || {};
  return out.map(q => ({ ...q, title: q.t(q.target()), target: q.target(), prog: Math.min(q.target(), d[q.metric] || 0), claimed: !!d.qc?.[q.id] }));
}
export function claimQuests() {
  const d = store.dayRec(); let n = 0;
  for (const q of quests()) if (q.prog >= q.target && !q.claimed) {
    d.qc[q.id] = 1; store.addCoins(q.coins); n++;
    toast(`Quest done: ${q.title} · +${q.coins} ${icon('coin')}`, 'list', 3000);
  }
  if (n) { sfx('coin'); store.save(); if (quests().every(q => q.claimed)) unlock('questmaster'); }
  return n;
}

// ------------------------------------------------------------ achievements
export const ACH = [
  { id: 'first', icon: 'sprout', name: 'Ensimmäinen askel', en: 'Finish your first session' },
  { id: 'goal', icon: 'target', name: 'Tavoite!', en: 'Reach your daily goal' },
  { id: 'streak3', icon: 'flame', name: 'Kolme päivää', en: '3-day streak' },
  { id: 'streak7', icon: 'flame', name: 'Viikko putkeen', en: '7-day streak' },
  { id: 'streak30', icon: 'medal', name: 'Kuukauden sisu', en: '30-day streak (unlocks the medal)' },
  { id: 'streak100', icon: 'gem', name: 'Sata päivää', en: '100-day streak' },
  { id: 'words50', icon: 'book', name: '50 sanaa', en: 'Learn 50 words' },
  { id: 'words200', icon: 'book', name: '200 sanaa', en: 'Learn 200 words' },
  { id: 'words500', icon: 'book', name: '500 sanaa', en: 'Learn 500 words' },
  { id: 'combo10', icon: 'bolt', name: 'Putki', en: '10 correct in a row' },
  { id: 'combo30', icon: 'bolt', name: 'Salama', en: '30 correct in a row' },
  { id: 'perfect', icon: 'check', name: 'Täydellinen', en: 'A session with zero mistakes (10+ questions)' },
  { id: 'night', icon: 'moon', name: 'Yökyöpeli', en: 'Practise after 23:00' },
  { id: 'early', icon: 'sun', name: 'Aamuvirkku', en: 'Practise before 7:00' },
  { id: 'reader', icon: 'read', name: 'Lukutoukka', en: 'Read 5 stories' },
  { id: 'speed30', icon: 'bolt', name: 'Pikajuna', en: '30 points in Speed round' },
  { id: 'match', icon: 'grid', name: 'Muistimestari', en: 'Finish Match pairs under 30 s' },
  { id: 'shopper', icon: 'bag', name: 'Shoppailija', en: 'Buy something in the shop' },
  { id: 'collector', icon: 'pin', name: 'Keräilijä', en: 'Save 25 words to your lists' },
  { id: 'questmaster', icon: 'list', name: 'Tehtävämestari', en: 'Complete all 3 daily quests' },
  ...MODULES.map(m => ({ id: 'mod:' + m.id, icon: 'hat', name: `${m.fi}`, en: `Finish every lesson in Module ${m.n}${m.id === 'b' ? ' (bonus)' : ''}` })),
];
export function unlock(id) {
  if (!store.unlockAch(id)) return;
  const a = ACH.find(x => x.id === id); if (!a) return;
  sfx('win'); toast(`Achievement: ${a.name}`, a.icon, 3500);
  if (id === 'streak30') grant('neck:mitali', '30-day streak');
}
export function checkAchievements(ctx = {}) {
  const st = store.streak(), learned = store.learnedCount(), S = store.state();
  if (st >= 3) unlock('streak3'); if (st >= 7) unlock('streak7'); if (st >= 30) unlock('streak30'); if (st >= 100) unlock('streak100');
  if (learned >= 50) unlock('words50'); if (learned >= 200) unlock('words200'); if (learned >= 500) unlock('words500');
  if ((S.best.combo || 0) >= 10) unlock('combo10'); if ((S.best.combo || 0) >= 30) unlock('combo30');
  if (Object.keys(S.reads).length >= 5) unlock('reader');
  if (new Set(S.lists.flatMap(l => l.items)).size >= 25) unlock('collector');
  const h = new Date().getHours(); if (ctx.session) { if (h >= 23) unlock('night'); if (h < 7) unlock('early'); }
  for (const m of MODULES) {
    const ls = LESSONS.filter(l => l.mod === m.id);
    if (ls.every(l => (S.lessons[l.id]?.stars || 0) >= 1)) {
      if (store.unlockAch('mod:' + m.id)) { sfx('win'); toast(`Module ${m.n} complete!`, 'hat', 3500); confetti(); }
      const reward = { pipo: 'hat:pipo', aurinkolasit: 'face:aurinkolasit', kukkaseppele: 'hat:kukkaseppele', ylioppilaslakki: 'hat:ylioppilaslakki', kruunu: 'hat:kruunu' }[m.reward];
      if (reward) grant(reward, `Module ${m.n} reward`);
    }
  }
}

// ------------------------------------------------------------ chest when the daily goal is first reached
export function maybeChest(xpBefore) {
  const goal = store.state().profile.goal, d = store.dayRec();
  if (xpBefore < goal && d.xp >= goal && !d.chest) {
    d.chest = 1;
    const roll = Math.random();
    const reward = roll < .08 ? 60 : roll < .3 ? 30 : 15 + Math.floor(Math.random() * 10);
    store.addCoins(reward);
    unlock('goal');
    return reward;
  }
  return 0;
}
export function chestModal(coinsWon, streakN) {
  confetti(160); sfx('win');
  const m = modal(`<div class="center chest">
    <div class="chest-ico">${icon('gift')}</div>
    <h2>Päivän tavoite saavutettu!</h2><p class="muted">Daily goal reached</p>
    ${mascotSVG(undefined, { size: 110, mood: 'wow' })}
    <div class="streak-big">${icon('flame')} ${streakN} <span>day streak</span></div>
    <div class="coin-win">+${coinsWon} ${icon('coin')} markkaa</div>
    <button class="btn wide" data-close>Jatketaan! (Let's go on)</button></div>`, { cls: 'celebrate' });
  m.el.querySelector('[data-close]').onclick = m.close;
}
export function readingsDone() { return READINGS.filter(r => store.state().reads[r.id] != null).length; }
