// Language pack: every English string the app shows → this language, plus the rewritten lessons.
import ui from './ui.js';
import words from './words.js';
import readings from './readings.js';
import m1a from './practice-m1a.js';
import m1b from './practice-m1b.js';
import m2 from './practice-m2.js';
import m34 from './practice-m34.js';
export const DICT = { ...m1a, ...m1b, ...m2, ...m34, ...readings, ...words, ...ui };
export { default as COURSE } from './course.js';
