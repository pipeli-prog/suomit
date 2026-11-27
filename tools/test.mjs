// SuomiT correctness tests: Finnish engine, every drill generator, grading, streak/coins/sync, FSRS, planning.
// Run: node tools/test.mjs        (exit code 1 on failure; prints samples with --samples)
// No dependencies, no DOM: browser globals are shimmed below.
globalThis.localStorage = { getItem: () => null, setItem() { } };
globalThis.window = globalThis;
globalThis.document = { addEventListener() { }, removeEventListener() { }, createElement() { return {}; }, querySelector() { return null; } };

// Controllable clock (store.today() and FSRS read the global Date at call time)
const RealDate = Date;
let NOW = new RealDate(2026, 10, 26, 12, 0, 0).getTime();
class FakeDate extends RealDate {
  constructor(...a) { if (a.length) super(...a); else super(NOW); }
  static now() { return NOW; }
}
globalThis.Date = FakeDate;
const setNow = (y, m, d, h = 12, mi = 0) => { NOW = new RealDate(y, m - 1, d, h, mi).getTime(); };

const root = new URL('..', import.meta.url).href;
const F = await import(root + 'js/fi.js');
const E = await import(root + 'js/exercises.js');
const store = await import(root + 'js/store.js');
const srs = await import(root + 'js/srs.js');
const plan = await import(root + 'js/plan.js');
const { VOCAB, VOCAB_BY_ID } = await import(root + 'data/vocab.js');
const { VERBS, VERB_BY_INF } = await import(root + 'data/verbs.js');
const G = await import(root + 'data/grammar.js');

let pass = 0, fail = 0;
const failures = [];
const SAMPLES = process.argv.includes('--samples');
function ok(cond, msg) { if (cond) pass++; else { fail++; if (failures.length < 400) failures.push(msg); } }
function eq(a, b, msg) { ok(JSON.stringify(a) === JSON.stringify(b), `${msg}: got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`); }
const section = name => { if (SAMPLES) console.log(`\n== ${name}`); };
const strip = s => String(s ?? '').replace(/<[^>]+>/g, '').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');
const answers = q => Array.isArray(q.answer) ? q.answer : [q.answer];
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F2FF}]/u;

// ======================================================================= 1. Finnish engine
section('fi.js');
{
  // check(): length, dots, typos that are really grammar
  const C = (i, a, o) => F.check(i, a, o);
  ok(!C('kisa', 'kissa').ok && C('kisa', 'kissa').grade === 'length', 'kisa vs kissa must be wrong (length)');
  ok(!C('kissa', 'kisa').ok, 'kissa vs kisa must be wrong');
  ok(!C('tuli', 'tuuli').ok && !C('tuuli', 'tulli').ok, 'tuli/tuuli/tulli are different words');
  ok(C('paiva', 'päivä').ok && C('paiva', 'päivä').grade === 'dots', 'paiva vs päivä: accepted with dots warning');
  ok(!C('paiva', 'päivä', { strictDots: true }).ok, 'paiva vs päivä wrong in strict mode');
  ok(C('Päivä!', 'päivä').grade === 'exact', 'case/punctuation insensitive');
  for (const [i, a] of [['kahvi', 'kahvia'], ['en puhun', 'en puhu'], ['tulimme', 'tulemme'], ['lähten', 'lähden'], ['kirjasta', 'kirjasto'],
    ['lääkäri', 'lääkärin'], ['puhelimen', 'puhelimet'], ['kirjoittamme', 'kirjoitamme'], ['opiskelin', 'opiskelen'], ['tiedän', 'tietän'], ['ymmärtän', 'ymmärrän']])
    ok(!C(i, a).ok, `"${i}" must NOT be accepted as a typo of "${a}" (it is a grammar error)`);
  ok(C('konsonamtti', 'konsonantti').grade === 'typo', 'a consonant slip mid-word is a harmless typo');
  ok(!C('', 'talo').ok, 'empty input is wrong');
  ok(C('mitä kello on', ['Paljonko kello on?', 'Mitä kello on?']).ok, 'any accepted answer matches');

  // gradeAnswer(): MC/tiles exact, no ' / ' split, strict flag, numeric cleanup
  ok(!F.gradeAnswer({ kind: 'mc', answer: 'talossa' }, 'talossä').ok, 'MC: dots-only different option is WRONG');
  ok(!F.gradeAnswer({ kind: 'mc', answer: 'Ö' }, 'O').ok, 'MC: O is not Ö');
  ok(F.gradeAnswer({ kind: 'mc', answer: 'Hi! / Bye! (casual)' }, 'Hi! / Bye! (casual)').ok, "MC: option containing ' / ' matches itself");
  ok(!F.gradeAnswer({ kind: 'mc', answer: 'Hi! / Bye! (casual)' }, 'Hi!').ok, "MC: answers are not split on ' / '");
  ok(!F.gradeAnswer({ kind: 'mc', answer: 'kyllä' }, 'kylä').ok, 'MC: kylä is not kyllä');
  ok(!F.gradeAnswer({ kind: 'tiles', answer: 'Minulla on päällä harmaat housut' }, 'Minulla on päällä harmaa housut').ok, 'tiles: harmaa/harmaat is not a typo');
  ok(F.gradeAnswer({ kind: 'tiles', answer: ['A b c', 'C b a'] }, 'C b a').ok, 'tiles: alternative order accepted');
  ok(!F.gradeAnswer({ kind: 'type', answer: 'talossa', strict: true }, 'talossä').ok, 'typed: strict flag makes dots wrong');
  ok(!F.gradeAnswer({ kind: 'type', answer: 'talossa', strictDots: true }, 'talossä').ok, 'typed: strictDots flag makes dots wrong');
  ok(F.gradeAnswer({ kind: 'type', answer: 'talossa' }, 'talossä').ok, 'typed vocab: dots lenient by default');
  ok(F.gradeAnswer({ kind: 'type', numeric: true, answer: '0401234567' }, '040-123 4567').ok, 'numeric: spaces/dashes ignored');
  ok(F.gradeAnswer({ kind: 'type', numeric: true, answer: ['-5'] }, '−5').ok, 'numeric: unicode minus');
  ok(F.gradeAnswer({ kind: 'type', synonyms: true, answer: ['sää', 'ilma'] }, 'ilma').alt === true, 'synonym answer is flagged alt');

  // harmony incl. compounds
  for (const [w, h] of [['talo', 'b'], ['metsä', 'f'], ['tie', 'f'], ['kesäkuu', 'b'], ['lentokenttä', 'f'], ['sukunimi', 'f'], ['aviomies', 'f'], ['olohuone', 'b'],
    ['Rovaniemi', 'f'], ['sapeli', 'b'], ['Tampere', 'b'], ['pysäkki', 'f'], ['jääkaappi', 'b'], ['rautatie', 'f'], ['äidinkieli', 'f']])
    eq(F.harmony(w), h, `harmony(${w})`);

  // verbs
  const V = inf => VERB_BY_INF[inf];
  eq(F.present(V('puhua')), ['puhun', 'puhut', 'puhuu', 'puhumme', 'puhutte', 'puhuvat'], 'puhua');
  eq(F.present(V('lukea')), ['luen', 'luet', 'lukee', 'luemme', 'luette', 'lukevat'], 'lukea');
  eq(F.present(V('tehdä')), ['teen', 'teet', 'tekee', 'teemme', 'teette', 'tekevät'], 'tehdä');
  eq(F.present(V('haluta')), ['haluan', 'haluat', 'haluaa', 'haluamme', 'haluatte', 'haluavat'], 'haluta');
  eq(F.present(V('tarvita')), ['tarvitsen', 'tarvitset', 'tarvitsee', 'tarvitsemme', 'tarvitsette', 'tarvitsevat'], 'tarvita');
  eq(F.present(V('syödä'))[2], 'syö', 'syödä hän');
  eq(F.negative(V('kirjoittaa'))[0], 'en kirjoita', 'en kirjoita');
  eq(F.past(V('ymmärtää')), ['ymmärsin', 'ymmärsit', 'ymmärsi', 'ymmärsimme', 'ymmärsitte', 'ymmärsivät'], 'past ymmärtää');
  eq(F.question(V('olla'), 1), 'oletko', 'oletko');
  for (const v of VERBS) {
    const pr = F.present(v);
    ok(pr.every(f => f && !f.includes('undefined')), `present(${v.inf}) complete`);
    if (v.inf !== 'olla') ok(pr[5].endsWith(F.hv('vat', v.inf)), `he-form of ${v.inf} has harmony`);
    if (v.p1) ok(F.past(v).every(Boolean), `past(${v.inf}) complete`);
  }

  // numbers, prices, clock
  eq(F.numWord(0), 'nolla', '0'); eq(F.numWord(11), 'yksitoista', '11'); eq(F.numWord(21), 'kaksikymmentäyksi', '21');
  eq(F.numWord(100), 'sata', '100'); eq(F.numWord(345), 'kolmesataaneljäkymmentäviisi', '345'); eq(F.numWord(1000), 'tuhat', '1000');
  eq(F.numWord(2024), 'kaksituhattakaksikymmentäneljä', '2024');
  ok(F.numWords(2024).includes('kaksituhatta kaksikymmentäneljä'), 'space after thousands accepted');
  ok(F.numSpoken(77).includes('seiskytseittemän') && F.numSpoken(88).includes('kasikytkaheksan'), 'spoken 70s/80s variants');
  eq(F.priceWords(2, 50)[0], 'kaksi euroa viisikymmentä senttiä', 'price canonical');
  ok(F.priceWords(2, 50).includes('kaks viiskyt') && F.priceWords(2, 50).includes('kaksi viisikymmentä'), 'price short forms for 10+ cents');
  ok(!F.priceWords(9, 7).includes('yhdeksän seitsemän'), '9,07 € must not be "yhdeksän seitsemän" (sounds like 9,70)');
  eq(F.priceSay(9, 7), 'yhdeksän euroa seitsemän senttiä', 'ambiguous cents are said in full');
  eq(F.priceWords(1, 1)[0], 'yksi euro yksi sentti', 'singular euro/cent');
  // written and spoken style mix word by word
  for (const mixed of ['kaksi euroa kolkyt', 'kaks euroa viisikymmentä senttiä', 'kaksi euroo viiskyt senttii', 'kaks viisikymmentä', 'kaksi viiskyt', 'kaks euroa ja viiskyt senttiä'])
    ok(F.priceWords(2, 50).includes(mixed.replace('kolkyt', 'viiskyt')), `price mixes written/spoken per word: ${mixed}`);
  ok(F.priceWords(1, 30).includes('euro kolkyt') && F.priceWords(1, 30).includes('yks euro kolmekymmentä'), '1,30 € mixed + "euro kolkyt"');
  ok(F.priceWords(17, 90).includes('seittemäntoista euroa ysikyt') && F.priceWords(17, 90).includes('seitsemäntoista yheksänkyt'), '17,90 € mixed');
  ok(!F.priceWords(9, 7).some(w => /^\S+ \S+$/.test(w)), 'no two-word short form for 1–9 cents');
  ok(F.priceWords(5, 0).includes('viis euroa') && F.priceWords(5, 0).includes('viisi euroo'), '5 € both styles');
  eq(F.clockWords(12, 30)[0], 'puoli yksi', '12:30 → puoli yksi (rollover)');
  eq(F.clockWords(12, 45)[0], 'varttia vaille yksi', '12:45 rollover');
  eq(F.clockWords(11, 30)[0], 'puoli kaksitoista', '11:30');
  eq(F.clockWords(3, 15)[0], 'varttia yli kolme', '3:15');
  ok(F.clockWords(3, 15).includes('vartin yli kolme'), 'vartin yli accepted');
  ok(F.clockWords(2, 50).includes('kymmentä vaille kolme') && F.clockWords(2, 50).includes('kymmenen vaille kolme'), '2:50 both forms');
  eq(F.hourAblative(13), 'yhdeltä', '13 → yhdeltä'); eq(F.hourAblative(12), 'kahdeltatoista', '12 → kahdeltatoista');

  // local cases
  const place = fi => G.PLACES.find(p => p.fi === fi);
  eq(F.local(place('tori')), { missa: 'torilla', mista: 'torilta', mihin: 'torille' }, 'tori outer');
  eq(F.local(place('Helsinki')).missa, 'Helsingissä', 'Helsingissä');
  eq(F.local(place('Rovaniemi')).missa, 'Rovaniemellä', 'Rovaniemellä');
  eq(F.local(place('Tampere')).mista, 'Tampereelta', 'Tampereelta');
  eq(F.local(place('lentokenttä')).mihin, 'lentokentälle', 'lentokentälle');
  for (const p of G.PLACES) { const l = F.local(p); ok(l.missa && l.mista && l.mihin, `local(${p.fi}) complete`); }
}

// ======================================================================= 2. Data invariants the drills rely on
section('data');
{
  const nouns = VOCAB.filter(w => w.pos === 'n' && w.gen && w.part && w.pl && !w.fi.includes(' ') && w.fi === w.fi.toLowerCase());
  for (const w of nouns) {
    ok(w.gen.endsWith('n'), `${w.fi}: genitive ends in -n (${w.gen})`);
    ok(/[aä]$/.test(w.part), `${w.fi}: partitive ends in -a/-ä (${w.part})`);
    // partitive harmony follows the word, except meri → merta (a real exception)
    if (!['meri'].includes(w.fi)) ok((F.harmony(w.fi) === 'b') === w.part.endsWith('a'), `${w.fi}: partitive ${w.part} has the right vowel harmony`);
    ok(!E.partExplain(w).includes('undefined'), `partExplain(${w.fi})`);
  }
  const partEx = fi => strip(E.partExplain(VOCAB_BY_ID['w:' + fi]));
  ok(/-si/.test(partEx('käsi')), 'käsi → kättä explained as a -si word (not "ends in -e")');
  ok(/old -i words|by heart/.test(partEx('lumi')), 'lumi → lunta explained as an exception');
  ok(/two different vowels/.test(partEx('museo')), 'museo → museota: two vowels');
  ok(/-nen/.test(partEx('nainen')), 'nainen → naista: -nen');
  ok(/-e /.test(partEx('huone')), 'huone → huonetta: -e word');
  ok(/consonant/.test(partEx('olut')), 'olut → olutta: consonant');
  for (const name of ['kissa', 'koira', 'auto', 'pyörä', 'hevonen', 'puhelin', 'avain', 'sateenvarjo', 'kynä', 'porkkana', 'paita', 'hattu', 'housut', 'punainen', 'harmaa'])
    ok(VOCAB_BY_ID['w:' + name], `drill word "${name}" exists in vocab`);
  for (const w of ['punainen', 'sininen', 'musta', 'valkoinen', 'vihreä', 'keltainen', 'harmaa', 'ruskea']) ok(VOCAB_BY_ID['w:' + w]?.pl, `colour ${w} has a plural`);
  // gradation classifier
  const gr = fi => E.gradation(VOCAB_BY_ID['w:' + fi]);
  eq(gr('kauppa')?.group, 'A', 'kauppa A'); eq(gr('sade')?.group, 'B', 'sade B'); eq(gr('hammas')?.group, 'B', 'hammas B');
  eq(gr('pöytä')?.group, 'A', 'pöytä A'); eq(gr('kirkko')?.group, 'A', 'kirkko A');
  eq(gr('talo'), null, 'talo: no gradation'); eq(gr('nainen'), null, 'nainen: not gradation'); eq(gr('avain'), null, 'avain: not gradation');
}

// ======================================================================= 3. Every drill: structure + correctness bars
section('skills');
const clean = s => F.norm(s);
for (const sk of Object.keys(E.SKILL_NAMES)) {
  const seen = new Map();
  ok(E.SKILL_ICON[sk], `${sk} has an icon`);
  for (let i = 0; i < 300; i++) {
    let q;
    try { q = E.SKILLS[sk](); } catch (e) { ok(false, `${sk} threw: ${e.message}`); break; }
    const txt = [q.prompt, q.sub, JSON.stringify(q.answer), q.say, q.explain, q.reveal, (q.choices || []).join('|'), (q.tiles || []).join('|')].join(' ');
    ok(!/undefined|NaN|\[object/.test(strip(txt)), `${sk}: no undefined/NaN in "${strip(q.prompt)} → ${JSON.stringify(q.answer)}"`);
    ok(!EMOJI.test(txt), `${sk}: no emoji in UI strings`);
    ok(['mc', 'type', 'tiles'].includes(q.kind), `${sk}: kind ${q.kind}`);
    ok(answers(q).length && answers(q).every(a => typeof a === 'string' && a.trim()), `${sk}: answers non-empty`);
    ok(answers(q).length === new Set(answers(q).map(clean)).size, `${sk}: no duplicate accepted answers ${JSON.stringify(q.answer)}`);
    // English prompt grammar
    const en = strip(q.prompt + ' ' + (q.sub || ''));
    ok(!/\ba [aeiou]/i.test(en.replace(/\ba u(ni|s)/gi, '')), `${sk}: "a" before a vowel: ${en}`);
    ok(!/he\/she (live|speak|go|come|eat|drink|like|want|read|write|sleep|have|do|is not|don't)\b/.test(en), `${sk}: he/she + base verb: ${en}`);
    ok(!/(in|at|to|from) the (?!USA|Netherlands|United)[A-ZÄÖ]/.test(en), `${sk}: article before a place name: ${en}`);
    if (q.kind === 'mc') {
      ok(q.choices.length >= 2 && q.choices.length <= 4, `${sk}: 2-4 choices`);
      ok(q.choices.filter(c => c === q.answer).length === 1, `${sk}: answer appears exactly once in choices`);
      ok(new Set(q.choices.map(clean)).size === q.choices.length, `${sk}: distinct choices ${q.choices}`);
      ok(F.gradeAnswer(q, q.answer).ok && q.choices.filter(c => F.gradeAnswer(q, c).ok).length === 1, `${sk}: exactly one choice grades as right`);
    }
    if (q.kind === 'tiles') {
      for (const a of answers(q)) {
        const bag = [...q.tiles];
        const fits = a.split(' ').every(t => { const k = bag.findIndex(b => clean(b) === clean(t)); if (k < 0) return false; bag.splice(k, 1); return true; });
        ok(fits, `${sk}: accepted answer "${a}" can be built from the tiles ${q.tiles}`);
      }
      ok(F.gradeAnswer(q, answers(q)[0]).ok, `${sk}: tiles answer grades right`);
    }
    if (q.kind === 'type') for (const a of answers(q)) ok(F.gradeAnswer(q, a).ok, `${sk}: accepted answer "${a}" grades right`);
    const key = strip(q.prompt) + ' | ' + (q.sub || '') + ' => ' + JSON.stringify(q.answer);
    seen.set(key, q);
  }
  if (SAMPLES) { console.log(`-- ${sk}: ${seen.size} unique`); [...seen.keys()].slice(0, 6).forEach(k => console.log('   ' + k)); }
}

// ---- skill-specific teaching checks
section('skill specifics');
const many = (sk, n = 400) => Array.from({ length: n }, () => E.SKILLS[sk]());
{
  // days: weekday arithmetic and tense
  const D = G.DAYS.map(d => d[0]);
  for (const q of many('days')) {
    const m = strip(q.prompt).match(/Tänään on (\w+)\. Mikä päivä (on|oli) (\w+)\?/);
    if (!m) continue;
    const off = G.RELDAYS.find(r => r[0] === m[3])[1];
    eq(q.answer, D[(D.indexOf(m[1]) + off + 7) % 7], `days: ${m[0]}`);
    eq(m[2], off < 0 ? 'oli' : 'on', `days tense: ${m[0]}`);
    ok(!q.choices.includes(m[1]), 'days: today is not offered as an answer');
    ok(q.say.includes(` ${m[2]} `), 'days: spoken question uses the same tense');
  }
  // opposites: vanha has two opposites, never both offered
  for (const q of many('opposites', 800)) {
    const x = strip(q.prompt).split(/\s/)[0].replace(/[a-z ,;()]+$/i, m => m);
    const opp = new Set(G.OPPOSITES.filter(p => q.choices.some(c => p.includes(c))).flat());
    const right = q.choices.filter(c => G.OPPOSITES.some(p => p.includes(c) && p.some(o => strip(q.prompt).startsWith(o) && o !== c)));
    ok(right.length === 1, `opposites: exactly one opposite among ${q.choices} for "${strip(q.prompt)}"`);
  }
  // qwords: alternative-valid words never offered
  for (const q of many('qwords')) {
    const p = strip(q.prompt);
    if (p.includes('thank you')) ok(!q.choices.includes('Kuinka'), 'qwords: Kuinka sanotaan is also right');
    if (p.startsWith('___ kello on')) ok(q.answer === 'Mitä' && !q.choices.includes('Paljonko'), 'qwords: Mitä kello on is the answer, Paljonko never a wrong option');
    if (p.startsWith('___ tämä on')) ok(!q.choices.includes('Mitä'), 'qwords: Mitä tämä on is also right');
    if (p.startsWith('___ vanha')) ok(!q.choices.includes('Miten'), 'qwords: Miten vanha (colloquial)');
  }
  // phrases: situations with several fine answers
  for (const q of many('phrases')) {
    const s = strip(q.prompt);
    if (s.startsWith("You didn't understand")) ok(!q.choices.includes('Anteeksi!'), 'phrases: Anteeksi also fits not understanding');
    if (s.startsWith('You leave a shop')) ok(!q.choices.includes('Kiitos!'), 'phrases: Kiitos also fits leaving a shop');
  }
  // ollaQ: no pronoun drop in 3rd person
  for (const q of many('ollaQ')) for (const a of answers(q)) ok(!/^(Onko|Ovatko) (kotona|väsynyt|suomalainen|opettaja|iloinen|myöhässä|töissä|väsyneitä|suomalaisia|opettajia|iloisia)$/.test(a), `ollaQ: "${a}" drops hän/he`);
  // verb subs: he/she takes -s
  for (const q of [...many('vt1'), ...many('vt15')]) if (q.sub.startsWith('he/she ')) ok(/^he\/she (\w+s|can)\b/.test(q.sub), `3rd person English: ${q.sub}`);
  for (const q of [...many('vt1neg'), ...many('vt15neg')]) if (q.sub.startsWith('he/she ')) ok(/doesn't|can't/.test(q.sub), `he/she doesn't: ${q.sub}`);
  // verbs: pronoun optional
  for (const q of many('vt15')) ok(answers(q).length === 2 && answers(q)[1].endsWith(answers(q)[0]), 'vt15 accepts with and without pronoun');
  // clothes: both word orders, plural adjective
  for (const q of many('clothes')) { eq(answers(q).length, 2, 'clothes: two word orders'); ok(!/I'm wearing a [a-z]+ (trousers|jeans|shorts|gloves|sneakers)/.test(strip(q.prompt)), 'clothes: no "a" with plural clothes'); }
  // harmony MC: the right ending matches the engine
  for (const q of many('harmony')) ok(q.choices.length === 2, 'harmony: two choices');
  // prices: listening uses an unambiguous spoken form
  for (const q of many('prices')) if (q.kind === 'type') for (const a of q.answer) ok(F.gradeAnswer(q, a, { strictDots: true }).ok, `prices accepts "${a}"`);
  for (const q of many('prices')) if (q.kind === 'mc') { const [e, c = '0'] = q.answer.replace(' €', '').split(','); ok(q.say === `Se maksaa ${F.priceSay(+e, +c)}.`, `prices say ${q.say}`); }
  // clock: 12-hour words
  for (const q of many('clock')) if (q.kind === 'type') { const [h, m] = strip(q.prompt).split(':').map(Number); eq(answers(q)[0], F.clockWords(h, m)[0], 'clock canonical'); }
  // genitivePron: possessive suffix forms
  const gp = many('genitivePron', 600).map(q => answers(q)).flat();
  ok(gp.includes('minun autoni') && gp.includes('hänen nimensä') && gp.includes('äitini') && gp.includes('teidän puhelimenne'), 'genitivePron accepts standard possessive suffixes');
  ok(!gp.includes('autonsa') && !gp.includes('nimensä'), 'genitivePron: 3rd person needs the pronoun');
  // local: English for koti/työ
  for (const q of many('local')) { const s = strip(q.sub); ok(!/the (home|work)\b/.test(s), `local English: ${s}`); }
  // postpos: no nonsense
  for (const q of many('postpos')) ok(!/inside the (table|door|window|mirror|chair|sofa|bed|shelf|computer)/.test(strip(q.prompt)), `postpos sense: ${strip(q.prompt)}`);
  // partNeg: negatives take a partitive object
  for (const q of many('partNeg')) { const a = answers(q)[0]; if (/ (en|et|ei|emme|ette|eivät) /.test(` ${a} `)) ok(/[aä]$/.test(a), `partNeg ends with partitive: ${a}`); }
  // caseVerb: answer is the right local case
  for (const q of many('caseVerb')) { const [, verb, fi] = strip(q.prompt).match(/^(.*) ___ \((.*)\)\.$/); const p = G.PLACES.find(x => x.fi === fi); const k = { Menen: 'mihin', Tulen: 'mista', 'Olen kotoisin': 'mista' }[verb] || 'missa'; eq(answers(q)[0], F.local(p)[k], `caseVerb ${verb} ${fi}`); }
  // phone: digits only, 10 long
  for (const q of many('phone')) { ok(/^0(40|44|45|50)\d{7}$/.test(q.answer), `phone ${q.answer}`); eq(q.say.replace(/,/g, '').split(' ').length, 10, 'phone said digit by digit'); }
  // forecast: singular aste for 1
  eq(E.tempWords(1), 'yksi aste', 'yksi aste'); eq(E.tempWords(-5), 'miinus viisi astetta', 'miinus viisi astetta'); eq(E.tempWords(0), 'nolla astetta', 'nolla astetta');
}

// ======================================================================= 4. Vocabulary questions: no two right options
section('vocab');
{
  const pairsNever = [['joo', 'kyllä'], ['sää', 'keli'], ['sää', 'ilma'], ['keli', 'ilma'], ['Hei!', 'Moi!'], ['Moi!', 'Moikka!'], ['minä', 'mä'], ['sinä', 'te'], ['tämä', 'tää'], ['Paljonko kello on?', 'Mitä kello on?'], ['kuinka paljon', 'paljonko']];
  let checked = 0;
  for (const w of VOCAB) {
    for (const mode of ['mcFiEn', 'mcEnFi', 'listenMc']) for (let r = 0; r < 3; r++) {
      const q = E.vocabQ(w, { force: mode });
      checked++;
      ok(q.choices.filter(c => c === q.answer).length === 1, `vocab ${w.fi} ${mode}: answer once`);
      ok(new Set(q.choices.map(clean)).size === q.choices.length, `vocab ${w.fi} ${mode}: distinct choices ${q.choices}`);
      ok(q.choices.length >= 3, `vocab ${w.fi} ${mode}: at least 3 choices (${q.choices.length})`);
      const key = mode === 'mcFiEn' ? 'en' : 'fi';
      for (const c of q.choices) if (c !== q.answer) {
        const x = VOCAB.find(v => v[key] === c);
        ok(!x || !E.clash(w, x), `vocab ${w.fi} ${mode}: distractor "${c}" also means "${w.en}"`);
      }
      for (const [a, b] of pairsNever) if (VOCAB_BY_ID['w:' + a.toLowerCase()]?.[key] !== VOCAB_BY_ID['w:' + b.toLowerCase()]?.[key] && q.choices.includes(VOCAB_BY_ID['w:' + a.toLowerCase()]?.[key]) && q.choices.includes(VOCAB_BY_ID['w:' + b.toLowerCase()]?.[key])) ok(false, `vocab: ${a} and ${b} offered together`);
    }
    const t = E.vocabQ(w, { force: 'typeEnFi' });
    if (t.kind === 'type') ok(F.gradeAnswer(t, w.fi).ok, `vocab type: ${w.fi} accepted`);
    if (t.kind === 'tiles') ok(F.gradeAnswer(t, w.fi.replace(/[.!?]/g, '')).ok, `vocab tiles: ${w.fi} accepted`);
  }
  ok(checked > 1000, 'vocab coverage');
  const sq = E.vocabQ(VOCAB_BY_ID['w:sää'], { force: 'typeEnFi' });
  ok(F.gradeAnswer(sq, 'ilma').ok && F.gradeAnswer(sq, 'ilma').alt, '"weather": ilma accepted as a synonym of sää (flagged)');
  const te = E.vocabQ(VOCAB_BY_ID['w:sinä'], { force: 'typeEnFi' });
  ok(!F.gradeAnswer(te, 'te').ok, '"you (one person)": te is NOT accepted');
  const ky = E.vocabQ(VOCAB_BY_ID['w:kyllä'], { force: 'typeEnFi' });
  ok(!F.gradeAnswer(ky, 'joo').ok, '"yes (formal)": joo is not formal');
  // custom words get real choices too
  const cw = { id: 'c:testi', fi: 'testi', en: 'test', pos: 'custom', topics: [] };
  ok(E.vocabQ(cw, { force: 'mcFiEn' }).choices.length >= 3, 'custom word MC has distractors');
}

// ======================================================================= 5. Store: streak, freezes, coins, merge
section('store');
{
  const S = () => store.state();
  const day = (offset) => store.dayOffset(store.today(), offset);
  const meet = (k, xp = 60) => { S().days[k] = { xp, coins: 0, ans: 0, ok: 0, new: 0, rev: 0, listen: 0, best: 0, q: {}, qc: {} }; };
  setNow(2026, 3, 10, 12);
  store.resetAll();
  eq(store.streak(), 0, 'streak: nothing');
  meet(day(0)); eq(store.streak(), 1, 'streak: today only');
  store.resetAll(); meet(day(-1)); eq(store.streak(), 1, 'streak: yesterday met, today not yet → still alive');
  store.resetAll(); [-3, -2, -1, 0].forEach(o => meet(day(o))); eq(store.streak(), 4, 'streak: 4 in a row');
  store.resetAll(); [-3, -2].forEach(o => meet(day(o))); eq(store.streak(), 0, 'streak: missed yesterday → broken');
  // freezes
  store.resetAll(); [-3, -2].forEach(o => meet(day(o))); S().spent['freeze:1'] = 10;
  eq(store.applyFreezes(), 1, 'freeze: one missed day saved');
  eq(store.streak(), 2, 'freeze: streak survives the frozen day but does not grow');
  meet(day(0)); eq(store.streak(), 3, 'freeze: next real day adds to the saved streak');
  eq(store.bestStreak(), 3, 'freeze: best streak skips the frozen day');
  eq(store.applyFreezes(), 0, 'freeze: idempotent');
  eq(store.freezesOwned(), 0, 'freeze: used up');
  store.resetAll(); [-4, -3].forEach(o => meet(day(o))); S().spent['freeze:1'] = 10;
  eq(store.applyFreezes(), 0, 'freeze: 2-day gap with 1 freeze → none wasted');
  eq(store.freezesOwned(), 1, 'freeze: still owned');
  store.resetAll(); S().spent['freeze:1'] = 10; eq(store.applyFreezes(), 0, 'freeze: no streak to save');
  // midnight
  store.resetAll(); setNow(2026, 3, 10, 23, 59); store.addXp(60); eq(store.streak(), 1, 'midnight: met at 23:59');
  setNow(2026, 3, 11, 0, 1); eq(store.streak(), 1, 'midnight: 00:01 next day streak still 1');
  store.addXp(60); eq(store.streak(), 2, 'midnight: next day met → 2');
  // goal raised later must not break history
  store.setProfile({ goal: 200 }); eq(store.streak(), 2, 'raising the goal keeps past days');
  store.setProfile({ goal: 12 });
  // coins
  store.resetAll(); setNow(2026, 3, 10, 12);
  store.addXp(6.25); eq(store.coins(), 2, 'coins: 6.25 XP → 2 (1 per 2.5 XP)');
  store.addXp(1.25); eq(store.coins(), 3, 'coins: 7.5 XP → 3');
  store.addCoins(10); eq(store.coins(), 13, 'coins: bonus');
  ok(store.spend('hat:x', 13) && store.coins() === 0, 'coins: spend');
  ok(!store.spend('hat:y', 1), 'coins: cannot overspend');
  eq(store.totalXp(), 7.5, 'xp total');
  // bestStreak
  store.resetAll(); [-10, -9, -8, -5, -4].forEach(o => meet(day(o))); eq(store.bestStreak(), 3, 'bestStreak');
  // merge idempotence
  store.resetAll(); setNow(2026, 3, 10, 12);
  meet(day(-1), 30); store.grade('w:talo', 3); S().lists[0].items.push('w:talo');
  const other = JSON.parse(JSON.stringify(S()));
  other.days[day(-1)].xp = 80; other.days[day(-2)] = { xp: 70, coins: 7, q: { a: 1 }, qc: {} };
  other.cards['w:talo'] = { ...other.cards['w:talo'], last: NOW + 1000, s: 9 };
  other.cards['w:kissa'] = { s: 1, d: 5, reps: 1, lapses: 0, last: NOW, due: NOW + 86400000 };
  other.lists[0].items.push('w:kissa'); other.lists.push({ id: 'l2', name: 'Two', items: ['w:auto'] });
  other.spent['freeze:a'] = 10; other.profile = { name: 'x', updated: NOW + 5 }; // profile missing fields
  other.ach = { first: 5 };
  store.merge(other);
  const once = JSON.stringify({ ...S(), updated: 0 });
  store.merge(other);
  eq(JSON.stringify({ ...S(), updated: 0 }), once, 'merge(x) twice == once');
  eq(S().days[day(-1)].xp, 80, 'merge: max xp per day');
  eq(S().cards['w:talo'].s, 9, 'merge: newest card wins');
  ok(S().cards['w:kissa'], 'merge: new cards added');
  eq(S().lists[0].items, ['w:talo', 'w:kissa'], 'merge: list union, no duplicates');
  eq(S().lists.length, 2, 'merge: new list added once');
  eq(S().profile.goal, 12, 'merge: partial profile keeps defaults');
  eq(S().profile.name, 'x', 'merge: newer profile wins');
  other.lists[1].items.push('w:x'); ok(!S().lists[1].items.includes('w:x'), 'merge: lists are copied, not shared');
  // hydrate
  store.replace({ profile: { name: 'old' }, days: {} });
  eq(S().profile.goal, 12, 'old save without goal → default goal');
  ok(Array.isArray(S().lists) && S().lists.length, 'old save without lists → default list');
  // XP v2 = a quarter of v1: old saves are converted once; coins, level and met days stay the same
  setNow(2026, 3, 10, 12);
  store.replace({ v: 1, profile: { goal: 50 }, days: { [day(-1)]: { xp: 100, coins: 10, met: 1 }, [day(0)]: { xp: 40, coins: 4 } } });
  eq(S().profile.goal, 12, 'v1 goal 50 → 12'); eq(S().days[day(-1)].xp, 25, 'v1 day xp 100 → 25'); eq(store.coins(), 14, 'coins unchanged');
  eq(store.level(), Math.floor(1 + Math.sqrt(140 / 60)), 'level unchanged'); eq(store.streak(), 1, 'yesterday still met');
  store.addXp(2.5); eq(store.coins(), 15, 'next coin after 2.5 XP (old 10)');
  store.replace(JSON.parse(JSON.stringify(S()))); eq(S().days[day(-1)].xp, 25, 'v2 save is not converted again');
  store.merge({ days: { [day(-1)]: { xp: 200, coins: 20 } } }); eq(S().days[day(-1)].xp, 50, 'old-format sync code is converted on merge');
  for (const [o, n] of [[20, 5], [100, 25], [150, 40], [250, 60], [70, 18]]) { store.replace({ v: 1, profile: { goal: o }, days: {} }); eq(S().profile.goal, n, `v1 goal ${o} → ${n}`); }
}

// ======================================================================= 6. FSRS
section('srs');
{
  const t0 = new RealDate(2026, 0, 1).getTime(), DAY = srs.DAY;
  const c1 = srs.review(null, 3, t0);
  ok(c1.due - t0 >= DAY, 'new Good → due ≥ 1 day');
  const c0 = srs.review(null, 1, t0);
  eq(c0.due - t0, 10 * 60000, 'Again → 10 min'); eq(c0.lapses, 1, 'Again counts a lapse');
  eq(srs.review(null, 2, t0).due - t0, 3600000, 'new Hard → 1 h');
  ok(srs.review(null, 4, t0).s > c1.s, 'Easy > Good stability');
  const same = srs.review(c1, 3, t0 + 3600000);
  ok(same.s >= c1.s && same.reps === 2, 'same-day Good: stability not lower');
  const hardSame = srs.review(c1, 2, t0 + 3600000);
  ok(hardSame.s <= same.s, 'same-day Hard ≤ Good');
  const later = srs.review(c1, 3, c1.due);
  ok(later.s > c1.s && later.due > c1.due, 'on-time Good grows the interval');
  const lapse = srs.review(later, 1, later.due);
  ok(lapse.s < later.s && lapse.lapses === 1, 'lapse lowers stability');
  ok(srs.retrievability(c1, t0) === 1 && srs.retrievability(c1, t0 + 10 * DAY) < 1, 'retrievability decays');
  ok(srs.retrievability(c1, t0 - DAY) === 1, 'clock skew: retrievability capped at 1');
  ok(Number.isFinite(srs.review({ ...c1, last: t0 + DAY }, 3, t0).due), 'review before last (clock skew) is finite');
  for (let g = 1; g <= 4; g++) { let c = null, t = t0; for (let k = 0; k < 30; k++) { c = srs.review(c, g, t); t = c.due; ok(Number.isFinite(c.s) && c.d >= 1 && c.d <= 10 && c.due > 0, `FSRS stable for grade ${g}`); } }
  store.resetAll(); setNow(2026, 3, 10, 12);
  store.state().cards = { a: { due: NOW - 5 }, b: { due: NOW - 50 }, c: { due: NOW + 50 } };
  eq(store.dueIds(), ['b', 'a'], 'dueIds: only due, oldest first');
}

// ======================================================================= 7. Planning & empty pools
section('plan');
{
  store.resetAll();
  const mix = plan.dailyMix();
  ok(mix.questions.length > 0, 'dailyMix works on a fresh profile');
  ok(mix.questions.every(q => q && q.kind), 'dailyMix questions are valid');
  eq(plan.trainerQuestions([], 'mc'), [], 'trainer with no words → []');
  eq(plan.sourceWords('lesson:does-not-exist'), [], 'unknown lesson source → []');
  eq(plan.sourceWords('topic:does-not-exist'), [], 'unknown topic source → []');
  eq(plan.sourceWords('learned'), [], 'no learned words → []');
  // custom words in every trainer mode
  const id = store.addCustom('mökkeily', 'cottage life');
  store.grade(id, 1); NOW += 3600000;
  const words = plan.sourceWords('due');
  ok(words.some(w => w.id === id), 'custom word is due');
  for (const mode of ['flashFi', 'flashEn', 'write', 'listen', 'mc', 'speed', 'mixed']) {
    const qs = plan.trainerQuestions(words, mode);
    ok(qs.length && qs.every(q => q.kind && (q.kind !== 'mc' || q.choices.length >= 2)), `trainer ${mode} with a custom word`);
  }
  ok(plan.dailyMix().questions.some(q => q.item === id && (q.kind !== 'mc' || q.choices.length >= 3)), 'dailyMix handles due custom words');
  store.state().cards['w:no-longer-exists'] = { due: 0, s: 1, last: 1 };
  ok(plan.mixSummary().due === plan.sourceWords('due').length, 'mixSummary counts only reviewable cards');
  for (const s of Object.keys(E.SKILL_NAMES)) eq(plan.skillDrill(s, 8).length > 0, true, `skillDrill ${s}`);
}

// ======================================================================= 8. Course wiring
section('course');
{
  const { LESSONS } = await import(root + 'data/course.js');
  for (const l of LESSONS) for (const sk of l.skills || []) ok(sk === 'vocab' || E.SKILL_NAMES[sk], `lesson ${l.id}: skill "${sk}" exists`);
  for (const l of LESSONS) ok(plan.lessonWords(l).every(Boolean), `lesson ${l.id}: all topic words exist`);
}

// ======================================================================= 8b. Trainer order + tongue twisters
section('trainer + twisters');
{
  const { TWISTERS } = await import(root + 'data/twisters.js');
  const fiSet = new Set(VOCAB.map(w => w.fi));
  ok(TWISTERS.every(t => !fiSet.has(t.fi)), 'tongue twisters are not vocabulary (never in reviews)');
  const { LESSONS } = await import(root + 'data/course.js');
  const lw = plan.sourceWords('lesson:' + LESSONS[0].id);
  // fresh store state for this block
  for (const w of lw) delete store.state().cards[w.id];
  const first = plan.trainerPick(lw, 5).map(w => w.id);
  eq(first, lw.slice(0, 5).map(w => w.id), 'trainer starts with never-practised words in list order');
  for (const id of first) store.grade(id, 3);
  const second = plan.trainerPick(lw, 5).map(w => w.id);
  ok(second.every(id => !first.includes(id)) || lw.length <= 5, 'next session continues with the words not done yet');
  eq(plan.trainerProgress(lw).done, Math.min(5, lw.length), 'trainer progress counts practised words');
  const qs = plan.trainerQuestions(lw, 'write', 20);
  ok(qs.filter(q => q.kind === 'intro').length === lw.filter(w => !store.state().cards[w.id]).slice(0, 20).length || lw.length > 20, 'unseen words get an intro card in write mode');
  ok(plan.sourceWords('new').every(w => !store.state().cards[w.id]), "'new' source = never practised words");
}

section('what time is it');
{
  const t = VOCAB.filter(w => w.en === 'What time is it?');
  eq(t.map(w => w.fi), ['Mitä kello on?'], '"What time is it?" is taught as Mitä kello on?');
  const q = E.vocabQ(t[0], { force: 'typeEnFi' }); // 3-word phrases are built from tiles
  ok(q.kind === 'tiles' && F.gradeAnswer(q, 'Mitä kello on').ok && q.tiles.includes('Mitä'), 'building it: Mitä kello on');
  const mc = E.vocabQ(t[0], { force: 'mcEnFi' });
  ok(mc.answer === 'Mitä kello on?' && !mc.choices.some(c => /paljonko kello/i.test(c)), 'choose-the-Finnish: Mitä kello on? with no Paljonko trap');
  // progress on the old phrase moves over (cloud merge path)
  store.state().cards['w:mitä kello on?'] && delete store.state().cards['w:mitä kello on?'];
  store.merge({ cards: { 'w:paljonko kello on?': { s: 3, d: 5, due: 1, last: 5, reps: 2, lapses: 0 } }, lists: [{ id: 'xx-rename', name: 'x', items: ['w:paljonko kello on?'] }] });
  ok(store.state().cards['w:mitä kello on?']?.reps === 2 && !store.state().cards['w:paljonko kello on?'], 'old card renamed on merge');
  eq(store.state().lists.find(l => l.id === 'xx-rename')?.items, ['w:mitä kello on?'], 'list entry renamed on merge');
  store.state().lists = store.state().lists.filter(l => l.id !== 'xx-rename');
}

// ======================================================================= 9. Listening audio
// A listening question shows no text, so it must never depend on the device voice: every `say` has to be
// a recorded clip or a chain of recorded pieces (js/audio.js clipPlan).
section('listening audio');
{
  const A = await import(root + 'js/audio.js');
  const { PRACTICE } = await import(root + 'data/practice/index.js');
  const has = (q, where) => ok(!!A.clipPlan(q.say), `${where}: no recorded audio for "${q.say}"`);
  for (const k of Object.keys(E.SKILLS)) if (typeof E.SKILLS[k] === "function") for (let i = 0; i < 1500; i++) { const q = E.SKILLS[k](); if (q.listen) has(q, `skill ${k}`); }
  for (const w of VOCAB) for (const f of ['listenMc', 'listenType']) has(E.vocabQ(w, { force: f }), `vocab ${f}`);
  for (const sets of Object.values(PRACTICE)) for (const s of sets) if (s.kind === 'listen') for (const q of s.items) has({ say: q.fi }, `practice ${s.src}`);
  for (const n of [0, 7, 100, 101, 999, 1000, 1001, 1999, 2030]) eq(F.numSay(n).replace(/ /g, ''), F.numWord(n), `numSay(${n}) reads as numWord`);
}

// ======================================================================= report
console.log(`\n${pass} passed, ${fail} failed`);
if (fail) { console.log('\nFailures:'); for (const f of failures) console.log(' - ' + f); process.exit(1); }
