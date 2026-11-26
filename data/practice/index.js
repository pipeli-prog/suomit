import m1a from './m1a.js';
import m1b from './m1b.js';
import m2 from './m2.js';
import m34 from './m34.js';
export const PRACTICE = {};
for (const part of [m1a, m1b, m2, m34]) for (const [lesson, sets] of Object.entries(part)) (PRACTICE[lesson] ||= []).push(...sets);
export const setsFor = (lesson, src) => (PRACTICE[lesson] || []).filter(s => !src || s.src === src);
