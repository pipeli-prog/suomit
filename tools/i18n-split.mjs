// Prepare translation work: splits i18n/_todo/<lang>/<group>.json into chunks of ~N strings
// (i18n/_todo/<lang>/in/<group>.<k>.json). Strings that are plainly Finnish (practice options, Finnish titles)
// are not sent to translators: they go straight to out/<group>.auto.json as "keep as is".
// Translators write out/<group>.<k>.json with the same keys; tools/i18n-assemble.mjs builds the pack files.
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
const [lang, N = 400] = process.argv.slice(2);
const root = new URL('..', import.meta.url).pathname;
const dir = `${root}i18n/_todo/${lang}/`;
let EN = new Set();
try { EN = new Set(readFileSync('/usr/share/dict/words', 'utf8').toLowerCase().split('\n')); } catch { }
const { VOCAB } = await import(root + 'data/vocab.js');
const FI = new Set(VOCAB.flatMap(w => [w.fi, w.gen, w.part, w.pl]).filter(Boolean).flatMap(s => s.toLowerCase().split(/[^a-zåäö-]+/)));
// Finnish = no English word of 3+ letters (that isn't also a Finnish word we teach), and something Finnish in it
const finnish = s => {
  const toks = s.toLowerCase().match(/[a-zåäö]+/g) || [];
  if (toks.some(x => ((x.length >= 3 && EN.has(x)) || ['or', 'of', 'is', 'it', 'an', 'to', 'by', 'at', 'if', 'as', 'my', 'do', 'go', 'up', 'us', 'we', 'a'].includes(x)) && !FI.has(x))) return false;
  return /[äöå]/i.test(s) || toks.some(x => FI.has(x));
};
mkdirSync(dir + 'in', { recursive: true }); mkdirSync(dir + 'out', { recursive: true });
for (const f of readdirSync(dir).filter(f => f.endsWith('.json') && f !== 'course.json')) {
  const g = f.replace('.json', ''), todo = JSON.parse(readFileSync(dir + f, 'utf8'));
  const auto = {}, rest = [];
  for (const [en, ctx] of Object.entries(todo)) (g.startsWith('practice') && finnish(en) ? (auto[en] = en) : rest.push([en, ctx]));
  if (Object.keys(auto).length) writeFileSync(`${dir}out/${g}.auto.json`, JSON.stringify(auto, null, 1));
  let k = 0;
  for (let i = 0; i < rest.length; i += +N) writeFileSync(`${dir}in/${g}.${++k}.json`, JSON.stringify(Object.fromEntries(rest.slice(i, i + +N)), null, 1));
  console.log(`${g}: ${rest.length} to translate in ${k} chunks, ${Object.keys(auto).length} Finnish kept as is`);
}
