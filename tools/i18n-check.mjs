// Check one pack file against its to-do list: node tools/i18n-check.mjs <lang> <group>
//   group: ui | words | readings | practice-m1a | practice-m1b | practice-m2 | practice-m34 | course
// Reports missing keys, {placeholder} mismatches, and values left in English. Exit code 1 if anything is missing.
import { readFileSync } from 'node:fs';
const [lang, group] = process.argv.slice(2);
if (!lang || !group) { console.error('usage: node tools/i18n-check.mjs <nl|es> <group>'); process.exit(2); }
const root = new URL('..', import.meta.url);
const todoFile = new URL(`i18n/_todo/${lang}/${group}.json`, root);
const todo = JSON.parse(readFileSync(todoFile, 'utf8'));
const mod = await import(new URL(`i18n/${lang}/${group}.js`, root).href + '?' + Date.now());
const pack = mod.default;
let bad = 0;
if (group === 'course') {
  for (const l of todo) {
    const o = pack[l.id];
    if (!o) { console.log('MISSING lesson', l.id); bad++; continue; }
    if (!o.title || !Array.isArray(o.goals) || !Array.isArray(o.learn) || !o.learn.length) { console.log('INCOMPLETE', l.id); bad++; continue; }
    for (const c of o.learn) if (!c.h || !c.body) { console.log('EMPTY CARD', l.id); bad++; }
    // the Finnish examples should survive: every *italic* Finnish chunk of the English card set should mostly reappear
    const fi = s => new Set([...JSON.stringify(s).matchAll(/\*([^*\n|]{2,40})\*/g)].map(m => m[1].toLowerCase()));
    const a = fi(l.learn), b = fi(o.learn), kept = [...a].filter(x => b.has(x)).length;
    if (a.size && kept / a.size < .6) console.log(`NOTE ${l.id}: only ${kept}/${a.size} Finnish examples kept (fine if replaced by better ones)`);
  }
  console.log(`${lang}/${group}: ${Object.keys(pack).length}/${todo.length} lessons, ${bad} problems`);
  process.exit(bad ? 1 : 0);
}
const ph = s => (String(s).match(/\{\w+\}/g) || []).sort().join();
const tags = s => (String(s).match(/<\/?\w+/g) || []).sort().join();
let english = 0;
for (const en of Object.keys(todo)) {
  const x = pack[en];
  if (x == null) { if (bad++ < 15) console.log('MISSING', JSON.stringify(en)); continue; }
  if (typeof x !== 'string') { console.log('NOT A STRING', JSON.stringify(en)); bad++; continue; }
  if (ph(en) !== ph(x)) { console.log('PLACEHOLDERS', JSON.stringify(en), '→', JSON.stringify(x)); bad++; }
  if (tags(en) !== tags(x)) console.log('NOTE html tags differ', JSON.stringify(en), '→', JSON.stringify(x));
  if (x === en && /\b(the|is|are|you|your|and|of|to|with|what|this|which)\b/i.test(en) && !/[äöÄÖ]/.test(en)) { english++; if (english <= 10) console.log('STILL ENGLISH?', JSON.stringify(en)); }
}
const extra = Object.keys(pack).filter(k => !(k in todo)).length;
console.log(`${lang}/${group}: ${Object.keys(todo).length - (bad > 0 ? Object.keys(todo).filter(k => pack[k] == null).length : 0)}/${Object.keys(todo).length} translated, ${bad} problems, ${english} possibly still English, ${extra} extra keys`);
process.exit(bad ? 1 : 0);
