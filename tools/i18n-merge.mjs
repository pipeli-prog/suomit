// Add translations to a pack file without touching what it already has:
//   node tools/i18n-merge.mjs <lang> <group> <file.json>   (file: { "English": "translation" })
import { readFileSync, writeFileSync } from 'node:fs';
const [lang, group, file] = process.argv.slice(2);
const root = new URL('..', import.meta.url).pathname, packFile = `${root}i18n/${lang}/${group}.js`;
const prev = (await import(packFile + '?' + Date.now())).default, add = JSON.parse(readFileSync(file, 'utf8'));
let n = 0; const merged = { ...prev };
for (const [k, v] of Object.entries(add)) if (typeof v === 'string' && v.trim() && !(k in merged)) { merged[k] = v; n++; }
const head = readFileSync(packFile, 'utf8').split('\n').filter(l => l.startsWith('//')).join('\n');
writeFileSync(packFile, `${head}\nexport default {\n${Object.entries(merged).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`).join('\n')}\n};\n`);
console.log(`${lang}/${group}: +${n} (${Object.keys(merged).length} strings)`);
