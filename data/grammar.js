// Grammar data for SuomiT drills.

// country | English | nationality | language (nom) | language (partitive) | from (elative) | English language name
export const COUNTRIES = `
Suomi|Finland|suomalainen|suomi|suomea|Suomesta|Finnish
Ruotsi|Sweden|ruotsalainen|ruotsi|ruotsia|Ruotsista|Swedish
Norja|Norway|norjalainen|norja|norjaa|Norjasta|Norwegian
Tanska|Denmark|tanskalainen|tanska|tanskaa|Tanskasta|Danish
Islanti|Iceland|islantilainen|islanti|islantia|Islannista|Icelandic
Viro|Estonia|virolainen|viro|viroa|Virosta|Estonian
Venäjä|Russia|venäläinen|venäjä|venäjää|Venäjältä|Russian
Saksa|Germany|saksalainen|saksa|saksaa|Saksasta|German
Ranska|France|ranskalainen|ranska|ranskaa|Ranskasta|French
Espanja|Spain|espanjalainen|espanja|espanjaa|Espanjasta|Spanish
Italia|Italy|italialainen|italia|italiaa|Italiasta|Italian
Englanti|England|englantilainen|englanti|englantia|Englannista|English
Hollanti|the Netherlands|hollantilainen|hollanti|hollantia|Hollannista|Dutch
Puola|Poland|puolalainen|puola|puolaa|Puolasta|Polish
Kreikka|Greece|kreikkalainen|kreikka|kreikkaa|Kreikasta|Greek
Portugali|Portugal|portugalilainen|portugali|portugalia|Portugalista|Portuguese
Ukraina|Ukraine|ukrainalainen|ukraina|ukrainaa|Ukrainasta|Ukrainian
Unkari|Hungary|unkarilainen|unkari|unkaria|Unkarista|Hungarian
Turkki|Turkey|turkkilainen|turkki|turkkia|Turkista|Turkish
Kiina|China|kiinalainen|kiina|kiinaa|Kiinasta|Chinese
Japani|Japan|japanilainen|japani|japania|Japanista|Japanese
Yhdysvallat|the USA|amerikkalainen|englanti|englantia|Yhdysvalloista|English
Kanada|Canada|kanadalainen|englanti|englantia|Kanadasta|English
Brasilia|Brazil|brasilialainen|portugali|portugalia|Brasiliasta|Portuguese
Meksiko|Mexico|meksikolainen|espanja|espanjaa|Meksikosta|Spanish
Intia|India|intialainen|hindi|hindiä|Intiasta|Hindi
Thaimaa|Thailand|thaimaalainen|thai|thaita|Thaimaasta|Thai
Vietnam|Vietnam|vietnamilainen|vietnam|vietnamia|Vietnamista|Vietnamese
Irak|Iraq|irakilainen|arabia|arabiaa|Irakista|Arabic
Somalia|Somalia|somalialainen|somali|somalia|Somaliasta|Somali
`.trim().split('\n').map(l => {
  const [fi, en, nat, lang, langPart, from, langEn] = l.split('|');
  return { fi, en, nat, lang, langPart, from, langEn };
});

// place | English | genitive | illative ("to") | o = outer cases (-lla/-lta/-lle) | h = harmony override
// The -lla places are a classic trap: torilla, asemalla, Tampereella, Vantaalla...
export const PLACES = `
koulu|school|koulun|kouluun
kauppa|shop|kaupan|kauppaan
kirjasto|library|kirjaston|kirjastoon
ravintola|restaurant|ravintolan|ravintolaan
kahvila|café|kahvilan|kahvilaan
sairaala|hospital|sairaalan|sairaalaan
apteekki|pharmacy|apteekin|apteekkiin
pankki|bank|pankin|pankkiin
posti|post office|postin|postiin
kirkko|church|kirkon|kirkkoon
museo|museum|museon|museoon
yliopisto|university|yliopiston|yliopistoon
hotelli|hotel|hotellin|hotelliin
toimisto|office|toimiston|toimistoon
sauna|sauna|saunan|saunaan
keittiö|kitchen|keittiön|keittiöön
olohuone|living room|olohuoneen|olohuoneeseen
uimahalli|swimming hall|uimahallin|uimahalliin
metsä|forest|metsän|metsään
kaupunki|city|kaupungin|kaupunkiin
keskusta|city centre|keskustan|keskustaan
talo|house|talon|taloon
tori|market square|torin||o
asema|station|aseman||o
lentokenttä|airport|lentokentän||o
pysäkki|bus stop|pysäkin||o
ranta|beach|rannan||o
kuntosali|gym|kuntosalin||o
mökki|summer cottage|mökin||o
järvi|lake|järven||o
meri|sea|meren||o
parveke|balcony|parvekkeen||o
katu|street|kadun||o
Helsinki|Helsinki|Helsingin|Helsinkiin
Turku|Turku|Turun|Turkuun
Oulu|Oulu|Oulun|Ouluun
Espoo|Espoo|Espoon|Espooseen
Lahti|Lahti|Lahden|Lahteen
Jyväskylä|Jyväskylä|Jyväskylän|Jyväskylään
Kuopio|Kuopio|Kuopion|Kuopioon
Tampere|Tampere|Tampereen||o
Vantaa|Vantaa|Vantaan||o
Rovaniemi|Rovaniemi|Rovaniemen||o|f
`.trim().split('\n').map(l => {
  const [fi, en, gen, ill, o, h] = l.split('|');
  return { fi, en, gen, ill, o: o === 'o', h: h || undefined };
}).concat([
  { fi: 'koti', en: 'home', cases: { missa: 'kotona', mista: 'kotoa', mihin: 'kotiin' } },
  { fi: 'työ', en: 'work', cases: { missa: 'töissä', mista: 'töistä', mihin: 'töihin' } },
]);

// postposition (with genitive) | English
export const POSTPOSITIONS = [
  ['päällä', 'on top of'], ['alla', 'under'], ['vieressä', 'next to'], ['edessä', 'in front of'],
  ['takana', 'behind'], ['sisällä', 'inside'], ['lähellä', 'near'], ['keskellä', 'in the middle of'],
];
// things that can be placed (noun nominative ids from vocab) and reference objects (need genitive)
export const POSTPOS_THINGS = ['kissa', 'koira', 'kirja', 'lamppu', 'kynä', 'laukku', 'avain', 'puhelin', 'tyyny', 'pullo', 'kuppi', 'omena'];
export const POSTPOS_REFS = ['pöytä', 'sohva', 'sänky', 'tuoli', 'ikkuna', 'ovi', 'kaappi', 'hylly', 'auto', 'talo', 'tietokone', 'peili'];

// names: nominative | genitive | adessive (Mirjalla on...)
export const NAMES = `
Mirja|Mirjan|Mirjalla
Jukka|Jukan|Jukalla
Pekka|Pekan|Pekalla
Anna|Annan|Annalla
Liisa|Liisan|Liisalla
Matti|Matin|Matilla
Antti|Antin|Antilla
Ville|Villen|Villellä
Timo|Timon|Timolla
Mikko|Mikon|Mikolla
Heikki|Heikin|Heikillä
Päivi|Päivin|Päivillä
Laura|Lauran|Lauralla
Sanna|Sannan|Sannalla
`.trim().split('\n').map(l => { const [fi, gen, ade] = l.split('|'); return { fi, gen, ade }; });

export const OPPOSITES = [
  ['iso', 'pieni'], ['uusi', 'vanha'], ['nuori', 'vanha'], ['kallis', 'halpa'], ['hyvä', 'huono'],
  ['kaunis', 'ruma'], ['pitkä', 'lyhyt'], ['kuuma', 'kylmä'], ['nopea', 'hidas'], ['helppo', 'vaikea'],
  ['iloinen', 'surullinen'], ['vahva', 'heikko'], ['raskas', 'kevyt'], ['puhdas', 'likainen'], ['märkä', 'kuiva'],
  ['hiljainen', 'äänekäs'], ['tyhjä', 'täysi'], ['rikas', 'köyhä'], ['pehmeä', 'kova'], ['valoisa', 'pimeä'],
  ['terve', 'sairas'], ['ahkera', 'laiska'], ['hauska', 'tylsä'], ['vaalea', 'tumma'],
];

// days & "when?" forms
export const DAYS = [
  ['maanantai', 'maanantaina', 'Monday'], ['tiistai', 'tiistaina', 'Tuesday'], ['keskiviikko', 'keskiviikkona', 'Wednesday'],
  ['torstai', 'torstaina', 'Thursday'], ['perjantai', 'perjantaina', 'Friday'], ['lauantai', 'lauantaina', 'Saturday'],
  ['sunnuntai', 'sunnuntaina', 'Sunday'],
];
export const MONTHS = ['tammikuu', 'helmikuu', 'maaliskuu', 'huhtikuu', 'toukokuu', 'kesäkuu', 'heinäkuu', 'elokuu', 'syyskuu', 'lokakuu', 'marraskuu', 'joulukuu']
  .map((m, i) => [m, m + 'ssa', ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][i]]);
export const SEASONS = [['kevät', 'keväällä', 'spring'], ['kesä', 'kesällä', 'summer'], ['syksy', 'syksyllä', 'autumn'], ['talvi', 'talvella', 'winter']];
export const RELDAYS = [['toissapäivänä', -2, 'the day before yesterday'], ['eilen', -1, 'yesterday'], ['tänään', 0, 'today'], ['huomenna', 1, 'tomorrow'], ['ylihuomenna', 2, 'the day after tomorrow']];

// Letter names (for spelling)
export const LETTERS = [['a', 'aa'], ['b', 'bee'], ['c', 'see'], ['d', 'dee'], ['e', 'ee'], ['f', 'äf'], ['g', 'gee'], ['h', 'hoo'], ['i', 'ii'], ['j', 'jii'], ['k', 'koo'], ['l', 'äl'], ['m', 'äm'], ['n', 'än'], ['o', 'oo'], ['p', 'pee'], ['q', 'kuu'], ['r', 'är'], ['s', 'äs'], ['t', 'tee'], ['u', 'uu'], ['v', 'vee'], ['w', 'kaksois-vee'], ['x', 'äks'], ['y', 'yy'], ['z', 'tset'], ['å', 'ruotsalainen oo'], ['ä', 'ää'], ['ö', 'öö']];
// Minimal pairs: length changes meaning
export const MINIMAL_PAIRS = [
  ['tuli', 'fire', 'tuuli', 'wind'], ['tuli', 'fire', 'tulli', 'customs'], ['kuka', 'who', 'kukka', 'flower'],
  ['kisa', 'competition', 'kissa', 'cat'], ['mato', 'worm', 'matto', 'rug'], ['muta', 'mud', 'mutta', 'but'],
  ['kylä', 'village', 'kyllä', 'yes'], ['tili', 'account', 'tiili', 'brick'], ['sika', 'pig', 'siika', 'whitefish'],
  ['laki', 'law', 'lakki', 'cap'], ['rapu', 'crayfish', 'rappu', 'stairway'], ['tapaan', 'I meet', 'tappaan', 'I kill'],
  ['mutta', 'but', 'muuta', 'other (partitive)'], ['kato', 'look! (spoken)', 'katto', 'roof'],
  ['pala', 'piece', 'palaa', 'it burns'], ['kansa', 'people, nation', 'kanssa', 'with'], ['kasa', 'pile', 'kassa', 'checkout'],
  ['tulee', 'comes', 'tuulee', "it's windy"], ['vapa', 'fishing rod', 'vapaa', 'free'], ['valita', 'to choose', 'valittaa', 'to complain'],
];
