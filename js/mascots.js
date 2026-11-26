// Mascots: the animals, their wearable accessories and body colours. Everything is inline SVG in a 120×120 box.
// Accessories are drawn once in Nuppu's (the seal's) coordinate frame; every animal declares anchor transforms
// that move/scale them onto its own head, eyes, nose and neck.
import * as store from './store.js';

const INK = '#1b1b1b';
const NOSE = '#2b2b2b';

// ------------------------------------------------------------ shared face parts
/** Two eyes. happy/wow: shiny dots (wow a bit bigger), sad: closed downturned arcs. */
function eyes(mood, [x1, y1], [x2, y2], r = 7.5) {
  if (mood === 'sad') {
    const arc = (x, y) => `<path d="M${x - r * .85} ${y + 1} q${r * .85} -${r * .7} ${r * 1.7} 0" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    return arc(x1, y1) + arc(x2, y2);
  }
  const R = mood === 'wow' ? r * 1.12 : r, h = R * .35;
  const dot = (x, y) => `<circle cx="${x}" cy="${y}" r="${R}" fill="${INK}"/><circle cx="${x + R * .33}" cy="${y - R * .4}" r="${h}" fill="#fff"/>`;
  return dot(x1, y1) + dot(x2, y2);
}
/** Mouth centred on (x, y). happy: little "w", sad: frown, wow: open "o". */
function mouth(mood, x, y, s = 1) {
  if (mood === 'wow') return `<ellipse cx="${x}" cy="${y + 2 * s}" rx="${4 * s}" ry="${5 * s}" fill="#5a2a2a"/>`;
  if (mood === 'sad') return `<path d="M${x - 5 * s} ${y + 3 * s} q${5 * s} -${5 * s} ${10 * s} 0" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  return `<path d="M${x - 6 * s} ${y} q${3 * s} ${4 * s} ${6 * s} 0 q${3 * s} ${4 * s} ${6 * s} 0" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
}
const cheeks = (x1, x2, y, r = 5) => `<circle cx="${x1}" cy="${y}" r="${r}" fill="#ff8fab" opacity=".45"/><circle cx="${x2}" cy="${y}" r="${r}" fill="#ff8fab" opacity=".45"/>`;
const shadow = (rx = 36) => `<ellipse cx="60" cy="114" rx="${rx}" ry="4" fill="rgba(0,0,0,.18)"/>`;
/** Round "blob" body (head and body in one), like Nuppu's. */
const blob = (l, t, r, fill) => `<path d="M${l} 74 Q${l} ${t} 60 ${t} Q${r} ${t} ${r} 74 Q${r} 112 60 112 Q${l} 112 ${l} 74Z" fill="${fill}"/>`;
/** Draw a shape and its mirror image around x = 60. */
const pair = svg => svg + `<g transform="translate(120 0) scale(-1 1)">${svg}</g>`;

// ------------------------------------------------------------ animals
// pal: natural [body, belly, dark]. at: anchor [x, y, scale, rotate] for hat / eyes / nose / neck (Nuppu = identity).
export const ANIMALS = {
  norppa: {
    name: 'Nuppu', fi: 'norppa', en: 'Saimaa ringed seal (default)', price: 0,
    pal: ['#8e9aa8', '#b7c2cf', '#6e7a88'],
    at: {},
    draw: ([body, belly, dark], mood) => `${shadow()}
      <ellipse cx="26" cy="100" rx="13" ry="7" transform="rotate(-25 26 100)" fill="${dark}"/>
      <ellipse cx="94" cy="100" rx="13" ry="7" transform="rotate(25 94 100)" fill="${dark}"/>
      ${blob(18, 34, 102, body)}
      <ellipse cx="60" cy="92" rx="26" ry="17" fill="${belly}" opacity=".75"/>
      <g fill="none" stroke="${dark}" stroke-width="2" opacity=".55"><ellipse cx="32" cy="80" rx="5" ry="3.5"/><ellipse cx="88" cy="84" rx="5" ry="3.5"/><ellipse cx="84" cy="46" rx="4" ry="3"/><ellipse cx="34" cy="48" rx="3.5" ry="2.6"/></g>
      ${eyes(mood, [46, 62], [74, 62])}
      ${cheeks(38, 82, 75)}
      <ellipse cx="60" cy="73" rx="5" ry="3.6" fill="${NOSE}"/>
      ${mood === 'happy' ? mouth(mood, 60, 80) : mouth(mood, 60, 80, .9)}
      <g stroke="${dark}" stroke-width="1.4" stroke-linecap="round" opacity=".8"><path d="M48 76 l-14 -2"/><path d="M48 79 l-13 3"/><path d="M72 76 l14 -2"/><path d="M72 79 l13 3"/></g>`,
  },
  sadekonna: {
    name: 'Pip', fi: 'sadekonna', en: 'Desert rain frog: round, grumpy, squeaky', price: 350,
    pal: ['#c9a46b', '#ecd9b0', '#8f6c3c'],
    at: { hat: [60, 43, .82], eyes: [60, 57, 1.4], nose: [60, 71, 1.05], neck: [60, 99, .95] },
    draw: ([body, belly, dark], mood) => {
      const brow = mood === 'sad' ? 'M30 45 L46 41' : mood === 'wow' ? 'M30 41 Q38 36 46 40' : 'M30 41 L47 46';
      const frown = mood === 'wow' ? `<ellipse cx="60" cy="84" rx="4.5" ry="5.5" fill="#5a2a2a"/>`
        : `<path d="${mood === 'sad' ? 'M49 88 q11 -11 22 0' : 'M50 84 q10 -6 20 0'}" stroke="#3b2a1a" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
      return `${shadow(40)}
      <ellipse cx="32" cy="109" rx="11" ry="5" fill="${dark}"/><ellipse cx="88" cy="109" rx="11" ry="5" fill="${dark}"/>
      <path d="M14 82 Q14 48 60 48 Q106 48 106 82 Q106 112 60 112 Q14 112 14 82Z" fill="${body}"/>
      <circle cx="40" cy="56" r="15" fill="${body}"/><circle cx="80" cy="56" r="15" fill="${body}"/>
      <ellipse cx="60" cy="96" rx="30" ry="14" fill="${belly}" opacity=".85"/>
      <g fill="${dark}" opacity=".35"><circle cx="24" cy="80" r="2.4"/><circle cx="96" cy="82" r="2.8"/><circle cx="30" cy="92" r="1.8"/><circle cx="90" cy="94" r="2"/><circle cx="60" cy="56" r="1.8"/><circle cx="68" cy="62" r="1.3"/></g>
      ${mood === 'sad' ? eyes(mood, [40, 58], [80, 58], 8.5) : `<circle cx="40" cy="57" r="${mood === 'wow' ? 10 : 9}" fill="${INK}"/><circle cx="80" cy="57" r="${mood === 'wow' ? 10 : 9}" fill="${INK}"/><circle cx="43" cy="53" r="3.2" fill="#fff"/><circle cx="83" cy="53" r="3.2" fill="#fff"/><circle cx="37" cy="61" r="1.4" fill="#fff" opacity=".7"/><circle cx="77" cy="61" r="1.4" fill="#fff" opacity=".7"/>`}
      ${pair(`<path d="${brow}" stroke="${dark}" stroke-width="3.2" fill="none" stroke-linecap="round"/>`)}
      ${cheeks(29, 91, 76, 6)}
      <circle cx="56" cy="70" r="1.6" fill="${dark}"/><circle cx="64" cy="70" r="1.6" fill="${dark}"/>
      ${frown}
      <ellipse cx="44" cy="105" rx="7" ry="4" fill="${dark}" opacity=".7"/><ellipse cx="76" cy="105" rx="7" ry="4" fill="${dark}" opacity=".7"/>`;
    },
  },
  hirvi: {
    name: 'Hemmo', fi: 'hirvi', en: 'Moose with palm-sized antlers', price: 500,
    pal: ['#7b5a3c', '#bd9670', '#4b3422'],
    at: { hat: [60, 46, .86], eyes: [60, 57, .95], nose: [60, 80, 1.3], neck: [60, 101, .9] },
    draw: ([body, belly, dark], mood) => `${shadow(34)}
      ${pair(`<path d="M40 42 Q28 40 20 32 Q10 24 8 12 Q15 17 18 11 Q21 19 26 11 Q28 21 33 15 Q34 25 39 22 Q41 30 47 36Z" fill="#e6d3a8" stroke="#c4ab7a" stroke-width="1.5" stroke-linejoin="round"/>`)}
      ${pair(`<ellipse cx="25" cy="52" rx="12" ry="5.5" transform="rotate(-25 25 52)" fill="${body}"/><ellipse cx="25" cy="52" rx="7" ry="2.6" transform="rotate(-25 25 52)" fill="${belly}"/>`)}
      ${blob(22, 36, 98, body)}
      <ellipse cx="60" cy="104" rx="20" ry="8" fill="${belly}" opacity=".6"/>
      <ellipse cx="60" cy="81" rx="22" ry="16" fill="${belly}"/>
      <ellipse cx="51" cy="80" rx="3.2" ry="4.4" fill="${dark}"/><ellipse cx="69" cy="80" rx="3.2" ry="4.4" fill="${dark}"/>
      ${eyes(mood, [46, 57], [74, 57], 6.5)}
      ${cheeks(33, 87, 70, 4.5)}
      ${mouth(mood, 60, 90, .8)}`,
  },
  kettu: {
    name: 'Repo', fi: 'kettu', en: 'Red fox with a fluffy tail', price: 350,
    pal: ['#e8763a', '#fff4e8', '#a84a1c'],
    at: { hat: [60, 44, .92], eyes: [60, 60, 1.07], nose: [60, 76, 1], neck: [60, 100, .92] },
    draw: ([body, belly, dark], mood) => `${shadow(38)}
      <path d="M86 104 Q118 98 113 66 Q110 50 98 56 Q104 76 84 92Z" fill="${body}"/>
      <path d="M113 66 Q110 50 98 56 Q103 63 104 71 Q111 73 113 66Z" fill="${belly}"/>
      ${pair(`<path d="M24 56 L28 16 L54 38Z" fill="${body}" stroke-linejoin="round"/><path d="M31 46 L32 26 L46 38Z" fill="${dark}" opacity=".75"/>`)}
      ${blob(20, 36, 100, body)}
      <path d="M23 70 Q40 64 60 75 Q80 64 97 70 Q93 97 60 99 Q27 97 23 70Z" fill="${belly}"/>
      <ellipse cx="60" cy="106" rx="18" ry="6" fill="${belly}"/>
      ${eyes(mood, [45, 60], [75, 60], 6.5)}
      ${cheeks(33, 87, 75, 4.5)}
      <ellipse cx="60" cy="76" rx="5" ry="3.6" fill="${NOSE}"/>
      ${mouth(mood, 60, 83, .85)}`,
  },
  pollo: {
    name: 'Huhu', fi: 'pöllö', en: 'Eagle owl with tufty ears', price: 400,
    pal: ['#8b7660', '#e6d8c0', '#5b4a38'],
    at: { hat: [60, 44, .9], eyes: [60, 60, 1.15], nose: [60, 75, .9], neck: [60, 99, .88] },
    draw: ([body, belly, dark], mood) => {
      const eye = x => mood === 'sad'
        ? `<path d="M${x - 7} 61 q7 -6 14 0" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>`
        : `<circle cx="${x}" cy="60" r="${mood === 'wow' ? 10.5 : 9.5}" fill="#ffc145"/><circle cx="${x}" cy="60" r="${mood === 'wow' ? 6.5 : 5.5}" fill="${INK}"/><circle cx="${x + 2}" cy="57.5" r="2" fill="#fff"/>`;
      return `${shadow(34)}
      ${pair(`<path d="M27 48 L22 16 L46 36Z" fill="${body}"/><path d="M29 42 L26 24 L40 36Z" fill="${dark}" opacity=".5"/>`)}
      ${blob(20, 34, 100, body)}
      ${pair(`<path d="M22 68 Q10 90 26 108 Q36 98 33 76Z" fill="${dark}"/>`)}
      <ellipse cx="60" cy="93" rx="24" ry="17" fill="${belly}"/>
      <g fill="none" stroke="${dark}" stroke-width="1.6" opacity=".5" stroke-linecap="round"><path d="M48 86 l3 3 l3 -3"/><path d="M58 84 l3 3 l3 -3"/><path d="M66 88 l3 3 l3 -3"/><path d="M52 96 l3 3 l3 -3"/><path d="M62 98 l3 3 l3 -3"/></g>
      <circle cx="44" cy="60" r="15" fill="${belly}"/><circle cx="76" cy="60" r="15" fill="${belly}"/>
      ${eye(44)}${eye(76)}
      ${mood === 'wow' ? `<ellipse cx="60" cy="78" rx="4" ry="4.5" fill="#5a2a2a"/>` : ''}
      <path d="M54.5 70 L65.5 70 L60 ${mood === 'wow' ? 74 : 80}Z" fill="#f39c34" stroke-linejoin="round"/>
      ${cheeks(31, 89, 76, 4)}
      ${pair(`<path d="M44 111 l2 -5 l2 5 l2 -5 l2 5" stroke="#f39c34" stroke-width="2.4" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`)}`;
    },
  },
  poro: {
    name: 'Poku', fi: 'poro', en: 'Lapland reindeer', price: 450,
    pal: ['#9c8267', '#f1e9dc', '#62503e'],
    at: { hat: [60, 47, .86], eyes: [60, 60, 1], nose: [60, 77, 1], neck: [60, 101, .9] },
    draw: ([body, belly, dark], mood) => `${shadow(34)}
      ${pair(`<path d="M44 42 Q36 26 30 8 M35 24 Q26 22 18 13 M32 16 Q37 11 39 4 M26 20 Q20 26 12 26" stroke="#d8c29a" stroke-width="5" fill="none" stroke-linecap="round"/>`)}
      ${pair(`<ellipse cx="25" cy="54" rx="12" ry="5" transform="rotate(-20 25 54)" fill="${body}"/><ellipse cx="25" cy="54" rx="7" ry="2.4" transform="rotate(-20 25 54)" fill="${dark}" opacity=".5"/>`)}
      ${blob(22, 38, 98, body)}
      <ellipse cx="60" cy="102" rx="24" ry="11" fill="${belly}"/>
      <ellipse cx="60" cy="81" rx="15" ry="11" fill="${belly}"/>
      <ellipse cx="60" cy="76" rx="6" ry="4.2" fill="${NOSE}"/>
      ${eyes(mood, [46, 60], [74, 60], 6.5)}
      ${cheeks(35, 85, 73, 4.5)}
      ${mouth(mood, 60, 85, .8)}`,
  },
  orava: {
    name: 'Oiva', fi: 'orava', en: 'Red squirrel with ear tufts', price: 300,
    pal: ['#c8622c', '#fbe5c8', '#8a3e17'],
    at: { hat: [60, 47, .84], eyes: [60, 62, .93], nose: [60, 75, .9], neck: [60, 100, .84] },
    draw: ([body, belly, dark], mood) => `${shadow(34)}
      <path d="M36 108 Q0 106 3 64 Q5 20 34 18 Q54 18 50 36 Q40 30 33 38 Q25 50 30 70 Q34 88 46 98Z" fill="${body}" stroke="${dark}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M13 76 Q8 40 30 30" stroke="${belly}" stroke-width="3" fill="none" opacity=".5" stroke-linecap="round"/>
      ${pair(`<path d="M31 50 L34 16 L52 40Z" fill="${body}"/><path d="M36 42 L36 25 L46 39Z" fill="${belly}" opacity=".8"/><path d="M34 17 L29 7 M34 17 L35 5 M34 17 L40 8" stroke="${dark}" stroke-width="2.6" stroke-linecap="round"/>`)}
      ${blob(24, 38, 96, body)}
      <ellipse cx="60" cy="95" rx="22" ry="15" fill="${belly}"/>
      <ellipse cx="60" cy="78" rx="14" ry="9" fill="${belly}"/>
      ${eyes(mood, [47, 62], [73, 62], 6.5)}
      ${cheeks(37, 83, 76, 4.5)}
      <ellipse cx="60" cy="74" rx="4" ry="3" fill="${NOSE}"/>
      ${mood === 'wow' ? mouth(mood, 60, 80, .8) : `<path d="M55 79 q2.5 3 5 0 q2.5 3 5 0" stroke="${INK}" stroke-width="1.8" fill="none" stroke-linecap="round"/><rect x="57" y="80.5" width="6" height="5" rx="1" fill="#fff" stroke="${dark}" stroke-width=".8"/><path d="M60 80.5 v5" stroke="${dark}" stroke-width=".8"/>`}`,
  },
  karhu: {
    name: 'Otso', fi: 'karhu', en: 'Brown bear, the king of the forest', price: 450,
    pal: ['#8a5a30', '#d1a574', '#57371b'],
    at: { hat: [60, 43, .98], eyes: [60, 60, 1.07], nose: [60, 74, 1], neck: [60, 99, 1] },
    draw: ([body, belly, dark], mood) => `${shadow()}
      ${pair(`<circle cx="30" cy="42" r="12" fill="${body}"/><circle cx="30" cy="42" r="6.5" fill="${belly}"/>`)}
      ${pair(`<ellipse cx="27" cy="104" rx="11" ry="7" fill="${dark}"/>`)}
      ${blob(18, 34, 102, body)}
      <ellipse cx="60" cy="97" rx="26" ry="14" fill="${belly}" opacity=".7"/>
      <ellipse cx="60" cy="79" rx="16" ry="12" fill="${belly}"/>
      <ellipse cx="60" cy="73" rx="6" ry="4.5" fill="${NOSE}"/>
      ${eyes(mood, [45, 60], [75, 60], 6.8)}
      ${cheeks(34, 86, 75)}
      ${mood === 'happy' ? `<path d="M60 77 v3" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>` : ''}${mouth(mood, 60, 81, .85)}`,
  },
  ilves: {
    name: 'Ilppo', fi: 'ilves', en: 'Lynx with black ear tufts', price: 500,
    pal: ['#c9a079', '#f5ead8', '#7f6143'],
    at: { hat: [60, 45, .92], eyes: [60, 60, 1.07], nose: [60, 75, .95], neck: [60, 99, 1] },
    draw: ([body, belly, dark], mood) => `${shadow()}
      ${pair(`<path d="M26 52 L32 20 L52 38Z" fill="${body}"/><path d="M32 44 L34 28 L45 38Z" fill="${belly}"/><path d="M32 21 L30 6" stroke="#2a2420" stroke-width="3.2" stroke-linecap="round"/>`)}
      ${pair(`<path d="M24 62 L10 74 L20 77 L11 88 L23 87 L18 98 L34 90Z" fill="${belly}"/><path d="M14 80 L24 78 M16 92 L26 88" stroke="${dark}" stroke-width="1.6" opacity=".6" stroke-linecap="round"/>`)}
      ${blob(20, 36, 100, body)}
      <ellipse cx="60" cy="98" rx="24" ry="13" fill="${belly}" opacity=".85"/>
      <g fill="${dark}" opacity=".45"><ellipse cx="32" cy="58" rx="2.5" ry="2"/><ellipse cx="88" cy="58" rx="2.5" ry="2"/><ellipse cx="60" cy="44" rx="2" ry="3"/><ellipse cx="52" cy="47" rx="1.6" ry="2.4"/><ellipse cx="68" cy="47" rx="1.6" ry="2.4"/><ellipse cx="30" cy="94" rx="2.4" ry="2"/><ellipse cx="90" cy="92" rx="2.4" ry="2"/><ellipse cx="38" cy="104" rx="2" ry="1.6"/><ellipse cx="82" cy="104" rx="2" ry="1.6"/></g>
      <ellipse cx="53" cy="80" rx="8.5" ry="6.5" fill="${belly}"/><ellipse cx="67" cy="80" rx="8.5" ry="6.5" fill="${belly}"/>
      ${eyes(mood, [45, 60], [75, 60], 6.8)}
      ${cheeks(34, 86, 72, 4.5)}
      <path d="M55.5 73 h9 l-4.5 5z" fill="#e88a9a" stroke="#c96a7a" stroke-width="1" stroke-linejoin="round"/>
      ${mouth(mood, 60, 81, .8)}
      <g stroke="${dark}" stroke-width="1.2" stroke-linecap="round" opacity=".7"><path d="M46 79 l-14 -3"/><path d="M46 82 l-13 2"/><path d="M74 79 l14 -3"/><path d="M74 82 l13 2"/></g>`,
  },
  siili: {
    name: 'Siiri', fi: 'siili', en: 'Hedgehog in a prickly coat', price: 300,
    pal: ['#7a5a3f', '#ecd0a8', '#4e3726'],
    at: { hat: [60, 38, .95], eyes: [60, 66, .86], nose: [60, 78, .8], neck: [60, 102, .9] },
    draw: ([body, belly, dark], mood) => {
      const pts = [];
      for (let k = 0; k <= 30; k++) {
        const a = (150 + k * (240 / 30)) * Math.PI / 180, R = k % 2 ? 50 : 39;
        pts.push(`${(60 + R * Math.cos(a)).toFixed(1)} ${(76 + R * Math.sin(a)).toFixed(1)}`);
      }
      return `${shadow(38)}
      <path d="M${pts.join(' L')} Z" fill="${body}" stroke="${dark}" stroke-width="2" stroke-linejoin="round"/>
      ${pair(`<ellipse cx="34" cy="108" rx="9" ry="5" fill="${dark}"/>`)}
      <path d="M28 82 Q28 50 60 50 Q92 50 92 82 Q92 110 60 110 Q28 110 28 82Z" fill="${belly}"/>
      ${pair(`<circle cx="36" cy="54" r="7" fill="${belly}"/><circle cx="36" cy="54" r="3.5" fill="${dark}" opacity=".45"/>`)}
      <ellipse cx="60" cy="96" rx="18" ry="11" fill="#fff" opacity=".3"/>
      ${eyes(mood, [48, 66], [72, 66], 5.6)}
      ${cheeks(40, 80, 79, 4.5)}
      <circle cx="60" cy="77" r="4.4" fill="${NOSE}"/>
      ${mouth(mood, 60, 84, .75)}`;
    },
  },
};

// ------------------------------------------------------------ accessories (drawn in Nuppu's frame)
const star = (cx, cy, R, r = R * .45) => 'M' + Array.from({ length: 10 }, (_, i) => {
  const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r : R;
  return `${(cx + q * Math.cos(a)).toFixed(1)} ${(cy + q * Math.sin(a)).toFixed(1)}`;
}).join(' L') + 'Z';
/** Points along the necklace curve from (30, 88) through (60, 104) to (90, 88). */
const arcPts = (n, y0 = 88, dip = 16) => Array.from({ length: n }, (_, i) => {
  const t = i / (n - 1), x = 30 + 60 * t, y = y0 + dip * 4 * t * (1 - t);
  return [+x.toFixed(1), +y.toFixed(1)];
});

export const HATS = {
  pipo: { name: 'Pipo', en: 'Beanie (Module 1 reward)', price: 80, svg: `<path d="M30 44 Q60 4 90 44 Z" fill="#e63946"/><rect x="28" y="40" width="64" height="10" rx="5" fill="#f1faee"/><circle cx="60" cy="14" r="8" fill="#f1faee"/>` },
  saunahattu: { name: 'Saunahattu', en: 'Felt sauna hat', price: 100, svg: `<path d="M34 44 L42 16 Q60 10 78 16 L86 44 Z" fill="#d9c3a0"/><path d="M26 44 Q60 36 94 44 Q60 52 26 44Z" fill="#c4aa82"/>` },
  tonttulakki: { name: 'Tonttulakki', en: 'Elf hat', price: 120, svg: `<path d="M30 46 Q50 10 84 6 Q96 4 100 22 Q92 18 86 24 L90 46 Z" fill="#d62828"/><rect x="28" y="40" width="64" height="9" rx="4.5" fill="#fff"/><circle cx="100" cy="24" r="7" fill="#fff"/>` },
  kalastajahattu: { name: 'Kalastajahattu', en: 'Fishing hat', price: 150, svg: `<path d="M36 40 Q38 16 60 16 Q82 16 84 40 Z" fill="#4f7d5b"/><path d="M24 42 Q60 30 96 42 L92 48 Q60 40 28 48 Z" fill="#3e6849"/>` },
  kukkaseppele: { name: 'Kukkaseppele', en: 'Midsummer flower crown (Module 3 reward)', price: 200, svg: [24, 38, 52, 66, 80, 94].map((x, i) => `<circle cx="${x + 1}" cy="${42 - Math.sin((i / 5) * Math.PI) * 8}" r="7" fill="${['#ffd166', '#ff6f91', '#fff', '#c58bff', '#ffd166', '#ff6f91'][i]}"/><circle cx="${x + 1}" cy="${42 - Math.sin((i / 5) * Math.PI) * 8}" r="2.5" fill="#f4a261"/>`).join('') },
  ylioppilaslakki: { name: 'Ylioppilaslakki', en: 'Graduation cap (Module 4 reward)', price: 400, svg: `<path d="M34 42 Q60 18 86 42 Z" fill="#fff" stroke="#ddd"/><rect x="30" y="38" width="60" height="8" rx="3" fill="#111"/><circle cx="60" cy="30" r="3.5" fill="#e8b53b"/>` },
  kruunu: { name: 'Kruunu', en: 'Crown (bonus module reward)', price: 600, svg: `<path d="M34 44 L36 18 L48 32 L60 12 L72 32 L84 18 L86 44 Z" fill="#ffd166" stroke="#e8a317" stroke-width="2"/><circle cx="60" cy="30" r="3" fill="#e63946"/><circle cx="45" cy="38" r="2.4" fill="#5ab0ff"/><circle cx="75" cy="38" r="2.4" fill="#3ddc97"/>` },
  lippis: { name: 'Lippis', en: 'Baseball cap, worn sideways', price: 90, svg: `<path d="M34 44 Q33 18 60 18 Q87 18 86 44Z" fill="#2a6fdb"/><path d="M58 40 Q90 36 106 45 Q90 51 58 46Z" fill="#1f56ad"/><path d="M60 18 V44 M44 22 Q48 34 46 44 M76 22 Q72 34 74 44" stroke="#1f56ad" stroke-width="1.4" fill="none"/><circle cx="60" cy="18.5" r="3" fill="#1f56ad"/>` },
  baskeri: { name: 'Baskeri', en: 'Artist\'s beret', price: 110, svg: `<path d="M27 41 Q22 22 52 19 Q88 16 92 35 Q90 45 60 45 Q32 46 27 41Z" fill="#c1121f"/><path d="M30 41 Q60 47 90 39" stroke="#8d0c17" stroke-width="2" fill="none"/><path d="M56 19 l2 -6" stroke="#8d0c17" stroke-width="3" stroke-linecap="round"/>` },
  silinteri: { name: 'Silinteri', en: 'Top hat for fancy occasions', price: 300, svg: `<rect x="40" y="6" width="40" height="36" rx="3" fill="#1b1b1b"/><rect x="40" y="31" width="40" height="7" fill="#e63946"/><ellipse cx="60" cy="43" rx="31" ry="5.5" fill="#111"/><path d="M44 10 v18" stroke="#fff" stroke-width="2" opacity=".18" stroke-linecap="round"/>` },
  karvalakki: { name: 'Karvalakki', en: 'Fur hat for -30 °C', price: 160, svg: `<path d="M34 34 Q35 10 60 10 Q85 10 86 34Z" fill="#5a4636"/><path d="M60 10 V34" stroke="#463628" stroke-width="2"/><path d="M24 46 Q22 28 60 27 Q98 28 96 46 Q96 53 60 53 Q24 53 24 46Z" fill="#9c7a5b"/><path d="M30 34 q4 -3 8 0 M46 30 q4 -3 8 0 M64 30 q4 -3 8 0 M82 34 q4 -3 8 0 M38 46 q4 -3 8 0 M56 44 q4 -3 8 0 M74 46 q4 -3 8 0" stroke="#7d5f44" stroke-width="1.6" fill="none" stroke-linecap="round"/>` },
  viikinkikypara: { name: 'Viikinkikypärä', en: 'Horned helmet', price: 350, svg: `${pair(`<path d="M35 33 Q18 30 15 10 Q26 23 39 25Z" fill="#f1e3c6" stroke="#c9b48a" stroke-width="1.5" stroke-linejoin="round"/>`)}<path d="M32 44 Q32 14 60 14 Q88 14 88 44Z" fill="#9aa5b1"/><path d="M60 14 V44" stroke="#7b8794" stroke-width="5"/><rect x="29" y="38" width="62" height="9" rx="3" fill="#6c7a89"/><g fill="#dfe5eb"><circle cx="38" cy="42.5" r="1.6"/><circle cx="50" cy="42.5" r="1.6"/><circle cx="70" cy="42.5" r="1.6"/><circle cx="82" cy="42.5" r="1.6"/></g>` },
  merimieslakki: { name: 'Merimieslakki', en: 'Sailor cap', price: 140, svg: `<path d="M30 38 Q28 20 60 18 Q92 20 90 38Z" fill="#fff" stroke="#cfd8e3" stroke-width="1.5"/><rect x="30" y="35" width="60" height="10" rx="4" fill="#1d3557"/><path d="M40 45 Q60 53 80 45Z" fill="#111"/><path d="M60 37 v6 M57 39 h6 M56.5 41.5 q3.5 3 7 0" stroke="#ffd166" stroke-width="1.4" fill="none" stroke-linecap="round"/>` },
  kokinhattu: { name: 'Kokinhattu', en: 'Chef\'s hat: pulla master', price: 180, svg: `<circle cx="43" cy="20" r="12" fill="#fff" stroke="#e1e1e1" stroke-width="1.5"/><circle cx="77" cy="20" r="12" fill="#fff" stroke="#e1e1e1" stroke-width="1.5"/><circle cx="60" cy="13" r="15" fill="#fff" stroke="#e1e1e1" stroke-width="1.5"/><rect x="38" y="22" width="44" height="23" rx="3" fill="#fff"/><path d="M38 38 h44" stroke="#e1e1e1" stroke-width="1.5"/><path d="M50 26 v10 M60 24 v12 M70 26 v10" stroke="#ececec" stroke-width="1.5"/>` },
  lannenhattu: { name: 'Lännenhattu', en: 'Cowboy hat', price: 220, svg: `<path d="M40 38 Q37 12 50 15 Q60 21 70 15 Q83 12 80 38Z" fill="#a0672e"/><rect x="40" y="31" width="40" height="6" fill="#5c3a17"/><path d="M16 34 Q28 46 60 44 Q92 46 104 34 Q106 46 90 50 Q60 56 30 50 Q14 46 16 34Z" fill="#8a5523"/>` },
  noitahattu: { name: 'Noitahattu', en: 'Witch hat for Easter (virpominen)', price: 200, svg: `<path d="M34 42 Q50 30 64 0 Q68 16 80 26 Q72 28 74 34 L86 42Z" fill="#3c2a5a"/><ellipse cx="60" cy="43" rx="35" ry="6" fill="#2b1d42"/><path d="M36 38 Q60 42 84 38 L85 42 Q60 46 35 42Z" fill="#ffd166"/><rect x="55" y="36.5" width="10" height="7" rx="1" fill="none" stroke="#e8a317" stroke-width="1.6"/>` },
  korvalaput: { name: 'Korvalaput', en: 'Fluffy earmuffs', price: 120, svg: `<path d="M27 48 Q27 16 60 16 Q93 16 93 48" stroke="#5ab0ff" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="26" cy="50" r="11" fill="#fff"/><circle cx="94" cy="50" r="11" fill="#fff"/><circle cx="26" cy="50" r="6" fill="#ff8fab"/><circle cx="94" cy="50" r="6" fill="#ff8fab"/>` },
  olkihattu: { name: 'Olkihattu', en: 'Straw hat for the summer cottage', price: 130, svg: `<ellipse cx="60" cy="42" rx="41" ry="8" fill="#f4d58d" stroke="#d4a84b" stroke-width="1.5"/><path d="M40 41 Q39 20 60 20 Q81 20 80 41Z" fill="#e9c46a"/><path d="M40 33 Q60 37 80 33 L80 39 Q60 43 40 39Z" fill="#e63946"/><path d="M48 25 l4 4 M64 23 l4 4 M70 27 l3 3" stroke="#c99a3a" stroke-width="1.2" stroke-linecap="round"/>` },
  juhlahattu: { name: 'Juhlahattu', en: 'Party hat for name days', price: 100, svg: `<g transform="rotate(-10 60 44)"><path d="M44 44 L60 6 L76 44Z" fill="#5ab0ff"/><path d="M52 25 L68 25 M48 35 L72 35" stroke="#ffd166" stroke-width="4"/><circle cx="60" cy="6" r="5.5" fill="#ff6f91"/><path d="M42 44 Q60 48 78 44" stroke="#ff6f91" stroke-width="3" fill="none" stroke-linecap="round"/></g>` },
  sadekeha: { name: 'Sädekehä', en: 'Halo for perfect sessions', price: 450, svg: `<ellipse cx="60" cy="16" rx="23" ry="6.5" fill="none" stroke="#ffd166" stroke-width="7" opacity=".3"/><ellipse cx="60" cy="16" rx="23" ry="6.5" fill="none" stroke="#ffd166" stroke-width="3.5"/>` },
  propellilakki: { name: 'Propellilakki', en: 'Propeller cap', price: 170, svg: `<path d="M34 44 Q34 20 60 20 Q86 20 86 44Z" fill="#ffd166"/><path d="M60 20 Q48 30 46 44 L34 44 Q34 24 60 20Z" fill="#e63946"/><path d="M60 20 Q72 30 74 44 L86 44 Q86 24 60 20Z" fill="#5ab0ff"/><rect x="32" y="40" width="56" height="6" rx="3" fill="#3ddc97"/><path d="M60 20 V11" stroke="#555" stroke-width="2.5"/><ellipse cx="50" cy="10" rx="10" ry="3" fill="#e63946"/><ellipse cx="70" cy="10" rx="10" ry="3" fill="#5ab0ff"/><circle cx="60" cy="10" r="2.5" fill="#555"/>` },
  tiara: { name: 'Tiara', en: 'Sparkly silver tiara', price: 380, svg: `<path d="M36 44 L40 30 L49 38 L60 20 L71 38 L80 30 L84 44 Q60 39 36 44Z" fill="#e0e7ef" stroke="#9aa8b8" stroke-width="1.6" stroke-linejoin="round"/><circle cx="60" cy="33" r="3.6" fill="#ff6fb5"/><circle cx="45" cy="40" r="2" fill="#5ab0ff"/><circle cx="75" cy="40" r="2" fill="#5ab0ff"/><circle cx="60" cy="20" r="2" fill="#fff"/>` },
  pyorailykypara: { name: 'Pyöräilykypärä', en: 'Bike helmet: safety first', price: 150, svg: `<path d="M27 47 Q27 15 60 15 Q93 15 93 47Z" fill="#3ddc97"/><path d="M27 47 h66" stroke="#1f8f5f" stroke-width="4" stroke-linecap="round"/><g stroke="#1b5e40" stroke-width="3" stroke-linecap="round"><path d="M46 22 l-4 12"/><path d="M60 19 v13"/><path d="M74 22 l4 12"/></g>` },
  rusettipanta: { name: 'Rusettipanta', en: 'Headband with a big bow', price: 90, svg: `<path d="M30 44 Q60 26 90 44" stroke="#ff6f91" stroke-width="5" fill="none" stroke-linecap="round"/><g transform="translate(78 31) rotate(18)"><path d="M0 0 l-14 -9 v18z M0 0 l14 -9 v18z" fill="#ff6f91" stroke="#e0487a" stroke-width="1.4" stroke-linejoin="round"/><circle r="4" fill="#e0487a"/></g>` },
  kirjoneulepipo: { name: 'Kirjoneulepipo', en: 'Nordic knit beanie', price: 140, svg: `<path d="M30 46 Q30 14 60 14 Q90 14 90 46Z" fill="#1d4e89"/><path d="M34 30 l6 -5 l6 5 l6 -5 l6 5 l6 -5 l6 5 l6 -5 l6 5 l6 -5" stroke="#fff" stroke-width="2" fill="none"/><rect x="28" y="38" width="64" height="11" rx="5" fill="#fff"/><g fill="#e63946"><path d="M36 43.5 l3 -3 l3 3 l-3 3z"/><path d="M48 43.5 l3 -3 l3 3 l-3 3z"/><path d="M60 43.5 l3 -3 l3 3 l-3 3z" transform="translate(-3 0)"/><path d="M69 43.5 l3 -3 l3 3 l-3 3z"/><path d="M81 43.5 l3 -3 l3 3 l-3 3z"/></g><circle cx="60" cy="12" r="8" fill="#fff"/>` },
  karpassieni: { name: 'Kärpässieni', en: 'Fly agaric mushroom cap', price: 260, svg: `<path d="M22 44 Q24 6 60 6 Q96 6 98 44 Q60 36 22 44Z" fill="#e63946"/><path d="M26 44 Q60 50 94 44 Q60 39 26 44Z" fill="#f6efe4"/><g fill="#fff"><circle cx="44" cy="20" r="5"/><circle cx="66" cy="15" r="4"/><circle cx="80" cy="28" r="4.5"/><circle cx="34" cy="34" r="3.5"/><circle cx="58" cy="31" r="3"/></g>` },
  luciakruunu: { name: 'Luciakruunu', en: 'Lucia candle crown (13 December)', price: 420, svg: `${[34, 47, 60, 73, 86].map((x, i) => { const h = i === 2 ? 22 : 16, y = 40 - h - (i === 2 ? 2 : i % 2 ? 1 : 0); return `<rect x="${x - 3}" y="${y}" width="6" height="${h}" rx="2" fill="#fffaf0" stroke="#e8dcc0" stroke-width="1"/><path d="M${x} ${y - 9} q4 5 0 8 q-4 -3 0 -8z" fill="#ffb703"/><circle cx="${x}" cy="${y - 3}" r="1.6" fill="#fff3b0"/>`; }).join('')}<path d="M28 44 Q60 34 92 44" stroke="#2f6f4e" stroke-width="8" fill="none" stroke-linecap="round"/><g fill="#e63946"><circle cx="40" cy="41" r="2.2"/><circle cx="60" cy="38" r="2.2"/><circle cx="80" cy="41" r="2.2"/></g>` },
  merirosvohattu: { name: 'Merirosvohattu', en: 'Pirate tricorn', price: 240, svg: `<path d="M20 42 Q28 12 60 20 Q92 12 100 42 Q60 32 20 42Z" fill="#1b1b1b"/><path d="M20 42 Q60 32 100 42" stroke="#ffd166" stroke-width="2.5" fill="none"/><circle cx="60" cy="27" r="4.5" fill="#fff"/><path d="M53 33 l14 4 M67 33 l-14 4" stroke="#fff" stroke-width="2" stroke-linecap="round"/><circle cx="58.3" cy="27" r="1.1" fill="#1b1b1b"/><circle cx="61.7" cy="27" r="1.1" fill="#1b1b1b"/>` },
};

export const FACES = {
  silmalasit: { name: 'Silmälasit', en: 'Glasses', price: 60, svg: `<circle cx="46" cy="62" r="11" fill="none" stroke="#3a2a1a" stroke-width="2.5"/><circle cx="74" cy="62" r="11" fill="none" stroke="#3a2a1a" stroke-width="2.5"/><path d="M57 62 h6" stroke="#3a2a1a" stroke-width="2.5"/>` },
  aurinkolasit: { name: 'Aurinkolasit', en: 'Sunglasses (Module 2 reward)', price: 100, svg: `<rect x="34" y="55" width="22" height="14" rx="6" fill="#111"/><rect x="64" y="55" width="22" height="14" rx="6" fill="#111"/><rect x="55" y="59" width="10" height="3" fill="#111"/><path d="M38 58 l6 0" stroke="#666" stroke-width="2"/>` },
  sydanlasit: { name: 'Sydänlasit', en: 'Heart glasses', price: 150, svg: `<path d="M46 72 l-10-10 a6 6 0 0 1 10-7 a6 6 0 0 1 10 7z" fill="#ff4d8d"/><path d="M74 72 l-10-10 a6 6 0 0 1 10-7 a6 6 0 0 1 10 7z" fill="#ff4d8d"/><path d="M56 62 h8" stroke="#ff4d8d" stroke-width="2.5"/>` },
  monokkeli: { name: 'Monokkeli', en: 'Very distinguished monocle', price: 120, svg: `<circle cx="74" cy="62" r="10.5" fill="#bfe6ff" fill-opacity=".3" stroke="#d4a017" stroke-width="2.6"/><path d="M83 67 Q92 82 84 98" stroke="#d4a017" stroke-width="1.3" fill="none"/>` },
  tahtilasit: { name: 'Tähtilasit', en: 'Star-shaped party glasses', price: 140, svg: `<path d="${star(45, 62, 14)}" fill="#ffd166" fill-opacity=".45" stroke="#f4a100" stroke-width="2.2" stroke-linejoin="round"/><path d="${star(75, 62, 14)}" fill="#ffd166" fill-opacity=".45" stroke="#f4a100" stroke-width="2.2" stroke-linejoin="round"/><path d="M56 60 h8" stroke="#f4a100" stroke-width="2.2"/>` },
  laskettelulasit: { name: 'Laskettelulasit', en: 'Ski goggles for Levi', price: 200, svg: `<path d="M22 62 H98" stroke="#2b2b2b" stroke-width="5" stroke-linecap="round"/><rect x="30" y="50" width="60" height="24" rx="12" fill="#ff8a3d"/><rect x="33.5" y="53.5" width="53" height="17" rx="8.5" fill="#5ab0ff"/><path d="M40 66 L50 56 M46 68 L56 58" stroke="#fff" stroke-width="2.4" opacity=".6" stroke-linecap="round"/>` },
  lasit3d: { name: '3D-lasit', en: 'Retro 3D movie glasses', price: 90, svg: `<rect x="30" y="53" width="60" height="18" rx="3" fill="#f5f5f5" stroke="#222" stroke-width="2"/><rect x="34" y="56" width="21" height="12" rx="2" fill="#e63946" fill-opacity=".85"/><rect x="65" y="56" width="21" height="12" rx="2" fill="#2ec4f1" fill-opacity=".85"/>` },
  silmalappu: { name: 'Silmälappu', en: 'Pirate eye patch', price: 110, svg: `<path d="M24 46 L40 56 M54 64 L98 74" stroke="#1b1b1b" stroke-width="2.2" stroke-linecap="round"/><ellipse cx="46" cy="62" rx="11" ry="10" fill="#1b1b1b"/>` },
  naamio: { name: 'Sankarinaamio', en: 'Superhero mask', price: 230, svg: `<path fill-rule="evenodd" d="M24 58 Q32 49 46 51 Q60 55 74 51 Q88 49 96 58 Q94 74 76 72 Q66 70 60 65 Q54 70 44 72 Q26 74 24 58Z M37 62 a9 8 0 1 0 18 0 a9 8 0 1 0 -18 0Z M65 62 a9 8 0 1 0 18 0 a9 8 0 1 0 -18 0Z" fill="#e63946"/><path d="M24 58 L14 52 M96 58 L106 52" stroke="#e63946" stroke-width="3" stroke-linecap="round"/>` },
  viikset: { name: 'Viikset', en: 'Grand moustache', price: 160, at: 'nose', svg: `<path d="M60 77 Q52 72 44 76 Q38 80 33 76 Q34 86 46 85 Q55 84 60 80 Q65 84 74 85 Q86 86 87 76 Q82 80 76 76 Q68 72 60 77Z" fill="#3b2416"/>` },
  pilottilasit: { name: 'Pilottilasit', en: 'Aviator sunglasses', price: 260, svg: `${pair(`<path d="M32 56 Q45 52 56 56 Q57 71 46 73 Q33 71 32 56Z" fill="#3c4a5c" fill-opacity=".92" stroke="#d4a017" stroke-width="2"/><path d="M37 58 l5 0" stroke="#fff" stroke-width="2" opacity=".45" stroke-linecap="round"/>`)}<path d="M56 56 Q60 52 64 56 M56 55 H64" stroke="#d4a017" stroke-width="1.8" fill="none"/>` },
  klovninena: { name: 'Klovninenä', en: 'Red clown nose', price: 70, at: 'nose', svg: `<circle cx="60" cy="74" r="7.5" fill="#e63946"/><circle cx="57.5" cy="71.5" r="2.4" fill="#fff" opacity=".7"/>` },
};

export const NECKS = {
  huivi: { name: 'Huivi', en: 'Scarf', price: 80, svg: `<path d="M24 92 Q60 104 96 92 L96 100 Q60 112 24 100 Z" fill="#457b9d"/><path d="M80 98 l6 18 l8 -4 l-6 -14z" fill="#1d3557"/>` },
  rusetti: { name: 'Rusetti', en: 'Bow tie', price: 100, svg: `<path d="M60 98 l-14 -8 v16 z M60 98 l14 -8 v16 z" fill="#e63946"/><circle cx="60" cy="98" r="4" fill="#b5202d"/>` },
  mitali: { name: 'Mitali', en: 'Medal: earned with a 30-day streak', price: null, svg: `<path d="M50 88 l10 16 l10 -16" fill="none" stroke="#5ab0ff" stroke-width="5"/><circle cx="60" cy="108" r="8" fill="#ffd166" stroke="#e8a317" stroke-width="2"/><text x="60" y="111.5" font-size="9" text-anchor="middle" fill="#a86d00" font-weight="700">1</text>` },
  helminauha: { name: 'Helminauha', en: 'Pearl necklace', price: 220, svg: arcPts(13, 90, 14).map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.3" fill="#fbf7f0" stroke="#cfc4b4" stroke-width="1"/>`).join('') },
  solmio: { name: 'Solmio', en: 'Office necktie', price: 120, svg: `<path d="M38 90 Q60 100 82 90" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M55 93 h10 l-2 7 h-6z" fill="#1d4e89"/><path d="M57 100 h6 l4 15 l-7 5 l-7 -5z" fill="#2a6fdb"/><path d="M55 108 l9 -6 M54 114 l11 -8" stroke="#ffd166" stroke-width="1.6"/>` },
  lehmankello: { name: 'Lehmänkello', en: 'Jingly cowbell', price: 150, svg: `<path d="M30 88 Q60 104 90 88" stroke="#8b4513" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M53 97 h14 l5 15 h-24z" fill="#e8b53b" stroke="#b8871b" stroke-width="1.6" stroke-linejoin="round"/><circle cx="60" cy="113.5" r="2.6" fill="#8b5e1a"/>` },
  kukkakoynnos: { name: 'Kukkaköynnös', en: 'Flower garland', price: 180, svg: arcPts(9, 89, 15).map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="5.4" fill="${['#ff6f91', '#ffd166', '#c58bff', '#fff'][i % 4]}"/><circle cx="${x}" cy="${y}" r="1.8" fill="#f4a261"/>`).join('') },
  ruokalappu: { name: 'Ruokalappu', en: 'Bib for pulla crumbs', price: 60, svg: `<path d="M40 90 Q60 99 80 90 L83 107 Q60 122 37 107Z" fill="#fff" stroke="#5ab0ff" stroke-width="2.4" stroke-linejoin="round"/><path d="M60 111 l-5 -5 a3 3 0 0 1 5 -4 a3 3 0 0 1 5 4z" fill="#ff6f91"/>` },
  kaulapanta: { name: 'Kaulapanta', en: 'Collar with a name tag', price: 90, svg: `<path d="M28 89 Q60 105 92 89" stroke="#e63946" stroke-width="6" fill="none" stroke-linecap="round"/><circle cx="60" cy="101" r="2.4" fill="none" stroke="#b8871b" stroke-width="1.6"/><circle cx="60" cy="108" r="6" fill="#ffd166" stroke="#e8a317" stroke-width="1.6"/>` },
  kultaketju: { name: 'Kultaketju', en: 'Chunky gold chain', price: 400, svg: arcPts(12, 89, 16).map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="${i % 2 ? 3.4 : 2.2}" ry="${i % 2 ? 2.2 : 3.4}" fill="none" stroke="#e8b53b" stroke-width="2.2"/>`).join('') + `<circle cx="60" cy="110" r="5" fill="#ffd166" stroke="#e8a317" stroke-width="1.6"/>` },
  suomihuivi: { name: 'Suomi-huivi', en: 'Blue-and-white fan scarf', price: 200, svg: `<path d="M24 92 Q60 104 96 92 L96 100 Q60 112 24 100Z" fill="#fff" stroke="#dfe6ee" stroke-width="1"/><path d="M24 94.6 Q60 106.6 96 94.6 L96 97.6 Q60 109.6 24 97.6Z" fill="#003580"/><path d="M80 99 l6 18 l8 -4 l-6 -14z" fill="#fff" stroke="#dfe6ee" stroke-width="1"/><path d="M82.5 105.5 l8 -3.5 M84.5 111 l8 -3.5" stroke="#003580" stroke-width="2.4"/>` },
  rohelokaulus: { name: 'Röyhelökaulus', en: 'Ruffled royal collar', price: 300, svg: arcPts(11, 88, 14).map(([x, y]) => `<circle cx="${x}" cy="${y + 3}" r="6.2" fill="#fff" stroke="#d3d3d3" stroke-width="1.2"/>`).join('') + arcPts(9, 88, 14).slice(1, -1).map(([x, y]) => `<circle cx="${x}" cy="${y - 1}" r="3.4" fill="#fdfaf3" stroke="#e1e1e1" stroke-width="1"/>`).join('') },
};

// ------------------------------------------------------------ body colours: palette swaps for any animal ([body, belly, dark])
// 'grey' is the default: each animal in its natural colours (for Nuppu that is grey).
export const COLORS = {
  grey: { name: 'Luonto', en: 'Natural colours (default)', price: 0, pal: null },
  sand: { name: 'Hiekka', en: 'Sandy fur', price: 100, pal: ['#c9a77c', '#e6cfa9', '#a3835a'] },
  mint: { name: 'Minttu', en: 'Mint green', price: 150, pal: ['#6fcfae', '#a8ead3', '#4aa688'] },
  pink: { name: 'Vaaleanpunainen', en: 'Soft pink', price: 150, pal: ['#e99ab8', '#f8c9dc', '#c0708f'] },
  midnight: { name: 'Keskiyö', en: 'Midnight blue', price: 200, pal: ['#3d4a6b', '#61719b', '#2a3450'] },
  gold: { name: 'Kulta', en: 'Solid gold', price: 500, pal: ['#e8b53b', '#ffe08a', '#b8871b'] },
  snow: { name: 'Lumi', en: 'Snow white', price: 180, pal: ['#e6ecf2', '#ffffff', '#aab6c3'] },
  coal: { name: 'Hiili', en: 'Charcoal', price: 160, pal: ['#4d525c', '#737985', '#2c3037'] },
  rust: { name: 'Ruoste', en: 'Rusty orange', price: 120, pal: ['#b5542c', '#e09a6f', '#7d3518'] },
  moss: { name: 'Sammal', en: 'Forest moss', price: 120, pal: ['#6b8f4e', '#a9c48a', '#4a6a32'] },
  lilac: { name: 'Syreeni', en: 'Lilac', price: 150, pal: ['#b39ddb', '#ddd0f2', '#8a72b8'] },
  ocean: { name: 'Meri', en: 'Deep sea blue', price: 160, pal: ['#2f6fa8', '#7fb2dd', '#1f4d78'] },
  sky: { name: 'Taivas', en: 'Sky blue', price: 130, pal: ['#8ecae6', '#cbe8f5', '#5fa3c4'] },
  berry: { name: 'Puolukka', en: 'Lingonberry red', price: 170, pal: ['#c0392b', '#e8857a', '#8e2419'] },
  cocoa: { name: 'Kaakao', en: 'Hot cocoa', price: 110, pal: ['#6b4a35', '#a07a5f', '#4a3122'] },
  peach: { name: 'Persikka', en: 'Peach', price: 130, pal: ['#f4a582', '#fbd3bf', '#d17d5a'] },
  lemon: { name: 'Sitruuna', en: 'Lemon yellow', price: 140, pal: ['#f2d64b', '#fbeda0', '#c9ad25'] },
  coral: { name: 'Koralli', en: 'Coral', price: 150, pal: ['#ff7f6e', '#ffbcae', '#d9584a'] },
  teal: { name: 'Turkoosi', en: 'Turquoise', price: 160, pal: ['#2a9d8f', '#7fd1c5', '#1b6e64'] },
  silver: { name: 'Hopea', en: 'Shiny silver', price: 350, pal: ['#b8c2cc', '#e4e9ee', '#8995a1'] },
  copper: { name: 'Kupari', en: 'Polished copper', price: 300, pal: ['#c47a3d', '#e8b088', '#8f5324'] },
  spruce: { name: 'Kuusi', en: 'Spruce green', price: 140, pal: ['#2f5d46', '#6f9c84', '#1d3d2e'] },
  plum: { name: 'Luumu', en: 'Plum purple', price: 170, pal: ['#7b3f6e', '#b67aa8', '#55284c'] },
  ice: { name: 'Jää', en: 'Glacier ice', price: 190, pal: ['#bfe3f2', '#eef9fd', '#8cc3da'] },
};
/** Back-compat: colour id → [body, belly, dark] (natural = Nuppu's grey). */
export const SEAL_COLORS = Object.fromEntries(Object.entries(COLORS).map(([k, c]) => [k, c.pal || ANIMALS.norppa.pal]));
export const ACCESSORIES = { hat: HATS, face: FACES, neck: NECKS };
/** Back-compat: { hat: {id: svg}, face: {…}, neck: {…} } */
export const ACCESSORY_SVG = Object.fromEntries(Object.entries(ACCESSORIES).map(([k, v]) => [k, Object.fromEntries(Object.entries(v).map(([id, x]) => [id, x.svg]))]));

// ------------------------------------------------------------ drawing
const REF = { hat: [60, 44], eyes: [60, 62], nose: [60, 74], neck: [60, 98] };
function place(animal, at, svg) {
  const [x, y, s = 1, r = 0] = animal.at[at] || REF[at], [rx, ry] = REF[at];
  if (x === rx && y === ry && s === 1 && !r) return svg;
  return `<g transform="translate(${x} ${y})${r ? ` rotate(${r})` : ''} scale(${s}) translate(${-rx} ${-ry})">${svg}</g>`;
}
export const animalOf = (m = {}) => ANIMALS[m.animal] ? m.animal : 'norppa';
/** The mascot as inline SVG. m = { animal, color, hat, face, neck }; mood = happy | sad | wow. */
export function mascotSVG(m = store.state().mascot, { size = 120, mood = 'happy' } = {}) {
  m ||= {};
  const id = animalOf(m), a = ANIMALS[id];
  const pal = COLORS[m.color]?.pal || a.pal;
  const wear = (slot, at) => { const it = m[slot] && ACCESSORIES[slot][m[slot]]; return it ? place(a, it.at || at, it.svg) : ''; };
  return `<svg class="mascot mascot-${id}" viewBox="0 0 120 120" width="${size}" height="${size}" aria-hidden="true">
    ${a.draw(pal, mood)}
    ${wear('face', 'eyes')}${wear('neck', 'neck')}${wear('hat', 'hat')}
  </svg>`;
}
