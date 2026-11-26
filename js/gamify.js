// Rewards: daily quests, achievements, chests, shop catalogue, themes.
import * as store from './store.js';
import { icon } from './icons.js';
import { toast, confetti, modal, mascotSVG, esc } from './ui.js';
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
};
export function applyTheme(id = store.state().profile.theme) {
  const t = THEMES[id] || THEMES.talviyo, r = document.documentElement.style;
  for (const [k, v] of Object.entries({ bg: t.bg, bg2: t.bg2, card: t.card, ink: t.ink, mute: t.mute, acc: t.acc, acc2: t.acc2 })) r.setProperty('--' + k, v);
  document.documentElement.dataset.light = t.light ? '1' : '';
  document.documentElement.dataset.aurora = t.aurora ? '1' : '';
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', t.bg);
}

// ------------------------------------------------------------ shop
export const SHOP = [
  { id: 'freeze', kind: 'freeze', name: 'Sisu shield', en: 'Streak freeze: protects your streak for 1 missed day', icon: 'shield', price: 50 },
  ...Object.entries(THEMES).filter(([, t]) => t.price).map(([id, t]) => ({ id: 'theme:' + id, kind: 'theme', name: t.name, en: t.en + ' theme', price: t.price, theme: id })),
  { id: 'hat:pipo', kind: 'hat', name: 'Pipo', en: 'Beanie (Module 1 reward)', price: 80 },
  { id: 'hat:saunahattu', kind: 'hat', name: 'Saunahattu', en: 'Felt sauna hat', price: 100 },
  { id: 'hat:tonttulakki', kind: 'hat', name: 'Tonttulakki', en: 'Elf hat', price: 120 },
  { id: 'hat:kalastajahattu', kind: 'hat', name: 'Kalastajahattu', en: 'Fishing hat', price: 150 },
  { id: 'hat:kukkaseppele', kind: 'hat', name: 'Kukkaseppele', en: 'Midsummer flower crown (Module 3 reward)', price: 200 },
  { id: 'hat:ylioppilaslakki', kind: 'hat', name: 'Ylioppilaslakki', en: 'Graduation cap (Module 4 reward)', price: 400 },
  { id: 'hat:kruunu', kind: 'hat', name: 'Kruunu', en: 'Crown (bonus module reward)', price: 600 },
  { id: 'face:silmalasit', kind: 'face', name: 'Silmälasit', en: 'Glasses', price: 60 },
  { id: 'face:aurinkolasit', kind: 'face', name: 'Aurinkolasit', en: 'Sunglasses (Module 2 reward)', price: 100 },
  { id: 'face:sydanlasit', kind: 'face', name: 'Sydänlasit', en: 'Heart glasses', price: 150 },
  { id: 'neck:huivi', kind: 'neck', name: 'Huivi', en: 'Scarf', price: 80 },
  { id: 'neck:rusetti', kind: 'neck', name: 'Rusetti', en: 'Bow tie', price: 100 },
  { id: 'neck:mitali', kind: 'neck', name: 'Mitali', en: 'Medal: earned with a 30-day streak', price: null },
  { id: 'color:sand', kind: 'color', name: 'Hiekka', en: 'Sand seal', price: 100 },
  { id: 'color:mint', kind: 'color', name: 'Minttu', en: 'Mint seal', price: 150 },
  { id: 'color:pink', kind: 'color', name: 'Vaaleanpunainen', en: 'Pink seal', price: 150 },
  { id: 'color:midnight', kind: 'color', name: 'Keskiyö', en: 'Midnight seal', price: 200 },
  { id: 'color:gold', kind: 'color', name: 'Kulta', en: 'Golden seal', price: 500 },
];
export const owns = id => !!store.state().owned[id];
export function grant(id, why) {
  const S = store.state(); if (S.owned[id]) return false;
  S.owned[id] = 1; store.save();
  const it = SHOP.find(x => x.id === id);
  if (it) toast(`Unlocked: ${it.name}${why ? ' · ' + why : ''}`, 'gift', 3200);
  return true;
}
export function buy(it) {
  if (it.kind === 'freeze') {
    if (store.freezesOwned() >= 3) return toast('You can hold max 3 shields', 'shield'), false;
    if (!store.spend('freeze:' + Date.now(), it.price)) return toast('Not enough markkaa yet', 'coin'), false;
    sfx('coin'); toast('Sisu shield ready!', 'shield'); return true;
  }
  if (owns(it.id)) return false;
  if (!store.spend('buy:' + it.id, it.price)) return toast('Not enough markkaa yet', 'coin'), false;
  store.state().owned[it.id] = 1; store.save(); sfx('coin'); toast(`${it.name} is yours!`, 'bag');
  unlock('shopper');
  return true;
}
export function equip(it) {
  const S = store.state();
  if (it.kind === 'theme') { store.setProfile({ theme: it.theme }); applyTheme(); }
  else { const slot = it.kind, val = it.id.split(':')[1]; S.mascot[slot] = S.mascot[slot] === val && slot !== 'color' ? null : val; store.save(); }
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
