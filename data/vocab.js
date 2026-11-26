// SuomiT vocabulary. Written for SuomiT; topics follow the course order.
// Line format:  fi | english | pos | forms (genitive partitive plural) | example (fi = en)
// pos: n noun, a adjective, p phrase, adv adverb, q question word, pr pronoun, num number, x other
// "## id | lesson | Title | emoji" starts a topic.
const RAW = `
## sounds | m1-1 | Sounds & letters | type
tuli|fire|n|tulen tulta tulet
tuuli|wind|n|tuulen tuulta tuulet
tulli|customs|n|tullin tullia tullit
kuka|who|q
kukka|flower|n|kukan kukkaa kukat
kisa|competition|n|kisan kisaa kisat
kissa|cat|n|kissan kissaa kissat
mato|worm|n|madon matoa madot
matto|rug, carpet|n|maton mattoa matot
muta|mud|n|mudan mutaa mudat
mutta|but|x
kylä|village|n|kylän kylää kylät
kyllä|yes (formal)|x
tili|(bank) account|n|tilin tiliä tilit
tiili|brick|n|tiilen tiiltä tiilet
sika|pig|n|sian sikaa siat
siika|whitefish|n|siian siikaa siiat
laki|law|n|lain lakia lait
lakki|cap|n|lakin lakkia lakit
rapu|crayfish|n|ravun rapua ravut
rappu|stairway|n|rapun rappua raput
katto|roof, ceiling|n|katon kattoa katot
aakkoset|alphabet|n
kirjain|letter (of the alphabet)|n|kirjaimen kirjainta kirjaimet
vokaali|vowel|n|vokaalin vokaalia vokaalit
konsonantti|consonant|n|konsonantin konsonanttia konsonantit
Miten se kirjoitetaan?|How is it spelled?|p
Mikä sinun nimi on?|What is your name?|p
sukunimi|surname|n|sukunimen sukunimeä sukunimet
osoite|address|n|osoitteen osoitetta osoitteet

## numbers | m1-2 | Numbers & prices | hash
nolla|zero|num
yksi|one|num
kaksi|two|num
kolme|three|num
neljä|four|num
viisi|five|num
kuusi|six|num
seitsemän|seven|num
kahdeksan|eight|num
yhdeksän|nine|num
kymmenen|ten|num
sata|hundred|num
tuhat|thousand|num
miljoona|million|num
numero|number|n|numeron numeroa numerot
puhelinnumero|phone number|n|puhelinnumeron puhelinnumeroa puhelinnumerot
euro|euro|n|euron euroa eurot
sentti|cent|n|sentin senttiä sentit
hinta|price|n|hinnan hintaa hinnat
halpa|cheap|a|halvan halpaa halvat
kallis|expensive|a|kalliin kallista kalliit
Mitä se maksaa?|What does it cost?|p
Kuinka paljon se maksaa?|How much does it cost?|p
Paljonko kello on?|What time is it?|p
Se maksaa kaksi euroa.|It costs two euros.|p
kuitti|receipt|n|kuitin kuittia kuitit
kassa|checkout, till|n|kassan kassaa kassat
tarjous|special offer|n|tarjouksen tarjousta tarjoukset
alennus|discount|n|alennuksen alennusta alennukset

## greetings | m1-3 | Greetings & phrases | wave
Hei!|Hi!|p
Moi!|Hi! / Bye! (casual)|p
Terve!|Hello! (casual)|p
Hyvää huomenta!|Good morning!|p
Hyvää päivää!|Good day!|p
Hyvää iltaa!|Good evening!|p
Hyvää yötä!|Good night!|p
Näkemiin!|Goodbye! (formal)|p
Moikka!|Bye!|p
Heippa!|Bye! (casual)|p
Nähdään!|See you!|p
Nähdään huomenna!|See you tomorrow!|p
Kiitos!|Thank you!|p
Kiitos paljon!|Thank you very much!|p
Ole hyvä!|Here you go! / You're welcome!|p
Ei kestä!|You're welcome! (no problem)|p
Anteeksi!|Sorry! / Excuse me!|p
Ei se mitään.|It's nothing. / No worries.|p
Mitä kuuluu?|How are you?|p
Kiitos hyvää.|Fine, thanks.|p
Entä sinulle?|And you?|p
Hauska tavata!|Nice to meet you!|p
Hauska tutustua!|Nice to get to know you!|p
Minun nimeni on Anna.|My name is Anna.|p
Tervetuloa!|Welcome!|p
Hyvää ruokahalua!|Enjoy your meal!|p
Kippis!|Cheers!|p
Onneksi olkoon!|Congratulations!|p
Hyvää viikonloppua!|Have a nice weekend!|p
Hyvää matkaa!|Have a good trip!|p
Hyvää joulua!|Merry Christmas!|p
Hyvää päivänjatkoa!|Have a nice rest of the day!|p
Kiitos samoin!|Thanks, you too!|p
Nuku hyvin!|Sleep well!|p
Puhutko englantia?|Do you speak English?|p
En ymmärrä.|I don't understand.|p
Voitko toistaa?|Can you repeat?|p
Puhu hitaasti, kiitos.|Speak slowly, please.|p
Mitä tämä tarkoittaa?|What does this mean?|p
Miten sanotaan suomeksi...?|How do you say ... in Finnish?|p
Puhun vähän suomea.|I speak a little Finnish.|p
joo|yeah, yes (spoken)|x
ei|no|x
ehkä|maybe|x
selvä|OK, got it|x
okei|okay|x

## pronouns | m1-4 | Pronouns & olla | user
minä|I|pr
sinä|you (one person)|pr
hän|he / she|pr
me|we|pr
te|you (plural / formal)|pr
he|they (people)|pr
se|it (also: he/she in spoken Finnish)|pr
ne|they (things; also people in spoken Finnish)|pr
mä|I (spoken)|pr
sä|you (spoken)|pr
tämä|this|pr
tuo|that|pr
olla|to be|x
vuosi|year|n|vuoden vuotta vuodet
myöhässä|late|adv
kotona|at home|adv
iloinen|happy|a|iloisen iloista iloiset
mies|man|n|miehen miestä miehet
nainen|woman|n|naisen naista naiset
ranskalainen|French (person)|a|ranskalaisen ranskalaista ranskalaiset

## days | m1-5 | Days of the week | calendar
maanantai|Monday|n|maanantain maanantaita maanantait
tiistai|Tuesday|n|tiistain tiistaita tiistait
keskiviikko|Wednesday|n|keskiviikon keskiviikkoa keskiviikot
torstai|Thursday|n|torstain torstaita torstait
perjantai|Friday|n|perjantain perjantaita perjantait
lauantai|Saturday|n|lauantain lauantaita lauantait
sunnuntai|Sunday|n|sunnuntain sunnuntaita sunnuntait
päivä|day|n|päivän päivää päivät
viikko|week|n|viikon viikkoa viikot
viikonloppu|weekend|n|viikonlopun viikonloppua viikonloput
arkipäivä|weekday, working day|n|arkipäivän arkipäivää arkipäivät
tänään|today|adv
huomenna|tomorrow|adv
ylihuomenna|the day after tomorrow|adv
eilen|yesterday|adv
toissapäivänä|the day before yesterday|adv
nyt|now|adv
pian|soon|adv
Mikä päivä tänään on?|What day is it today?|p

## harmony | m1-6 | Vowel harmony | scale
talo|house|n|talon taloa talot
metsä|forest|n|metsän metsää metsät
pöytä|table|n|pöydän pöytää pöydät
auto|car|n|auton autoa autot
kylpyhuone|bathroom|n|kylpyhuoneen kylpyhuonetta kylpyhuoneet
tyttö|girl|n|tytön tyttöä tytöt
poika|boy; son|n|pojan poikaa pojat
kynä|pen|n|kynän kynää kynät
kirja|book|n|kirjan kirjaa kirjat
järvi|lake|n|järven järveä järvet

## plural | m1-7 | T-plural | layers
huone|room|n|huoneen huonetta huoneet
uusi|new|a|uuden uutta uudet
lippu|ticket; flag|n|lipun lippua liput
kauppa|shop|n|kaupan kauppaa kaupat
katu|street|n|kadun katua kadut
pankki|bank|n|pankin pankkia pankit
kenkä|shoe|n|kengän kenkää kengät
ihminen|person, human|n|ihmisen ihmistä ihmiset
avain|key|n|avaimen avainta avaimet
puhelin|phone|n|puhelimen puhelinta puhelimet
kieli|language; tongue|n|kielen kieltä kielet
nimi|name|n|nimen nimeä nimet
käsi|hand|n|käden kättä kädet
vesi|water|n|veden vettä vedet
ystävä|friend|n|ystävän ystävää ystävät
kaupunki|city|n|kaupungin kaupunkia kaupungit

## countries | m1-8 | Countries & languages | globe
maa|country; land; ground|n|maan maata maat
kansalaisuus|nationality|n|kansalaisuuden kansalaisuutta kansalaisuudet
äidinkieli|mother tongue|n|äidinkielen äidinkieltä äidinkielet
Mistä olet kotoisin?|Where are you from?|p
Olen kotoisin Suomesta.|I am from Finland.|p
Minkä maalainen sinä olet?|What nationality are you?|p
Mitä kieliä puhut?|What languages do you speak?|p
Puhun suomea ja englantia.|I speak Finnish and English.|p
ulkomaalainen|foreigner|n|ulkomaalaisen ulkomaalaista ulkomaalaiset
maanosa|continent|n|maanosan maanosaa maanosat
Eurooppa|Europe|n|Euroopan Eurooppaa
pohjoinen|north|n|pohjoisen pohjoista
etelä|south|n|etelän etelää
itä|east|n|idän itää
länsi|west|n|lännen länttä

## verbs1 | m1-9 | Verb type 1 | run
## qwords | m1-10 | Question words | help
kuka|who|q
kenen|whose|q
mikä|what (which thing)|q
mitä|what (what thing / doing)|q
missä|where (in/at)|q
mistä|from where|q
mihin|to where|q
milloin|when|q
miksi|why|q
miten|how|q
millainen|what kind of|q
kuinka vanha|how old|q
kuinka monta|how many|q
kuinka paljon|how much|q
paljonko|how much|q
mihin aikaan|at what time|q
minkä maalainen|what nationality|q
minkävärinen|what colour|q
minkänäköinen|what does (he/she) look like|q
kumpi|which (of two)|q
Mitä sinä teet?|What are you doing?|p

## family | m1-11 | Family | users
perhe|family|n|perheen perhettä perheet
äiti|mother|n|äidin äitiä äidit
isä|father|n|isän isää isät
vanhemmat|parents|n
lapsi|child|n|lapsen lasta lapset
tytär|daughter|n|tyttären tytärtä tyttäret
veli|brother|n|veljen veljeä veljet
sisko|sister|n|siskon siskoa siskot
sisarus|sibling|n|sisaruksen sisarusta sisarukset
mummo|grandma|n|mummon mummoa mummot
isoäiti|grandmother|n|isoäidin isoäitiä isoäidit
vaari|grandpa|n|vaarin vaaria vaarit
isoisä|grandfather|n|isoisän isoisää isoisät
isovanhemmat|grandparents|n
vaimo|wife|n|vaimon vaimoa vaimot
aviomies|husband|n|aviomiehen aviomiestä aviomiehet
puoliso|spouse|n|puolison puolisoa puolisot
poikaystävä|boyfriend|n|poikaystävän poikaystävää poikaystävät
tyttöystävä|girlfriend|n|tyttöystävän tyttöystävää tyttöystävät
serkku|cousin|n|serkun serkkua serkut
täti|aunt|n|tädin tätiä tädit
setä|uncle (father's brother)|n|sedän setää sedät
eno|uncle (mother's brother)|n|enon enoa enot
vauva|baby|n|vauvan vauvaa vauvat
sukulainen|relative|n|sukulaisen sukulaista sukulaiset
lapsenlapsi|grandchild|n|lapsenlapsen lapsenlasta lapsenlapset
naimisissa|married|adv
sinkku|single|n|sinkun sinkkua sinkut

## weather | m2-2 | Weather | cloud
sää|weather|n|sään säätä säät
keli|weather (road / outdoor)|n|kelin keliä kelit
ilma|weather; air|n|ilman ilmaa ilmat
aurinko|sun|n|auringon aurinkoa auringot
sade|rain|n|sateen sadetta sateet
lumi|snow|n|lumen lunta lumet
pilvi|cloud|n|pilven pilveä pilvet
sumu|fog|n|sumun sumua sumut
ukkonen|thunderstorm|n|ukkosen ukkosta ukkoset
pakkanen|frost (below zero)|n|pakkasen pakkasta pakkaset
räntä|sleet|n|rännän räntää rännät
aste|degree|n|asteen astetta asteet
lämpötila|temperature|n|lämpötilan lämpötilaa lämpötilat
kylmä|cold|a|kylmän kylmää kylmät
kuuma|hot|a|kuuman kuumaa kuumat
lämmin|warm|a|lämpimän lämmintä lämpimät
viileä|cool|a|viileän viileää viileät
aurinkoinen|sunny|a|aurinkoisen aurinkoista aurinkoiset
pilvinen|cloudy|a|pilvisen pilvistä pilviset
sateinen|rainy|a|sateisen sateista sateiset
tuulinen|windy|a|tuulisen tuulista tuuliset
sumuinen|foggy|a|sumuisen sumuista sumuiset
tosi|really, very (spoken)|adv
Millainen sää on?|What is the weather like?|p
Sataa.|It's raining.|p
Sataa lunta.|It's snowing.|p
Aurinko paistaa.|The sun is shining.|p
Tuulee.|It's windy.|p
On pakkasta.|It's freezing.|p
On kaunis ilma.|It's beautiful weather.|p

## months | m2-3 | Months & seasons | calendar
tammikuu|January|n|tammikuun tammikuuta
helmikuu|February|n|helmikuun helmikuuta
maaliskuu|March|n|maaliskuun maaliskuuta
huhtikuu|April|n|huhtikuun huhtikuuta
toukokuu|May|n|toukokuun toukokuuta
kesäkuu|June|n|kesäkuun kesäkuuta
heinäkuu|July|n|heinäkuun heinäkuuta
elokuu|August|n|elokuun elokuuta
syyskuu|September|n|syyskuun syyskuuta
lokakuu|October|n|lokakuun lokakuuta
marraskuu|November|n|marraskuun marraskuuta
joulukuu|December|n|joulukuun joulukuuta
kuukausi|month|n|kuukauden kuukautta kuukaudet
vuodenaika|season|n|vuodenajan vuodenaikaa vuodenajat
kevät|spring|n|kevään kevättä keväät
kesä|summer|n|kesän kesää kesät
syksy|autumn|n|syksyn syksyä syksyt
talvi|winter|n|talven talvea talvet
keväällä|in spring|adv
kesällä|in summer|adv
syksyllä|in autumn|adv
talvella|in winter|adv
joulu|Christmas|n|joulun joulua joulut
juhannus|Midsummer|n|juhannuksen juhannusta juhannukset
vappu|May Day|n|vapun vappua vaput
uusivuosi|New Year|n
syntymäpäivä|birthday|n|syntymäpäivän syntymäpäivää syntymäpäivät
nimipäivä|name day|n|nimipäivän nimipäivää nimipäivät
loma|holiday, vacation|n|loman lomaa lomat
mökki|summer cottage|n|mökin mökkiä mökit

## verbs1kpt | m2-4 | Verb type 1 + kpt | gear
## colors | m2-5 | Colours | palette
väri|colour|n|värin väriä värit
punainen|red|a|punaisen punaista punaiset
sininen|blue|a|sinisen sinistä siniset
keltainen|yellow|a|keltaisen keltaista keltaiset
vihreä|green|a|vihreän vihreää vihreät
musta|black|a|mustan mustaa mustat
valkoinen|white|a|valkoisen valkoista valkoiset
harmaa|grey|a|harmaan harmaata harmaat
ruskea|brown|a|ruskean ruskeaa ruskeat
oranssi|orange|a|oranssin oranssia oranssit
violetti|purple|a|violetin violettia violetit
liila|lilac|a|liilan liilaa liilat
vaaleanpunainen|pink|a|vaaleanpunaisen vaaleanpunaista vaaleanpunaiset
pinkki|pink (bright)|a|pinkin pinkkiä pinkit
kultainen|golden|a|kultaisen kultaista kultaiset
hopeinen|silver|a|hopeisen hopeista hopeiset
vaalea|light, pale|a|vaalean vaaleaa vaaleat
tumma|dark|a|tumman tummaa tummat
Minkävärinen se on?|What colour is it?|p

## clothes | m2-6 | Clothes | shirt
vaate|piece of clothing|n|vaatteen vaatetta vaatteet
paita|shirt|n|paidan paitaa paidat
t-paita|T-shirt|n|t-paidan t-paitaa t-paidat
villapaita|sweater|n|villapaidan villapaitaa villapaidat
huppari|hoodie|n|hupparin hupparia hupparit
housut|trousers|n
farkut|jeans|n
shortsit|shorts|n
hame|skirt|n|hameen hametta hameet
mekko|dress|n|mekon mekkoa mekot
takki|coat, jacket|n|takin takkia takit
pipo|beanie|n|pipon pipoa pipot
hattu|hat|n|hatun hattua hatut
lakki|cap|n|lakin lakkia lakit
huivi|scarf|n|huivin huivia huivit
hanskat|gloves|n
lapaset|mittens|n
sukka|sock|n|sukan sukkaa sukat
saapas|boot|n|saappaan saapasta saappaat
lenkkarit|sneakers|n
puku|suit|n|puvun pukua puvut
solmio|tie|n|solmion solmiota solmiot
toppi|top|n|topin toppia topit
pyjama|pyjamas|n|pyjaman pyjamaa pyjamat
uimapuku|swimsuit|n|uimapuvun uimapukua uimapuvut
laukku|bag|n|laukun laukkua laukut
vyö|belt|n|vyön vyötä vyöt
sateenvarjo|umbrella|n|sateenvarjon sateenvarjoa sateenvarjot
silmälasit|glasses|n
korvakoru|earring|n|korvakorun korvakorua korvakorut
sormus|ring|n|sormuksen sormusta sormukset
kello|watch; clock|n|kellon kelloa kellot
Mitä sinulla on päällä?|What are you wearing?|p
Minulla on päällä...|I'm wearing...|p

## have | m2-7 | "I have" | gift
koira|dog|n|koiran koiraa koirat
hevonen|horse|n|hevosen hevosta hevoset
lehmä|cow|n|lehmän lehmää lehmät
lammas|sheep|n|lampaan lammasta lampaat
lintu|bird|n|linnun lintua linnut
kala|fish|n|kalan kalaa kalat
hiiri|mouse|n|hiiren hiirtä hiiret
karhu|bear|n|karhun karhua karhut
susi|wolf|n|suden sutta sudet
kettu|fox|n|ketun kettua ketut
jänis|hare|n|jäniksen jänistä jänikset
hirvi|moose, elk|n|hirven hirveä hirvet
poro|reindeer|n|poron poroa porot
orava|squirrel|n|oravan oravaa oravat
norppa|ringed seal|n|norpan norppaa norpat
porkkana|carrot|n|porkkanan porkkanaa porkkanat
paprika|bell pepper|n|paprikan paprikaa paprikat
pyörä|bicycle|n|pyörän pyörää pyörät
Onko sinulla...?|Do you have...?|p
Minulla ei ole...|I don't have...|p
Kenellä on...?|Who has...?|p

## appearance | m2-8 | Appearance | smile
pitkä|tall; long|a|pitkän pitkää pitkät
lyhyt|short|a|lyhyen lyhyttä lyhyet
nuori|young|a|nuoren nuorta nuoret
vanha|old|a|vanhan vanhaa vanhat
keski-ikäinen|middle-aged|a|keski-ikäisen keski-ikäistä keski-ikäiset
hoikka|slim|a|hoikan hoikkaa hoikat
tukeva|stocky, sturdy|a|tukevan tukevaa tukevat
kaunis|beautiful|a|kauniin kaunista kauniit
komea|handsome|a|komean komeaa komeat
söpö|cute|a|söpön söpöä söpöt
tukka|hair (on the head)|n|tukan tukkaa tukat
hiukset|hair (strands)|n
silmä|eye|n|silmän silmää silmät
parta|beard|n|parran partaa parrat
viikset|moustache|n
kalju|bald|a|kaljun kaljua kaljut
kihara|curly|a|kiharan kiharaa kiharat
suora|straight|a|suoran suoraa suorat
vaaleatukkainen|blond(e)|a|vaaleatukkaisen vaaleatukkaista vaaleatukkaiset
tummatukkainen|dark-haired|a|tummatukkaisen tummatukkaista tummatukkaiset
pää|head|n|pään päätä päät
korva|ear|n|korvan korvaa korvat
nenä|nose|n|nenän nenää nenät
suu|mouth|n|suun suuta suut
jalka|leg; foot|n|jalan jalkaa jalat
hammas|tooth|n|hampaan hammasta hampaat
kasvot|face|n
sormi|finger|n|sormen sormea sormet
Minkänäköinen hän on?|What does he/she look like?|p

## adjectives | m2-9 | Adjectives | sparkle
iso|big|a|ison isoa isot
pieni|small|a|pienen pientä pienet
hyvä|good|a|hyvän hyvää hyvät
huono|bad|a|huonon huonoa huonot
ruma|ugly|a|ruman rumaa rumat
nopea|fast|a|nopean nopeaa nopeat
hidas|slow|a|hitaan hidasta hitaat
helppo|easy|a|helpon helppoa helpot
vaikea|difficult|a|vaikean vaikeaa vaikeat
surullinen|sad|a|surullisen surullista surulliset
vahva|strong|a|vahvan vahvaa vahvat
heikko|weak|a|heikon heikkoa heikot
raskas|heavy|a|raskaan raskasta raskaat
kevyt|light (weight)|a|kevyen kevyttä kevyet
puhdas|clean|a|puhtaan puhdasta puhtaat
likainen|dirty|a|likaisen likaista likaiset
märkä|wet|a|märän märkää märät
kuiva|dry|a|kuivan kuivaa kuivat
hiljainen|quiet|a|hiljaisen hiljaista hiljaiset
äänekäs|loud|a|äänekkään äänekästä äänekkäät
tyhjä|empty|a|tyhjän tyhjää tyhjät
täysi|full|a|täyden täyttä täydet
rikas|rich|a|rikkaan rikasta rikkaat
köyhä|poor|a|köyhän köyhää köyhät
pehmeä|soft|a|pehmeän pehmeää pehmeät
kova|hard; loud|a|kovan kovaa kovat
pimeä|dark (no light)|a|pimeän pimeää pimeät
valoisa|bright (full of light)|a|valoisan valoisaa valoisat
terve|healthy|a|terveen tervettä terveet
sairas|ill, sick|a|sairaan sairasta sairaat
ahkera|hard-working|a|ahkeran ahkeraa ahkerat
laiska|lazy|a|laiskan laiskaa laiskat
ystävällinen|friendly|a|ystävällisen ystävällistä ystävälliset
mukava|nice, comfortable|a|mukavan mukavaa mukavat
hauska|fun, funny|a|hauskan hauskaa hauskat
tylsä|boring|a|tylsän tylsää tylsät
kiva|nice (spoken)|a|kivan kivaa kivat
ihana|lovely|a|ihanan ihanaa ihanat
hieno|great, fine|a|hienon hienoa hienot
väsynyt|tired|a|väsyneen väsynyttä väsyneet
nälkäinen|hungry|a|nälkäisen nälkäistä nälkäiset
kiinnostava|interesting|a|kiinnostavan kiinnostavaa kiinnostavat
tärkeä|important|a|tärkeän tärkeää tärkeät

## genitive | m2-10 | Genitive | link
lääkäri|doctor|n|lääkärin lääkäriä lääkärit
opettaja|teacher|n|opettajan opettajaa opettajat
opiskelija|student|n|opiskelijan opiskelijaa opiskelijat
sohva|sofa|n|sohvan sohvaa sohvat
pormestari|mayor|n|pormestarin pormestaria pormestarit
naapuri|neighbour|n|naapurin naapuria naapurit
omena|apple|n|omenan omenaa omenat
Kenen tämä on?|Whose is this?|p
Tämä on minun.|This is mine.|p

## partitive | m3-1 | Partitive | cup
leipä|bread|n|leivän leipää leivät
maito|milk|n|maidon maitoa maidot
kahvi|coffee|n|kahvin kahvia kahvit
tee|tea|n|teen teetä teet
mehu|juice|n|mehun mehua mehut
olut|beer|n|oluen olutta oluet
viini|wine|n|viinin viiniä viinit
juusto|cheese|n|juuston juustoa juustot
voi|butter|n|voin voita voit
liha|meat|n|lihan lihaa lihat
kana|chicken|n|kanan kanaa kanat
peruna|potato|n|perunan perunaa perunat
riisi|rice|n|riisin riisiä riisit
keitto|soup|n|keiton keittoa keitot
salaatti|salad|n|salaatin salaattia salaatit
banaani|banana|n|banaanin banaania banaanit
mansikka|strawberry|n|mansikan mansikkaa mansikat
mustikka|blueberry|n|mustikan mustikkaa mustikat
tomaatti|tomato|n|tomaatin tomaattia tomaatit
kurkku|cucumber|n|kurkun kurkkua kurkut
sipuli|onion|n|sipulin sipulia sipulit
muna|egg|n|munan munaa munat
sokeri|sugar|n|sokerin sokeria sokerit
suola|salt|n|suolan suolaa suolat
jäätelö|ice cream|n|jäätelön jäätelöä jäätelöt
kakku|cake|n|kakun kakkua kakut
pulla|sweet bun|n|pullan pullaa pullat
karkki|candy|n|karkin karkkia karkit
suklaa|chocolate|n|suklaan suklaata suklaat
makkara|sausage|n|makkaran makkaraa makkarat
lohi|salmon|n|lohen lohta lohet
puuro|porridge|n|puuron puuroa puurot
ruisleipä|rye bread|n|ruisleivän ruisleipää ruisleivät
karjalanpiirakka|Karelian pie|n|karjalanpiirakan karjalanpiirakkaa karjalanpiirakat
kilo|kilo|n|kilon kiloa kilot
litra|litre|n|litran litraa litrat
pullo|bottle|n|pullon pulloa pullot
lasi|glass|n|lasin lasia lasit
kuppi|cup|n|kupin kuppia kupit
pala|piece|n|palan palaa palat
pari|a couple of; pair|n|parin paria parit
paljon|a lot, much|adv
vähän|a little|adv
Saanko...?|May I have...?|p

## verbtypes | m3-2 | Verb types 1–5 | puzzle
## home | m3-3 | Home & furniture | home
koti|home|n|kodin kotia kodit
asunto|apartment, flat|n|asunnon asuntoa asunnot
kerrostalo|apartment building|n|kerrostalon kerrostaloa kerrostalot
omakotitalo|detached house|n|omakotitalon omakotitaloa omakotitalot
rivitalo|terraced house|n|rivitalon rivitaloa rivitalot
keittiö|kitchen|n|keittiön keittiötä keittiöt
olohuone|living room|n|olohuoneen olohuonetta olohuoneet
makuuhuone|bedroom|n|makuuhuoneen makuuhuonetta makuuhuoneet
vessa|toilet|n|vessan vessaa vessat
sauna|sauna|n|saunan saunaa saunat
parveke|balcony|n|parvekkeen parveketta parvekkeet
eteinen|hallway|n|eteisen eteistä eteiset
vaatehuone|walk-in closet|n|vaatehuoneen vaatehuonetta vaatehuoneet
piha|yard|n|pihan pihaa pihat
yksiö|studio (1 room)|n|yksiön yksiötä yksiöt
kaksio|2-room flat|n|kaksion kaksiota kaksiot
kolmio|3-room flat|n|kolmion kolmiota kolmiot
tuoli|chair|n|tuolin tuolia tuolit
nojatuoli|armchair|n|nojatuolin nojatuolia nojatuolit
sänky|bed|n|sängyn sänkyä sängyt
kaappi|cupboard|n|kaapin kaappia kaapit
vaatekaappi|wardrobe|n|vaatekaapin vaatekaappia vaatekaapit
hylly|shelf|n|hyllyn hyllyä hyllyt
kirjahylly|bookshelf|n|kirjahyllyn kirjahyllyä kirjahyllyt
lamppu|lamp|n|lampun lamppua lamput
ikkuna|window|n|ikkunan ikkunaa ikkunat
ovi|door|n|oven ovea ovet
lattia|floor|n|lattian lattiaa lattiat
seinä|wall|n|seinän seinää seinät
verho|curtain|n|verhon verhoa verhot
peili|mirror|n|peilin peiliä peilit
matto|rug|n|maton mattoa matot
jääkaappi|fridge|n|jääkaapin jääkaappia jääkaapit
liesi|stove|n|lieden liettä liedet
uuni|oven|n|uunin uunia uunit
pesukone|washing machine|n|pesukoneen pesukonetta pesukoneet
astianpesukone|dishwasher|n|astianpesukoneen astianpesukonetta astianpesukoneet
televisio|television|n|television televisiota televisiot
tietokone|computer|n|tietokoneen tietokonetta tietokoneet
tyyny|pillow|n|tyynyn tyynyä tyynyt
peitto|blanket|n|peiton peittoa peitot
suihku|shower|n|suihkun suihkua suihkut
kylpyamme|bathtub|n|kylpyammeen kylpyammetta kylpyammeet
päällä|on (top of)|x
alla|under|x
vieressä|next to|x
edessä|in front of|x
takana|behind|x
välissä|between|x
sisällä|inside|x
lähellä|near|x
keskellä|in the middle of|x

## gradation | m3-4 | Nouns: word types & kpt | repeat
## rev3a | m3-5 | Revision: verbs & partitive | repeat
## rev3b | m3-6 | Revision: kpt, word order, VT5 | repeat
## read3a | m3-7 | Reading: my room | read
## read3b | m3-8 | Reading: my best friend | read
## rev3c | m3-9 | Revision: grammar | repeat
## rev4a | m4-1 | Revision: modules 1–3 | repeat
## places | m4-2 | Places: where / from / to | location
koulu|school|n|koulun koulua koulut
kirjasto|library|n|kirjaston kirjastoa kirjastot
ravintola|restaurant|n|ravintolan ravintolaa ravintolat
kahvila|café|n|kahvilan kahvilaa kahvilat
sairaala|hospital|n|sairaalan sairaalaa sairaalat
apteekki|pharmacy|n|apteekin apteekkia apteekit
tori|market square|n|torin toria torit
asema|station|n|aseman asemaa asemat
lentokenttä|airport|n|lentokentän lentokenttää lentokentät
pysäkki|stop (bus/tram)|n|pysäkin pysäkkiä pysäkit
ranta|beach, shore|n|rannan rantaa rannat
kuntosali|gym|n|kuntosalin kuntosalia kuntosalit
keskusta|city centre|n|keskustan keskustaa keskustat
kirkko|church|n|kirkon kirkkoa kirkot
museo|museum|n|museon museota museot
yliopisto|university|n|yliopiston yliopistoa yliopistot
hotelli|hotel|n|hotellin hotellia hotellit
toimisto|office|n|toimiston toimistoa toimistot
posti|post office|n|postin postia postit
meri|sea|n|meren merta meret
uimahalli|swimming hall|n|uimahallin uimahallia uimahallit
elokuvateatteri|cinema|n|elokuvateatterin elokuvateatteria elokuvateatterit
työ|work, job|n|työn työtä työt
oikealla|on the right|adv
vasemmalla|on the left|adv
suoraan|straight ahead|adv
täällä|here|adv
siellä|there|adv
Missä on...?|Where is...?|p

## time | m4-3 | Time & clock | clock
kello|o'clock|n|kellon kelloa kellot
tunti|hour; lesson|n|tunnin tuntia tunnit
minuutti|minute|n|minuutin minuuttia minuutit
sekunti|second|n|sekunnin sekuntia sekunnit
puoli|half|x
vartti|quarter of an hour|n|vartin varttia vartit
yli|past (the hour)|x
vaille|to (the hour)|x
tasan|exactly|adv
aamu|morning|n|aamun aamua aamut
aamupäivä|late morning|n|aamupäivän aamupäivää aamupäivät
iltapäivä|afternoon|n|iltapäivän iltapäivää iltapäivät
ilta|evening|n|illan iltaa illat
yö|night|n|yön yötä yöt
vuorokausi|day (24 hours)|n|vuorokauden vuorokautta vuorokaudet
aamulla|in the morning|adv
päivällä|during the day|adv
iltapäivällä|in the afternoon|adv
illalla|in the evening|adv
yöllä|at night|adv
aikaisin|early|adv
myöhään|late|adv
aina|always|adv
usein|often|adv
joskus|sometimes|adv
harvoin|rarely|adv
ei koskaan|never|adv
Paljonko kello on?|What time is it?|p
Mitä kello on?|What time is it?|p
Mihin aikaan?|At what time?|q

## summary4 | m4-4 | Summary: where & when | compass
## past | m4-5 | Past tense (reading) | rewind
eilen illalla|yesterday evening|adv
viime viikolla|last week|adv
viime vuonna|last year|adv
sitten|then; ago|adv
ensin|first|adv
lopuksi|finally|adv

## meeting | m4-6 | Meeting new people | users
työpaikka|workplace|n|työpaikan työpaikkaa työpaikat
työkaveri|colleague|n|työkaverin työkaveria työkaverit
esimies|boss, supervisor|n|esimiehen esimiestä esimiehet
ammatti|profession|n|ammatin ammattia ammatit
harrastus|hobby|n|harrastuksen harrastusta harrastukset
Mitä teet työksesi?|What do you do for work?|p
Olen töissä...|I work at...|p
Mitkä ovat harrastuksesi?|What are your hobbies?|p
Kuinka kauan olet asunut Suomessa?|How long have you lived in Finland?|p
Olen asunut täällä vuoden.|I've lived here for a year.|p
Tervetuloa taloon!|Welcome aboard!|p
Saanko esitellä...|May I introduce...|p

## food | b-1 | Food & shopping | cart
ruoka|food|n|ruoan ruokaa ruoat
aamiainen|breakfast|n|aamiaisen aamiaista aamiaiset
lounas|lunch|n|lounaan lounasta lounaat
päivällinen|dinner|n|päivällisen päivällistä päivälliset
välipala|snack|n|välipalan välipalaa välipalat
appelsiini|orange|n|appelsiinin appelsiinia appelsiinit
mansikka|strawberry|n|mansikan mansikkaa mansikat
korvapuusti|cinnamon bun|n|korvapuustin korvapuustia korvapuustit
lihapulla|meatball|n|lihapullan lihapullaa lihapullat
kasvis|vegetable|n|kasviksen kasvista kasvikset
hedelmä|fruit|n|hedelmän hedelmää hedelmät
marja|berry|n|marjan marjaa marjat
kauppalista|shopping list|n|kauppalistan kauppalistaa kauppalistat
ostoskori|shopping basket|n|ostoskorin ostoskoria ostoskorit
kassi|bag (shopping)|n|kassin kassia kassit
myyjä|shop assistant|n|myyjän myyjää myyjät
Saisinko kahvin?|Could I have a coffee?|p
Ottaisin tämän.|I'll take this one.|p
Voinko maksaa kortilla?|Can I pay by card?|p
Tarvitsetko kassin?|Do you need a bag?|p
Lasku, kiitos.|The bill, please.|p
Maistuu hyvältä!|Tastes good!|p
nälkä|hunger|n|nälän nälkää
jano|thirst|n|janon janoa
Minulla on nälkä.|I'm hungry.|p
Minulla on jano.|I'm thirsty.|p

## body | b-2 | Body & health | heart
keho|body|n|kehon kehoa kehot
vatsa|stomach|n|vatsan vatsaa vatsat
selkä|back|n|selän selkää selät
kurkku|throat|n|kurkun kurkkua kurkut
sydän|heart|n|sydämen sydäntä sydämet
olkapää|shoulder|n|olkapään olkapäätä olkapäät
polvi|knee|n|polven polvea polvet
kipu|pain|n|kivun kipua kivut
kuume|fever|n|kuumeen kuumetta kuumeet
flunssa|flu, cold|n|flunssan flunssaa flunssat
lääke|medicine|n|lääkkeen lääkettä lääkkeet
terveyskeskus|health centre|n|terveyskeskuksen terveyskeskusta terveyskeskukset
Minulla on päänsärky.|I have a headache.|p
Minuun sattuu.|It hurts (me).|p
Minulla on kuumetta.|I have a fever.|p
Olen kipeä.|I'm sick.|p
Parane pian!|Get well soon!|p

## hobbies | b-3 | Hobbies & free time | music
vapaa-aika|free time|n|vapaa-ajan vapaa-aikaa
urheilu|sport|n|urheilun urheilua
jalkapallo|football|n|jalkapallon jalkapalloa jalkapallot
jääkiekko|ice hockey|n|jääkiekon jääkiekkoa
musiikki|music|n|musiikin musiikkia
elokuva|film|n|elokuvan elokuvaa elokuvat
peli|game|n|pelin peliä pelit
konsertti|concert|n|konsertin konserttia konsertit
kalastus|fishing|n|kalastuksen kalastusta
retki|trip, outing|n|retken retkeä retket
kirjallisuus|literature|n|kirjallisuuden kirjallisuutta
Tykkään hiihtää.|I like skiing.|p
Pelaan jalkapalloa.|I play football.|p
Käyn salilla.|I go to the gym.|p
Mennään saunaan!|Let's go to the sauna!|p

## travel | b-4 | City & transport | bus
bussi|bus|n|bussin bussia bussit
juna|train|n|junan junaa junat
ratikka|tram (spoken)|n|ratikan ratikkaa ratikat
metro|metro|n|metron metroa metrot
taksi|taxi|n|taksin taksia taksit
lentokone|aeroplane|n|lentokoneen lentokonetta lentokoneet
laiva|ship, ferry|n|laivan laivaa laivat
tie|road|n|tien tietä tiet
kartta|map|n|kartan karttaa kartat
matka|trip; distance|n|matkan matkaa matkat
matkalippu|travel ticket|n|matkalipun matkalippua matkaliput
kauppakeskus|shopping centre|n|kauppakeskuksen kauppakeskusta kauppakeskukset
silta|bridge|n|sillan siltaa sillat
risteys|intersection|n|risteyksen risteystä risteykset
Mistä lähtee bussi keskustaan?|Where does the bus to the centre leave from?|p
Kuinka pitkä matka on?|How far is it?|p
Yksi lippu Tampereelle, kiitos.|One ticket to Tampere, please.|p

## spoken | b-5 | Spoken Finnish (puhekieli) | chat
mä oon|I am (spoken)|p
sä oot|you are (spoken)|p
mitä sä teet?|what are you doing? (spoken)|p
mul on|I have (spoken)|p
sul on|you have (spoken)|p
mennään|let's go|p
toi|that (spoken: tuo)|pr
noi|those (spoken: nuo)|pr
tää|this (spoken: tämä)|pr
nää|these (spoken: nämä)|pr
kiitti|thanks (spoken)|p
moro|hi (Tampere style)|p
no niin|well then / alright|p
ihan sama|whatever / I don't mind|p
just niin|exactly|p
eiks nii?|right? isn't it?|p
kauheesti|tons, terribly (spoken)|adv
tosi kiva|really nice|p
`;

export const TOPICS = [];
export const VOCAB = [];
const seen = new Map();
let cur = null;
for (const line of RAW.split('\n')) {
  const l = line.trim();
  if (!l) continue;
  if (l.startsWith('## ')) {
    const [id, lesson, title, icon] = l.slice(3).split('|').map(s => s.trim());
    cur = { id, lesson, title, icon, words: [] };
    TOPICS.push(cur);
    continue;
  }
  const [fi, en, pos, forms, ex] = l.split('|').map(s => s && s.trim());
  let w = seen.get(fi.toLowerCase());
  if (!w) {
    w = { id: 'w:' + fi.toLowerCase(), fi, en, pos, topics: [], lesson: cur.lesson };
    if (forms) { const [gen, part, pl] = forms.split(' '); Object.assign(w, { gen, part, pl }); }
    if (ex) { const [a, b] = ex.split(' = '); w.ex = { fi: a, en: b }; }
    seen.set(fi.toLowerCase(), w); VOCAB.push(w);
  } else if (!w.en.includes(en)) {
    w.en += '; ' + en; // same spelling, another meaning (e.g. kurkku = cucumber; throat)
  }
  if (!w.topics.includes(cur.id)) w.topics.push(cur.id);
  cur.words.push(w.id);
}
export const VOCAB_BY_ID = Object.fromEntries(VOCAB.map(w => [w.id, w]));
export const TOPIC_BY_ID = Object.fromEntries(TOPICS.map(t => [t.id, t]));
