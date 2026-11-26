// Verbs: inf | english | type | A-stem (minä/sinä/me/te + negative) | B-stem (hän/he; blank = same) | past minä | past hän | lesson
// Stems are written out explicitly, so consonant gradation (kpt) is always correct.
const RAW = `
olla|to be|0|ole||olin|oli|m1-4
puhua|to speak|1|puhu||puhuin|puhui|m1-9
asua|to live (somewhere)|1|asu||asuin|asui|m1-9
sanoa|to say|1|sano||sanoin|sanoi|m1-9
ostaa|to buy|1|osta||ostin|osti|m1-9
maksaa|to cost; to pay|1|maksa||maksoin|maksoi|m1-9
rakastaa|to love|1|rakasta||rakastin|rakasti|m1-9
kysyä|to ask|1|kysy||kysyin|kysyi|m1-9
istua|to sit|1|istu||istuin|istui|m1-9
laulaa|to sing|1|laula||lauloin|lauloi|m1-9
katsoa|to watch; to look|1|katso||katsoin|katsoi|m1-9
tanssia|to dance|1|tanssi||tanssin|tanssi|m1-9
matkustaa|to travel|1|matkusta||matkustin|matkusti|m1-9
muistaa|to remember|1|muista||muistin|muisti|m1-9
etsiä|to look for|1|etsi||etsin|etsi|m1-9
itkeä|to cry|1|itke||itkin|itki|m1-9
ajaa|to drive|1|aja||ajoin|ajoi|m1-9
nauraa|to laugh|1|naura||nauroin|nauroi|m1-9
auttaa|to help|1|auta|autta|autoin|auttoi|m2-4
odottaa|to wait|1|odota|odotta|odotin|odotti|m2-4
ottaa|to take|1|ota|otta|otin|otti|m2-4
soittaa|to call; to play (an instrument)|1|soita|soitta|soitin|soitti|m2-4
kirjoittaa|to write|1|kirjoita|kirjoitta|kirjoitin|kirjoitti|m2-4
tietää|to know (a fact)|1|tiedä|tietä|tiesin|tiesi|m2-4
lukea|to read; to study|1|lue|luke|luin|luki|m2-4
oppia|to learn|1|opi|oppi|opin|oppi|m2-4
nukkua|to sleep|1|nuku|nukku|nukuin|nukkui|m2-4
lähteä|to leave|1|lähde|lähte|lähdin|lähti|m2-4
antaa|to give|1|anna|anta|annoin|antoi|m2-4
ymmärtää|to understand|1|ymmärrä|ymmärtä|ymmärsin|ymmärsi|m2-4
pitää|to like (+sta); to hold|1|pidä|pitä|pidin|piti|m2-4
alkaa|to begin|1|ala|alka|aloin|alkoi|m2-4
kertoa|to tell|1|kerro|kerto|kerroin|kertoi|m2-4
hakea|to fetch; to apply|1|hae|hake|hain|haki|m2-4
leikkiä|to play (like children)|1|leiki|leikki|leikin|leikki|m2-4
tuntea|to know (a person); to feel|1|tunne|tunte|tunsin|tunsi|m2-4
piirtää|to draw|1|piirrä|piirtä|piirsin|piirsi|m2-4
käyttää|to use|1|käytä|käyttä|käytin|käytti|m2-4
pyytää|to ask for|1|pyydä|pyytä|pyysin|pyysi|m2-4
lentää|to fly|1|lennä|lentä|lensin|lensi|m2-4
hiihtää|to ski|1|hiihdä|hiihtä|hiihdin|hiihti|m2-4
tehdä|to do; to make|2|tee|teke|tein|teki|m3-2
nähdä|to see|2|näe|näke|näin|näki|m3-2
syödä|to eat|2|syö||söin|söi|m3-2
juoda|to drink|2|juo||join|joi|m3-2
käydä|to visit; to go (and come back)|2|käy||kävin|kävi|m3-2
saada|to get; to be allowed|2|saa||sain|sai|m3-2
voida|to be able to; can|2|voi||voin|voi|m3-2
myydä|to sell|2|myy||myin|myi|m3-2
jäädä|to stay|2|jää||jäin|jäi|m3-2
tuoda|to bring|2|tuo||toin|toi|m3-2
viedä|to take (somewhere)|2|vie||vein|vei|m3-2
uida|to swim|2|ui||uin|ui|m3-2
imuroida|to vacuum|2|imuroi||imuroin|imuroi|m3-2
tulla|to come|3|tule||tulin|tuli|m3-2
mennä|to go|3|mene||menin|meni|m3-2
opiskella|to study|3|opiskele||opiskelin|opiskeli|m3-2
kuunnella|to listen|3|kuuntele||kuuntelin|kuunteli|m3-2
ajatella|to think|3|ajattele||ajattelin|ajatteli|m3-2
nousta|to get up; to rise|3|nouse||nousin|nousi|m3-2
pestä|to wash|3|pese||pesin|pesi|m3-2
jutella|to chat|3|juttele||juttelin|jutteli|m3-2
kävellä|to walk|3|kävele||kävelin|käveli|m3-2
hymyillä|to smile|3|hymyile||hymyilin|hymyili|m3-2
harjoitella|to practise|3|harjoittele||harjoittelin|harjoitteli|m3-2
keskustella|to discuss|3|keskustele||keskustelin|keskusteli|m3-2
haluta|to want|4|halua||halusin|halusi|m3-2
osata|to know how to|4|osaa||osasin|osasi|m3-2
tavata|to meet|4|tapaa||tapasin|tapasi|m3-2
pelata|to play (a game)|4|pelaa||pelasin|pelasi|m3-2
tykätä|to like (+sta)|4|tykkää||tykkäsin|tykkäsi|m3-2
vastata|to answer|4|vastaa||vastasin|vastasi|m3-2
herätä|to wake up|4|herää||heräsin|heräsi|m3-2
siivota|to clean|4|siivoa||siivosin|siivosi|m3-2
korjata|to fix|4|korjaa||korjasin|korjasi|m3-2
kokata|to cook|4|kokkaa||kokkasin|kokkasi|m3-2
avata|to open|4|avaa||avasin|avasi|m3-2
maata|to lie (down)|4|makaa||makasin|makasi|m3-2
hypätä|to jump|4|hyppää||hyppäsin|hyppäsi|m3-2
tarvita|to need|5|tarvitse||tarvitsin|tarvitsi|m3-2
valita|to choose|5|valitse||valitsin|valitsi|m3-2
merkitä|to mean; to mark|5|merkitse||merkitsin|merkitsi|m3-2
häiritä|to disturb|5|häiritse||häiritsin|häiritsi|m3-2
vanheta|to get older|6|vanhene||vanhenin|vanheni|m3-2
lämmetä|to get warmer|6|lämpene||lämpenin|lämpeni|m3-2
`;

export const VERBS = RAW.trim().split('\n').map(l => {
  const [inf, en, type, a, b, p1, p3, lesson] = l.split('|');
  return { id: 'v:' + inf, inf, en, type: +type, a, b: b || a, p1, p3, lesson, grad: !!b && b !== a };
});
export const VERB_BY_INF = Object.fromEntries(VERBS.map(v => [v.inf, v]));
