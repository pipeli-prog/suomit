// FSRS-6 spaced repetition (formulas & default parameters from open-spaced-repetition/py-fsrs).
// Ratings: 1 Again · 2 Hard · 3 Good · 4 Easy
const W = [0.212, 1.2931, 2.3065, 8.2956, 6.4133, 0.8334, 3.0194, 0.001, 1.8722, 0.1666, 0.796, 1.4835, 0.0614, 0.2629, 1.6483, 0.6014, 1.8729, 0.5425, 0.0912, 0.0658, 0.1542];
const DECAY = -W[20];
const FACTOR = Math.pow(0.9, 1 / DECAY) - 1;
const DAY = 86400000;
export const RETENTION = 0.9;
const clampD = d => Math.min(10, Math.max(1, d));
const clampS = s => Math.max(0.001, s);

export const retrievability = (card, now = Date.now()) => {
  if (!card || !card.last) return 0;
  const t = Math.max(0, (now - card.last) / DAY);
  return Math.pow(1 + FACTOR * t / card.s, DECAY);
};
const initD = g => W[4] - Math.exp(W[5] * (g - 1)) + 1;
function nextD(d, g) {
  const delta = -W[6] * (g - 3);
  const d2 = d + (10 - d) * delta / 9;
  return clampD(W[7] * initD(4) + (1 - W[7]) * d2);
}
function recallS(d, s, r, g) {
  const hard = g === 2 ? W[15] : 1, easy = g === 4 ? W[16] : 1;
  return s * (1 + Math.exp(W[8]) * (11 - d) * Math.pow(s, -W[9]) * (Math.exp((1 - r) * W[10]) - 1) * hard * easy);
}
function forgetS(d, s, r) {
  const long = W[11] * Math.pow(d, -W[12]) * (Math.pow(s + 1, W[13]) - 1) * Math.exp((1 - r) * W[14]);
  const short = s / Math.exp(W[17] * W[18]);
  return Math.min(long, short);
}
function shortS(s, g) {
  let inc = Math.exp(W[17] * (g - 3 + W[18])) * Math.pow(s, -W[19]);
  if (g >= 2) inc = Math.max(1, inc);
  return s * inc;
}
export function intervalDays(s, retention = RETENTION) {
  const i = (s / FACTOR) * (Math.pow(retention, 1 / DECAY) - 1);
  return Math.min(3650, Math.max(1, Math.round(i)));
}

/** Review a card with grade g. Returns a NEW card object. */
export function review(card, g, now = Date.now()) {
  let c;
  if (!card || !card.last) {
    c = { s: clampS(W[g - 1]), d: clampD(initD(g)), reps: 1, lapses: g === 1 ? 1 : 0 };
  } else {
    const elapsed = (now - card.last) / DAY;
    const r = retrievability(card, now);
    let s;
    if (elapsed < 1) s = shortS(card.s, g);
    else s = g === 1 ? forgetS(card.d, card.s, r) : recallS(card.d, card.s, r, g);
    c = { s: clampS(s), d: nextD(card.d, g), reps: (card.reps || 0) + 1, lapses: (card.lapses || 0) + (g === 1 ? 1 : 0) };
  }
  c.last = now;
  // failed / hard-new cards come back soon (same day); others by FSRS interval
  if (g === 1) c.due = now + 10 * 60000;
  else if (!card?.last && g === 2) c.due = now + 60 * 60000;
  else c.due = now + intervalDays(c.s) * DAY;
  return c;
}
export const isDue = (c, now = Date.now()) => !!c && c.due <= now;
/** strength 0..1 for UI bars */
export const strength = c => (!c || !c.last ? 0 : Math.max(0, Math.min(1, retrievability(c) * Math.min(1, Math.log10(1 + c.s) / 1.6))));
export const isLearned = c => !!c && c.reps > 0 && c.s >= 1;
export const isMature = c => !!c && c.s >= 21;
export const isLeech = c => !!c && c.lapses >= 4 && c.s < 7;
export { DAY };
