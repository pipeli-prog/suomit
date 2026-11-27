// Build the pack files from the translators' chunks: node tools/i18n-assemble.mjs <lang>
// Merges i18n/_todo/<lang>/out/<group>.*.json (and what the pack file already has) into i18n/<lang>/<group>.js.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
const lang = process.argv[2];
const root = new URL('..', import.meta.url).pathname;
const out = `${root}i18n/_todo/${lang}/out/`;
const files = existsSync(out) ? readdirSync(out).filter(f => f.endsWith('.json')) : [];
const groups = [...new Set(files.map(f => f.split('.')[0]))];
for (const g of groups) {
  const packFile = `${root}i18n/${lang}/${g}.js`;
  const prev = existsSync(packFile) ? (await import(packFile + '?' + Date.now())).default : {};
  const merged = { ...prev };
  for (const f of files.filter(f => f.split('.')[0] === g).sort()) {
    let o; try { o = JSON.parse(readFileSync(out + f, 'utf8')); } catch (e) { console.error(`${f}: not valid JSON: ${e.message}`); process.exitCode = 1; continue; }
    for (const [k, v] of Object.entries(o)) if (typeof v === 'string' && v.trim()) merged[k] = v;
  }
  const head = readFileSync(packFile, 'utf8').split('\n').filter(l => l.startsWith('//')).join('\n');
  writeFileSync(packFile, `${head}\nexport default {\n${Object.entries(merged).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`).join('\n')}\n};\n`);
  console.log(`${lang}/${g}: ${Object.keys(merged).length} strings`);
}
