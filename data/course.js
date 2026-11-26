// SuomiT course map. Follows the order of the Basic Finnish Club course; all explanations written for SuomiT.
// Markup in learn cards: *suomi* = Finnish (tap-to-translate), **bold**, rows starting with | are tables, "> " = tip.
export const MODULES = [
  { id: 'm1', n: 1, title: 'Foundations', fi: 'Perusteet', color: '#3ddc97', reward: 'pipo' },
  { id: 'm2', n: 2, title: 'Describing the world', fi: 'Maailman kuvailu', color: '#5ab0ff', reward: 'aurinkolasit' },
  { id: 'm3', n: 3, title: 'Partitive & verb types', fi: 'Partitiivi ja verbityypit', color: '#c58bff', reward: 'kukkaseppele' },
  { id: 'm4', n: 4, title: 'Places & time', fi: 'Paikat ja aika', color: '#ffb347', reward: 'ylioppilaslakki' },
  { id: 'b', n: 5, title: 'Bonus: everyday Finnish', fi: 'Arjen suomi', color: '#ff6f91', reward: 'kruunu' },
];

export const LESSONS = [
  // ───────────────────────────── MODULE 1
  {
    id: 'm1-1', mod: 'm1', title: 'Alphabet & pronunciation', fi: 'Aakkoset ja ääntäminen', icon: 'type',
    goals: ['Spell your name letter by letter', 'Hear and say long vs. short sounds'],
    learn: [
      { h: 'Finnish is spoken as it is written', body: `Every letter is always pronounced the same way, and every letter is pronounced. Learn the sound once and you can read anything aloud.
> Stress is **always** on the first syllable: *KAUpunki*, *PUhelin*, *SUOmi*.` },
      { h: 'The 8 vowels', body: `|*a*|like "a" in father|
|*e*|like "e" in bed|
|*i*|like "ee" in see (short)|
|*o*|like "o" in more|
|*u*|like "oo" in book|
|*y*|"ee" with rounded lips (German ü)|
|*ä*|like "a" in cat|
|*ö*|like "u" in burn (German ö)|
> *ä* and *ö* are separate letters, not decorations. *säkki* ≠ *sakki*.` },
      { h: 'Length changes meaning', body: `A doubled letter is simply held about twice as long. This is the #1 pronunciation skill in Finnish:
|*tuli* fire|*tuuli* wind|*tulli* customs|
|*kuka* who|*kukka* flower||
|*kisa* competition|*kissa* cat||
|*tapaan* I meet|*tappaan* I kill||
> Double consonants: pause briefly before them, like "bookcase" → boo**k-c**ase.` },
      { h: 'Spelling out loud', body: `Letter names: *aa, bee, see, dee, ee, äf, gee, hoo, ii, jii, koo, äl, äm, än, oo, pee, kuu, är, äs, tee, uu, vee, yy, ää, öö*.
*Miten se kirjoitetaan?* = How is it spelled? → *L-I-I-S-A*.` },
    ],
    topics: ['sounds'], skills: ['letters', 'length', 'vocab'],
  },
  {
    id: 'm1-2', mod: 'm1', title: 'Numbers & prices', fi: 'Numerot ja hinnat', icon: 'hash',
    goals: ['Count 0–1000 in written and spoken Finnish', 'Understand and say prices'],
    learn: [
      { h: 'Building numbers', body: `|0 *nolla*|1 *yksi*|2 *kaksi*|3 *kolme*|
|4 *neljä*|5 *viisi*|6 *kuusi*|7 *seitsemän*|
|8 *kahdeksan*|9 *yhdeksän*|10 *kymmenen*||
**11–19**: add *-toista* ("of the second ten"): *yksitoista*, *kaksitoista*…
**Tens**: number + *kymmentä*: *kaksikymmentä* (20), *kolmekymmentä* (30).
**Then just glue**: 25 = *kaksikymmentäviisi*, 143 = *sataneljäkymmentäkolme*, 2000 = *kaksituhatta*.` },
      { h: 'Spoken numbers (puhekieli)', body: `In shops and on the street you'll hear shortened numbers:
|1 *yks*|2 *kaks*|5 *viis*|6 *kuus*|
|7 *seittemän*|8 *kaheksan*|9 *yheksän*|11 *ykstoist*|
|20 *kakskyt*|30 *kolkyt*|40 *nelkyt*|50 *viiskyt*|
> 2,30 € is said *kaks kolkyt*: euros first, then cents, no words in between.` },
      { h: 'Asking the price', body: `*Mitä se maksaa?* / *Kuinka paljon se maksaa?* = What does it cost?
*Se maksaa kaksi euroa.* = It costs two euros.
After numbers (except 1), the noun goes into the partitive: *kaksi euroa*, *viisi senttiä*. You'll master this in Module 3; for now just learn the chunks.` },
    ],
    topics: ['numbers'], skills: ['numbers', 'numbersSpoken', 'prices', 'vocab'],
  },
  {
    id: 'm1-3', mod: 'm1', title: 'Greetings', fi: 'Tervehdykset', icon: 'wave',
    goals: ['Greet, introduce yourself and say goodbye', 'Use the most important polite phrases'],
    learn: [
      { h: 'Hello at any time of day', body: `|casual|*Hei!* *Moi!* *Terve!*|
|morning|*Hyvää huomenta!*|
|daytime|*Hyvää päivää!* (or just *Päivää!*)|
|evening|*Hyvää iltaa!*|
|night / bedtime|*Hyvää yötä!*|
> *Moi* works as both hello and bye. *Moi moi!* is a cheerful goodbye.` },
      { h: 'Small talk', body: `*Mitä kuuluu?* — How are you? (literally "what is heard?")
*Kiitos hyvää. Entä sinulle?* — Fine, thanks. And you?
*Hauska tavata!* — Nice to meet you!
> Finns answer *Mitä kuuluu?* honestly. It's a real question, not just a greeting.` },
      { h: 'The magic words', body: `*Kiitos* thank you · *Ole hyvä* here you go / you're welcome · *Anteeksi* sorry / excuse me · *Ei se mitään* no worries · *Hyvää ruokahalua!* enjoy your meal · *Kippis!* cheers` },
    ],
    topics: ['greetings'], skills: ['vocab', 'phrases'],
  },
  {
    id: 'm1-4', mod: 'm1', title: "Pronouns & 'to be'", fi: 'Persoonapronominit ja olla', icon: 'user',
    goals: ['Conjugate olla in written & spoken Finnish', 'Make negative sentences and yes/no questions'],
    learn: [
      { h: 'olla = to be', body: `|*minä olen*|I am|*mä oon*|
|*sinä olet*|you are|*sä oot*|
|*hän on*|he/she is|*se on*|
|*me olemme*|we are|*me ollaan*|
|*te olette*|you (pl.) are|*te ootte*|
|*he ovat*|they are|*ne on*|
Third column = spoken Finnish. *Hän* has no gender: one word for he **and** she.` },
      { h: 'Negative: the verb "ei"', body: `In Finnish the **negation is a verb** that conjugates. The main verb stays in a fixed form:
|*minä en ole*|*sinä et ole*|*hän ei ole*|
|*me emme ole*|*te ette ole*|*he eivät ole*|
> Pattern for every verb: en / et / ei / emme / ette / eivät + the verb's stem.` },
      { h: 'Yes/no questions: -ko/-kö', body: `Put the verb first and glue *-ko* (or *-kö*) to it:
*Sinä olet suomalainen.* → *Oletko sinä suomalainen?* (or just *Oletko suomalainen?*)
*Hän on kotona.* → *Onko hän kotona?*
Answer by repeating the verb: *Olen.* / *En ole.* (or *Joo* / *Ei*).` },
    ],
    topics: ['pronouns'], skills: ['olla', 'ollaNeg', 'ollaQ', 'ollaSpoken', 'vocab'],
  },
  {
    id: 'm1-5', mod: 'm1', title: 'Days of the week', fi: 'Viikonpäivät', icon: 'calendar',
    goals: ['Name the days', 'Say "on Monday", "today", "tomorrow"'],
    learn: [
      { h: 'The week', body: `*maanantai, tiistai, keskiviikko, torstai, perjantai, lauantai, sunnuntai*
Days are written in lower case. *Keskiviikko* means "middle of the week".` },
      { h: 'When? → -na/-nä', body: `*Milloin?* (when?) → add *-na*: *maanantaina* (on Monday), *keskiviikkona*, *sunnuntaina*.
*Mikä päivä tänään on?* — *Tänään on perjantai.*
|*toissapäivänä*|*eilen*|*tänään*|*huomenna*|*ylihuomenna*|
|day before yesterday|yesterday|today|tomorrow|day after tomorrow|` },
    ],
    topics: ['days'], skills: ['days', 'vocab'],
  },
  {
    id: 'm1-6', mod: 'm1', title: 'Vowel harmony', fi: 'Vokaaliharmonia', icon: 'scale',
    goals: ['Choose between -ssa/-ssä, -ko/-kö and other ending pairs'],
    learn: [
      { h: 'Front and back vowels never mix', body: `|back|*a o u*|
|front|*ä ö y*|
|neutral|*e i*| (go with either)
Endings come in two versions, and the word decides which one:
*talo* → *talossa*, *metsä* → *metsässä*, *Oletko?* but *Menetkö?*` },
      { h: 'The rule SuomiT uses', body: `Look at the **last** a/o/u or ä/ö/y in the word:
• back vowel → *-ssa, -sta, -lla, -ko, -vat*
• front vowel → *-ssä, -stä, -llä, -kö, -vät*
• only e/i → front: *Helsingissä*, *kielessä*
> Compounds follow their last part: *kesä + kuu* → *kesäkuussa*.` },
    ],
    topics: ['harmony'], skills: ['harmony', 'vocab'],
  },
  {
    id: 'm1-7', mod: 'm1', title: 'T-plural', fi: 'T-monikko', icon: 'layers',
    goals: ['Form the basic plural', 'Notice word-type changes and kpt-gradation'],
    learn: [
      { h: 'Step 1: add -t', body: `The plural of the basic form ends in *-t*: *auto → autot*, *talo → talot*, *kynä → kynät*.` },
      { h: 'Step 2: the word type may change the stem', body: `The *-t* attaches to the same stem as the genitive (*-n*) form, so learn them together:
|*nainen* → *naiset*|(-nen → -se-)|
|*huone* → *huoneet*|(-e → -ee-)|
|*uusi* → *uudet*|(old -si words → -de-)|
|*kieli* → *kielet*|(old -i words → -e-)|
|*puhelin* → *puhelimet*|(-in → -ime-)|` },
      { h: 'Step 3: kpt-gradation', body: `Before *-t* the syllable closes, so k, p, t often "weaken":
|*kk → k*|*kukka → kukat*|
|*pp → p*|*lippu → liput*|
|*tt → t*|*katto → katot*|
|*k → ∅*|*jalka → jalat*|
|*p → v*|*leipä → leivät*|
|*t → d*|*katu → kadut*|
|*nk → ng*|*kenkä → kengät*|
> Trick: if you know the genitive (*kengän*), swap *-n* for *-t* (*kengät*). Works almost every time!` },
    ],
    topics: ['plural'], skills: ['tplural', 'vocab'],
  },
  {
    id: 'm1-8', mod: 'm1', title: 'Countries & languages', fi: 'Maat, kansalaisuudet, kielet', icon: 'globe',
    goals: ['Say where you are from, your nationality and your languages'],
    learn: [
      { h: 'Country → person → language', body: `|*Suomi*|*suomalainen*|*suomi*|
|*Ruotsi*|*ruotsalainen*|*ruotsi*|
|*Saksa*|*saksalainen*|*saksa*|
|*Hollanti*|*hollantilainen*|*hollanti*|
Countries take a capital letter; nationalities and languages don't.` },
      { h: 'The three key sentences', body: `*Mistä olet kotoisin?* — *Olen kotoisin Hollannista.* (from = *-sta/-stä*)
*Minkä maalainen olet?* — *Olen hollantilainen.*
*Mitä kieliä puhut?* — *Puhun hollantia, englantia ja vähän suomea.*
> Languages after *puhua* are in the partitive: *suomea, ruotsia, englantia, saksaa*.` },
    ],
    topics: ['countries'], skills: ['countries', 'vocab'],
  },
  {
    id: 'm1-9', mod: 'm1', title: 'Verb type 1', fi: 'Verbityyppi 1', icon: 'run',
    goals: ['Conjugate type-1 verbs in the present', 'Make negatives and questions'],
    learn: [
      { h: 'How to spot type 1', body: `Infinitive ends in **two vowels**: *puhua, asua, ostaa, kysyä, katsoa*.
Stem = drop the last vowel: *puhu-a* → *puhu-*.` },
      { h: 'Endings', body: `|*minä puhun*|*-n*|
|*sinä puhut*|*-t*|
|*hän puhuu*|(lengthen the last vowel)|
|*me puhumme*|*-mme*|
|*te puhutte*|*-tte*|
|*he puhuvat*|*-vat / -vät*|
Negative: *en / et / ei / emme / ette / eivät* + stem → *en puhu, hän ei osta*.
Question: verb + *-ko/-kö* → *Puhutko suomea? Ostaako hän leipää?*` },
    ],
    topics: ['verbs1'], skills: ['vt1', 'vt1neg', 'questionKo'], verbLesson: 'm1-9',
  },
  {
    id: 'm1-10', mod: 'm1', title: 'Question words', fi: 'Kysymyssanat', icon: 'help',
    goals: ['Ask open questions', 'Choose between mikä and mitä'],
    learn: [
      { h: 'The question words', body: `|*kuka*|who|*kenen*|whose|
|*mikä*|what (is)|*mitä*|what (do)|
|*missä*|where|*mistä*|from where|
|*mihin*|to where|*milloin*|when|
|*miksi*|why|*miten*|how|
|*millainen*|what kind|*kuinka monta*|how many|
Word order stays straight: *Kuka hän on?* — *Hän on opettaja.*` },
      { h: 'Mikä or mitä?', body: `*Mikä* asks for the subject or identity: *Mikä tämä on?* *Mikä sinun nimi on?*
*Mitä* asks for an object or activity: *Mitä sinä teet?* *Mitä sinä syöt?* *Mitä kuuluu?*
> If the answer is the thing being done/eaten/wanted → *mitä*. If the answer is "it is X" → *mikä*.` },
    ],
    topics: ['qwords'], skills: ['qwords', 'vocab'],
  },
  {
    id: 'm1-11', mod: 'm1', title: 'Family', fi: 'Perhe', icon: 'users',
    goals: ['Talk about your family members'],
    learn: [
      { h: 'Perhe', body: `*äiti, isä, vanhemmat, sisko, veli, sisarus, poika, tytär, lapsi, mummo, vaari, isovanhemmat, serkku, täti, setä, eno*
> Finnish has two uncles: *setä* (father's brother) and *eno* (mother's brother).
*Minulla on kaksi siskoa ja yksi veli.* = I have two sisters and one brother.` },
    ],
    topics: ['family'], skills: ['vocab'], reading: 'r-family',
  },
  {
    id: 'm1-12', mod: 'm1', title: 'Revision: module 1', fi: 'Kertaus', icon: 'repeat', revision: true,
    goals: ['Mix of verb type 1, t-plural and gradation'],
    learn: [{ h: 'Revision time', body: `This lesson mixes everything from Module 1. Mistakes are good: they show SuomiT what to repeat.` }],
    topics: ['sounds', 'numbers', 'greetings', 'pronouns', 'days', 'countries', 'qwords', 'family'],
    skills: ['vt1', 'tplural', 'harmony', 'olla', 'days', 'qwords', 'numbers'], test: true,
  },

  // ───────────────────────────── MODULE 2
  {
    id: 'm2-1', mod: 'm2', title: 'Revision: all previous topics', fi: 'Kertaus', icon: 'repeat', revision: true,
    goals: ['Warm up everything from Module 1'],
    learn: [{ h: 'Welcome to Module 2', body: `Before new material, a quick warm-up of Module 1. Read the Rovala story in Resources for real-life practice.` }],
    topics: ['greetings', 'pronouns', 'days', 'family', 'countries'], skills: ['olla', 'vt1', 'questionKo', 'countries', 'days'],
  },
  {
    id: 'm2-2', mod: 'm2', title: 'Weather', fi: 'Sää', icon: 'cloud',
    goals: ['Describe the weather', 'Say what weather you like'],
    learn: [
      { h: 'Millainen sää on?', body: `Three words for weather: *sää = ilma = keli*.
*On kylmä.* It's cold · *On tosi kuuma.* It's really hot · *Sataa.* It rains · *Sataa lunta.* It snows · *Aurinko paistaa.* The sun shines · *Tuulee.* It's windy · *On pakkasta.* It's freezing.
> Weather sentences often have no subject at all: *Sataa.* = It rains.` },
      { h: 'I like… = tykätä / pitää + -sta', body: `*Minä tykkään kesästä.* I like summer. · *Minä pidän lumesta.* I like snow.
*En tykkää sateesta.* I don't like rain.
The thing you like takes *-sta/-stä* (elative).` },
    ],
    topics: ['weather'], skills: ['vocab'], reading: 'r-weather',
  },
  {
    id: 'm2-3', mod: 'm2', title: 'Months & seasons', fi: 'Kuukaudet ja vuodenajat', icon: 'calendar',
    goals: ['Name months and seasons', 'Say "in January", "in summer"'],
    learn: [
      { h: 'Every month ends in -kuu (moon)', body: `*tammikuu, helmikuu, maaliskuu, huhtikuu, toukokuu, kesäkuu, heinäkuu, elokuu, syyskuu, lokakuu, marraskuu, joulukuu*
In which month? → *-ssa*: *tammikuussa, heinäkuussa*.
> *heinä* = hay, *loka* = mud, *marras* = dead, *joulu* = Christmas. Finnish months describe nature.` },
      { h: 'Seasons → -lla/-llä', body: `|*kevät*|*keväällä*|in spring|
|*kesä*|*kesällä*|in summer|
|*syksy*|*syksyllä*|in autumn|
|*talvi*|*talvella*|in winter|
*Milloin on juhannus?* — *Kesällä, kesäkuussa.*` },
    ],
    topics: ['months'], skills: ['months', 'vocab'],
  },
  {
    id: 'm2-4', mod: 'm2', title: 'Verb type 1 + consonant gradation', fi: 'Verbityyppi 1 + astevaihtelu', icon: 'gear',
    goals: ['Conjugate type-1 verbs that have kpt-gradation'],
    learn: [
      { h: 'Strong and weak forms', body: `Many verbs change k/p/t inside the stem:
|*nukkua*|*minä nukun*|*hän nukkuu*|
|*ottaa*|*minä otan*|*hän ottaa*|
|*lukea*|*minä luen*|*hän lukee*|
|*tietää*|*minä tiedän*|*hän tietää*|
|*antaa*|*minä annan*|*hän antaa*|
**Weak** for minä, sinä, me, te (and negatives); **strong** for hän and he.` },
      { h: 'Why? Closed syllables', body: `When an ending closes the syllable (*-n, -t, -mme, -tte*), the consonant weakens. *Hän* and *he* keep the syllable open (*nuk-kuu*, *nuk-ku-vat*), so they stay strong.
> Shortcut: learn the minä-form and the hän-form of every new verb. Then you can do all six.` },
    ],
    topics: ['verbs1kpt'], skills: ['vt1kpt', 'vt1neg', 'questionKo'], verbLesson: 'm2-4',
  },
  {
    id: 'm2-5', mod: 'm2', title: 'Colours', fi: 'Värit', icon: 'palette',
    goals: ['Name colours and ask "what colour?"'],
    learn: [{ h: 'Värit', body: `*punainen, sininen, keltainen, vihreä, musta, valkoinen, harmaa, ruskea, oranssi, violetti, vaaleanpunainen*
*Minkävärinen auto on?* — *Auto on punainen.*
Light/dark: *vaaleansininen* (light blue), *tummansininen* (dark blue).` }],
    topics: ['colors'], skills: ['vocab'],
  },
  {
    id: 'm2-6', mod: 'm2', title: 'Clothes', fi: 'Vaatteet', icon: 'shirt',
    goals: ['Say what you are wearing'],
    learn: [
      { h: 'Mitä sinulla on päällä?', body: `*Minulla on päällä punainen paita, musta hattu ja siniset farkut.*
Some clothes are (almost) always plural: *housut, farkut, shortsit, hanskat*. Their adjective goes plural too: *siniset farkut, mustat housut*.
*Hänellä on päällä…* = He/she is wearing…` },
    ],
    topics: ['clothes'], skills: ['clothes', 'vocab'],
  },
  {
    id: 'm2-7', mod: 'm2', title: "'I have'", fi: 'Minulla on', icon: 'gift',
    goals: ['Say what you have and don\'t have', 'Ask who has something'],
    learn: [
      { h: 'Finnish has no verb "to have"', body: `You say "at me is": person + *-lla/-llä* + *on*.
|*minulla on*|*sinulla on*|*hänellä on*|
|*meillä on*|*teillä on*|*heillä on*|
Names too: *Mirjalla on kissa. Jukalla on koira.* (*Jukka → Jukalla*: gradation!)` },
      { h: 'Questions & negatives', body: `*Onko sinulla koira?* — *On.* / *Ei ole.*
*Kenellä on porkkana?* — *Mirjalla on porkkana.*
Negative: *Minulla ei ole koiraa.* The thing goes into the **partitive** (Module 3).
> Don't confuse: *minä olen* = I am · *minulla on* = I have.` },
    ],
    topics: ['have'], skills: ['have', 'vocab'],
  },
  {
    id: 'm2-8', mod: 'm2', title: 'Appearance', fi: 'Ulkonäkö', icon: 'smile',
    goals: ['Describe what a person looks like'],
    learn: [{ h: 'Minkänäköinen hän on?', body: `Use *on* for what someone **is**, *-lla on* for what someone **has**:
*Hän on nuori ja pitkä.* · *Hänellä on pitkä musta tukka ja vihreät silmät.*
*Hänellä on parta ja silmälasit.*` }],
    topics: ['appearance'], skills: ['vocab', 'have'],
  },
  {
    id: 'm2-9', mod: 'm2', title: 'Adjectives', fi: 'Adjektiivit', icon: 'sparkle',
    goals: ['Describe things', 'Know common opposites'],
    learn: [{ h: 'Millainen?', body: `*Millainen auto on?* — *Auto on sininen, hieno, vanha ja kallis.*
Adjectives agree with the noun: *iso talo* → *isot talot*, *isossa talossa*.
Learn them in pairs: *iso ↔ pieni, uusi ↔ vanha, kallis ↔ halpa, helppo ↔ vaikea*.` }],
    topics: ['adjectives'], skills: ['opposites', 'vocab'],
  },
  {
    id: 'm2-10', mod: 'm2', title: 'Genitive', fi: 'Genetiivi', icon: 'link',
    goals: ['Say whose something is', 'Use the genitive with postpositions and "must"'],
    learn: [
      { h: 'Kenen? Minkä? → -n', body: `The genitive ends in *-n* and comes **before** the thing owned:
*Kenen auto tämä on?* — *Tämä on lääkärin auto.*
*Helsingin pormestari* = the mayor of Helsinki.
Pronouns: *minun, sinun, hänen, meidän, teidän, heidän*.` },
      { h: 'Watch the stem', body: `Gradation and word type apply (same stem as the t-plural):
|*pöytä*|*pöydän*|
|*kauppa*|*kaupan*|
|*nainen*|*naisen*|
|*huone*|*huoneen*|
|*käsi*|*käden*|
The genitive is also used with "must": *Minun pitää mennä.* (I must go.) and with postpositions: *pöydän alla* (under the table).` },
    ],
    topics: ['genitive'], skills: ['genitive', 'genitivePron', 'vocab'],
  },
  {
    id: 'm2-11', mod: 'm2', title: 'Revision: grammar', fi: 'Kertaus: kielioppi', icon: 'repeat', revision: true,
    goals: ['Adjectives, verb type 1, genitive, vowel harmony, questions, numbers, time words, weather'],
    learn: [{ h: 'Big review', body: `The Peda.net revision pages in Resources match this lesson exactly. Do them after the drills.` }],
    topics: ['weather', 'months', 'colors', 'clothes', 'appearance', 'adjectives'],
    skills: ['genitive', 'vt1kpt', 'harmony', 'qwords', 'numbers', 'months', 'opposites', 'have'], test: true,
  },

  // ───────────────────────────── MODULE 3
  {
    id: 'm3-1', mod: 'm3', title: 'Partitive', fi: 'Partitiivi', icon: 'cup',
    goals: ['Know when to use the partitive', 'Form it for common words'],
    learn: [
      { h: 'When?', body: `The partitive means "some of / an unbounded amount". Use it:
• after numbers 2+: *kaksi kissaa, kolme euroa*
• with amounts: *kilo lihaa, lasi viiniä, paljon vettä*
• with uncountable stuff: *Juon kahvia. Syön leipää.*
• in negative sentences: *Minulla ei ole autoa.*
• with some verbs: *rakastaa, odottaa, auttaa, ajatella*: *Rakastan sinua.*
• in greetings: *Hyvää huomenta!*` },
      { h: 'How? Three endings', body: `|**-a / -ä**|most words ending in one vowel|*talo → taloa, kissa → kissaa*|
|**-ta / -tä**|long vowel, diphthong or consonant|*maa → maata, puhelin → puhelinta*|
|**-tta / -ttä**|words ending in -e|*huone → huonetta*|
Old *-i* words change the stem: *nimi → nimeä*, *kieli → kieltä*, *vesi → vettä*.
> No gradation in the partitive: *pöytä → pöytää*, *kauppa → kauppaa*.` },
    ],
    topics: ['partitive'], skills: ['partitive', 'have', 'vocab'],
  },
  {
    id: 'm3-2', mod: 'm3', title: 'Verb types 1–5', fi: 'Verbityypit 1–5', icon: 'puzzle',
    goals: ['Classify any verb', 'Conjugate all types in the present tense'],
    learn: [
      { h: 'Identify by the ending', body: `|1|two vowels|*puhua, ostaa*|stem: drop *-a*|*puhun*|
|2|*-da / -dä*|*syödä, juoda*|drop *-da*|*syön*|
|3|*-la, -na, -ra, -sta*|*tulla, mennä, nousta*|drop 2 letters, add *-e*|*tulen*|
|4|vowel + *-ta*|*haluta, pelata*|drop *-ta*, add *-a*|*haluan*|
|5|*-ita / -itä*|*tarvita, valita*|drop *-ta*, add *-tse*|*tarvitsen*|
|6|*-eta*|*vanheta*|drop *-ta*, add *-ne*|*vanhenen*|` },
      { h: 'Same endings for everyone', body: `*-n, -t, (long vowel), -mme, -tte, -vat/-vät*
Hän-forms: type 2 doesn't lengthen (*hän syö*), and a long vowel stays as it is (*hän pelaa, hän tapaa*).
Irregular friends: *tehdä → teen, hän tekee* · *nähdä → näen, hän näkee*.
> Type 3 & 4 gradation goes **the other way**: *ajatella → ajattelen*, *tavata → tapaan*.` },
    ],
    topics: ['verbtypes'], skills: ['verbtype', 'vt15', 'vt15neg'], verbLesson: 'm3-2',
  },
  {
    id: 'm3-3', mod: 'm3', title: 'Home', fi: 'Koti', icon: 'home',
    goals: ['Describe rooms & furniture', 'Use postpositions (under, next to…)'],
    learn: [
      { h: 'Rooms', body: `*keittiö (K), olohuone (OH), makuuhuone (MH), kylpyhuone (KH), vessa (WC), sauna (S), parveke (P), eteinen (ET)*
Flat sizes: *yksiö* (1 room + kitchen), *kaksio* (2h+k), *kolmio* (3h+k).
> An ad saying "3H+K+S" means three rooms, a kitchen and a sauna. Yes, many flats have their own sauna.` },
      { h: 'Postpositions: genitive + word', body: `|*pöydän päällä*|on the table|
|*pöydän alla*|under the table|
|*sohvan vieressä*|next to the sofa|
|*talon edessä*|in front of the house|
|*oven takana*|behind the door|
*Missä kissa on?* — *Kissa on sängyn alla.*` },
    ],
    topics: ['home'], skills: ['postpos', 'vocab'],
  },
  {
    id: 'm3-4', mod: 'm3', title: 'Nouns: word types & kpt', fi: 'Sanatyypit ja astevaihtelu', icon: 'repeat',
    goals: ['Classify nouns by ending', 'Apply kpt-gradation in genitive & plural'],
    learn: [
      { h: 'Word types: the ending tells the stem', body: `|*-a/-ä, -o/-ö, -u/-y*|stem unchanged|*talo → talon*|
|new *-i* (loans)|stem unchanged|*bussi → bussin*|
|old *-i*|*-i → -e-*|*kieli → kielen*|
|*-si*|*-si → -de-*|*uusi → uuden, käsi → käden*|
|*-e*|add *-e-*|*huone → huoneen*|
|*-nen*|*-nen → -se-*|*nainen → naisen*|
|*-as / -is*|*-as → -aa-*|*rikas → rikkaan*|
|*-in*|*-in → -ime-*|*puhelin → puhelimen*|
|*-us/-ys*|*-us → -ukse-*|*kysymys → kysymyksen*|` },
      { h: 'kpt in nouns: A-type and B-type', body: `**A (strong basic form)**: weakens in genitive/plural: *kauppa → kaupan*, *katu → kadun*, *pankki → pankin*.
**B (weak basic form)**: *strengthens* in the stem: *hammas → hampaan*, *rikas → rikkaan*, *parveke → parvekkeen*.
> In doubt? Check the word card in SuomiT. Every noun shows its genitive, partitive and plural.` },
    ],
    topics: ['gradation', 'plural', 'harmony'], skills: ['genitive', 'tplural'],
  },
  {
    id: 'm3-5', mod: 'm3', title: 'Revision: verb types & partitive', fi: 'Kertaus', icon: 'repeat', revision: true,
    goals: ['All verb types + partitive in one mixed session'],
    learn: [{ h: 'Mix it up', body: `Mixing topics in one session (interleaving) feels harder, but it's what makes grammar stick.` }],
    topics: ['partitive', 'verbtypes'], skills: ['vt15', 'vt15neg', 'partitive', 'verbtype'],
  },
  {
    id: 'm3-6', mod: 'm3', title: 'Revision: kpt, word order & VT5', fi: 'Kertaus', icon: 'repeat', revision: true,
    goals: ['Gradation in nouns & verbs', 'Basic Finnish word order', 'Verb type 5'],
    learn: [{ h: 'Word order', body: `Neutral order is like English: **subject – verb – object – place – time**.
*Minä juon kahvia kotona aamulla.*
Finnish word order is flexible because the endings carry the meaning. Moving a word to the front gives it emphasis: *Kahvia minä juon!*` }],
    topics: ['verbtypes', 'gradation'], skills: ['wordorder', 'vt15', 'genitive', 'tplural'],
  },
  {
    id: 'm3-7', mod: 'm3', title: 'Reading: my room', fi: 'Luetun ymmärtäminen', icon: 'read',
    goals: ['Read a short text about a home'], learn: [], topics: ['home'], skills: ['postpos', 'vocab'], reading: 'r-room',
  },
  {
    id: 'm3-8', mod: 'm3', title: 'Reading: my best friend', fi: 'Luetun ymmärtäminen', icon: 'read',
    goals: ['Read a short text about a person'], learn: [], topics: ['appearance', 'adjectives'], skills: ['vocab'], reading: 'r-friend',
  },
  {
    id: 'm3-9', mod: 'm3', title: 'Revision: grammar', fi: 'Kertaus: kielioppi', icon: 'repeat', revision: true,
    goals: ['Verb types, partitive, furniture'],
    learn: [{ h: 'Module 3 checkpoint', body: `Do the checkpoint test to earn the module reward.` }],
    topics: ['partitive', 'home', 'verbtypes'], skills: ['vt15', 'partitive', 'postpos', 'verbtype', 'genitive'], test: true,
  },

  // ───────────────────────────── MODULE 4
  {
    id: 'm4-1', mod: 'm4', title: 'Revision: modules 1–3', fi: 'Kertaus', icon: 'repeat', revision: true,
    goals: ['Refresh everything before local cases'],
    learn: [{ h: 'Warm-up', body: `A broad mix of Modules 1–3. The Rovala story "Natalia käy ostoksilla" in Resources is a great reading warm-up.` }],
    topics: ['partitive', 'family', 'clothes', 'home'], skills: ['vt15', 'partitive', 'genitive', 'have', 'numbers', 'harmony'],
  },
  {
    id: 'm4-2', mod: 'm4', title: 'Local cases', fi: 'Paikallissijat', icon: 'location',
    goals: ['Say where something is, where from and where to', 'Know inner vs. outer cases'],
    learn: [
      { h: 'Missä? Mistä? Mihin?', body: `|*missä?* where|*-ssa/-ssä*|*koulussa*|in the school|
|*mistä?* from where|*-sta/-stä*|*koulusta*|from the school|
|*mihin?* to where|*-Vn, -hVn, -seen*|*kouluun*|to the school|
These "inner" cases mean **in / out of / into**. Build them on the genitive stem: *kaupan → kaupassa, kaupasta*, but *kauppaan* (illative uses the strong stem).` },
      { h: 'Outer cases: on / at', body: `|*missä?*|*-lla/-llä*|*torilla*|
|*mistä?*|*-lta/-ltä*|*torilta*|
|*mihin?*|*-lle*|*torille*|
Use them for surfaces and open places: *pöydällä, torilla, asemalla, rannalla*, and some cities: *Tampereella, Vantaalla, Rovaniemellä*.
> Irregular must-knows: *kotona / kotoa / kotiin* (home) and *töissä / töistä / töihin* (work).` },
      { h: 'Forming the illative (to where)', body: `|vowel ending|repeat the vowel + *n*|*talo → taloon*, *koulu → kouluun*|
|one syllable, long vowel|*-h + vowel + n*|*maa → maahan*, *työ → työhön*|
|2+ syllables, long vowel in the stem|*-seen*|*huone → huoneeseen*, *Espoo → Espooseen*|` },
    ],
    topics: ['places'], skills: ['local', 'vocab'],
  },
  {
    id: 'm4-3', mod: 'm4', title: 'Time & clock', fi: 'Kellonajat', icon: 'clock',
    goals: ['Tell the time', 'Say at what time something happens'],
    learn: [
      { h: 'Paljonko kello on?', body: `|3:00|*Kello on kolme.*|
|3:15|*Kello on varttia yli kolme.*|
|3:30|*Kello on puoli neljä.*| (half **to** four!)
|3:45|*Kello on varttia vaille neljä.*|
|3:10|*Kello on kymmenen yli kolme.*|
|3:50|*Kello on kymmentä vaille neljä.*|
> *Puoli neljä* = 3:30, not 4:30. Half **of the way to** four.` },
      { h: 'Mihin aikaan? → kello + -lta', body: `*Mihin aikaan heräät?* — *Kello seitsemältä.* (at seven)
|1 *yhdeltä*|2 *kahdelta*|3 *kolmelta*|4 *neljältä*|
|5 *viideltä*|6 *kuudelta*|7 *seitsemältä*|8 *kahdeksalta*|
|9 *yhdeksältä*|10 *kymmeneltä*|11 *yhdeltätoista*|12 *kahdeltatoista*|
Times of day: *aamulla, päivällä, iltapäivällä, illalla, yöllä*.` },
    ],
    topics: ['time'], skills: ['clock', 'clockAbl', 'vocab'],
  },
  {
    id: 'm4-4', mod: 'm4', title: 'Summary: where & when', fi: 'Yhteenveto', icon: 'compass',
    goals: ['Combine local cases and time'],
    learn: [{ h: 'Putting it together', body: `*Menen töihin kello kahdeksalta. Olen töissä neljään asti. Sitten menen kauppaan ja kotiin.*
(I go to work at eight. I'm at work until four. Then I go to the shop and home.)` }],
    topics: ['places', 'time'], skills: ['local', 'clock', 'clockAbl', 'wordorder'], reading: 'r-day',
  },
  {
    id: 'm4-5', mod: 'm4', title: 'Past tense (reading)', fi: 'Imperfekti', icon: 'rewind',
    goals: ['Recognise and form the simple past'],
    learn: [
      { h: 'The past tense marker is -i-', body: `|*puhun*|→|*puhuin*|
|*syön*|→|*söin*|
|*tulen*|→|*tulin*|
|*haluan*|→|*halusin*|
|*tarvitsen*|→|*tarvitsin*|
Endings stay the same: *-n, -t, –, -mme, -tte, -vat*.
Hän-form has no ending: *hän puhui, hän söi, hän tuli*.` },
      { h: 'Most useful irregulars', body: `*olla → olin, hän oli* · *tehdä → tein, hän teki* · *nähdä → näin, hän näki* · *tietää → tiesin* · *ymmärtää → ymmärsin*
Type 4 and 5 add *-si-*: *pelasin, halusin, tarvitsin*.` },
    ],
    topics: ['past'], skills: ['past'], reading: 'r-yesterday',
  },
  {
    id: 'm4-6', mod: 'm4', title: 'Meeting new people', fi: 'Tutustu uusiin ihmisiin', icon: 'users',
    goals: ['Introduce yourself at work or in a new group'],
    learn: [{ h: 'A full introduction', body: `*Hei! Minä olen Tom. Olen kotoisin Hollannista. Asun Helsingissä. Olen töissä toimistossa. Puhun hollantia, englantia ja vähän suomea. Harrastan juoksemista ja saunomista. Hauska tutustua!*` }],
    topics: ['meeting'], skills: ['vocab', 'countries', 'local'], reading: 'r-newjob', test: true,
  },

  // ───────────────────────────── BONUS
  {
    id: 'b-1', mod: 'b', title: 'Food & shopping', fi: 'Ruoka ja kauppa', icon: 'cart',
    goals: ['Order and shop in Finnish'],
    learn: [{ h: 'At the café & shop', body: `*Saisinko kahvin ja pullan?* Could I have a coffee and a bun?
*Voinko maksaa kortilla?* Can I pay by card? · *Tarvitsetko kassin?* Do you need a bag?
> Polite asking uses the conditional (*-isi-*): *saisin, ottaisin, haluaisin*. Learn these as fixed phrases first.` }],
    topics: ['food', 'partitive'], skills: ['vocab', 'partitive', 'prices'], reading: 'r-shop',
  },
  {
    id: 'b-2', mod: 'b', title: 'Body & health', fi: 'Keho ja terveys', icon: 'heart',
    goals: ['Explain what hurts'],
    learn: [{ h: 'At the doctor', body: `*Minulla on päänsärky.* I have a headache. · *Minulla on kuumetta.* I have a fever (partitive!).
*Selkään sattuu.* My back hurts. · Emergency number: **112**.` }],
    topics: ['body', 'appearance'], skills: ['vocab'],
  },
  {
    id: 'b-3', mod: 'b', title: 'Hobbies & free time', fi: 'Harrastukset', icon: 'music',
    goals: ['Talk about what you like doing'],
    learn: [{ h: 'Tykkään + infinitive', body: `*Tykkään hiihtää.* I like skiing. · *Pelaan jääkiekkoa.* I play ice hockey.
*Käyn salilla kolme kertaa viikossa.* I go to the gym three times a week.` }],
    topics: ['hobbies'], skills: ['vocab', 'vt15'],
  },
  {
    id: 'b-4', mod: 'b', title: 'City & transport', fi: 'Kaupunki ja liikenne', icon: 'bus',
    goals: ['Get around town'],
    learn: [{ h: 'Getting there', body: `Transport uses *-lla/-llä*: *bussilla, junalla, ratikalla, pyörällä*, but *kävellen* (on foot).
*Menen töihin metrolla.* I go to work by metro.` }],
    topics: ['travel', 'places'], skills: ['vocab', 'local'],
  },
  {
    id: 'b-5', mod: 'b', title: 'Spoken Finnish', fi: 'Puhekieli', icon: 'chat',
    goals: ['Understand everyday spoken Finnish'],
    learn: [{ h: 'How Finns really talk', body: `|written|spoken|
|*minä olen*|*mä oon*|
|*sinulla on*|*sul on*|
|*tämä, tuo*|*tää, toi*|
|*me menemme*|*me mennään*|
|*hän tulee*|*se tulee*|
|*yksi, kaksi*|*yks, kaks*|
> Learn written Finnish for structure, but listen to spoken Finnish every day (podcasts, Areena, Pirjo!).` }],
    topics: ['spoken'], skills: ['vocab', 'ollaSpoken', 'numbersSpoken'],
  },
];

export const LESSON_BY_ID = Object.fromEntries(LESSONS.map(l => [l.id, l]));
export const MODULE_BY_ID = Object.fromEntries(MODULES.map(m => [m.id, m]));
