# Course coverage: Basic Finnish Club → SuomiT

Audit of every teaching point in the 27 course decks against SuomiT's data
(`data/course.js` learn cards, `data/vocab.js` topics, `data/readings.js` stories,
`data/grammar.js` drill data, skills in `js/exercises.js`).
All SuomiT content is original: explanations are rewritten and example sentences and stories are new.
Slides that only link to outside videos, quizzes or flashcards are not counted as teaching points; those links live in `data/resources.js` and the in-app practice sets.

Status: **C** covered · **P** partial · **M** missing. "Before" is the state at the start of this audit, "After" is the state after it.

## Totals

| | Covered | Partial | Missing | Points |
|---|---|---|---|---|
| Before | 74 | 34 | 9 | 117 |
| After | 115 | 2 | 0 | 117 |

The two partials that remain are listening tasks, which need a new drill type (see "Drill specs" at the end).

Places to look in SuomiT, used in the tables:
`L:` learn card in the lesson · `V:` vocab topic · `R:` reading · `S:` skill (drill) · `G:` grammar.js data

---

## Module 1

### m1-1 Alphabet & pronunciation (deck01)
| # | Teaching point | Before | After | Where in SuomiT |
|---|---|---|---|---|
| 1 | Letter names, alphabet | C | C | L "Letter names vs. letter sounds"; S letters; G LETTERS |
| 2 | Letter name vs. letter sound (koo → k) | P | C | L "Letter names vs. letter sounds" |
| 3 | Spelling dialogue (what's your name / how is it spelled / it's spelled…) | P | C | L "Spelling your name" (new names); V sounds: *Miten se kirjoitetaan?, Se kirjoitetaan…, Kaunis nimi!* |
| 4 | Personal details: surname, middle name, address | P | C | V sounds: *sukunimi, toinen nimi, osoite*; L "Spelling your name" |
| 5 | Vowel and consonant inventory (incl. foreign letters) | P | C | L "The 8 vowels", "Letter names vs. letter sounds" |
| 6 | Long vs. short vowels change meaning | C | C | L "Length changes meaning"; S length; G MINIMAL_PAIRS (extended) |
| 7 | Single vs. double consonants | C | C | same as 6 |
| 8 | Vowel pairs (diphthongs) | M | C | L "Vowel pairs (diphthongs)"; V *diftongi* |
| 9 | Tongue twisters / listen and repeat sentences | M | C | L "Tongue twisters (kielisolmut)"; V two folk tongue twisters |

### m1-2 Numbers & prices (deck02)
| # | Teaching point | Before | After | Where |
|---|---|---|---|---|
| 10 | Written numbers | C | C | L "Building numbers"; S numbers |
| 11 | Spoken numbers (puhekieli) | C | C | L "Spoken numbers"; S numbersSpoken |
| 12 | Prices (euros + cents, spoken style) | C | C | S prices; L tip |
| 13 | Asking the price | C | C | L "Asking the price"; V *Mitä se maksaa?, Paljonko se maksaa?* |
| 14 | Phone-number task (sketch, write down the number) | M | P | L "Phone numbers & number nicknames"; R r-phone (own dialogue, spoken digits); listen-and-write drill still needed (spec A) |
| 15 | Numbers reading comprehension (counts, total price) | M | C | R r-numbers (linked) |
| 16 | Colloquial digit names (kasi, ysi…) | P | C | L "Phone numbers…"; V *ykkönen … kymppi* |

### m1-3 Greetings (deck03)
| # | Teaching point | Before | After | Where |
|---|---|---|---|---|
| 17 | Greetings by time of day | C | C | L "Hello at any time of day"; V greetings |
| 18 | Introductions and small talk | C | C | L "Small talk" |
| 19 | Everyday polite phrases | C | C | L "The magic words"; S phrases; V greetings |
| 20 | Reading 1: first language class, introductions | M | C | R r-class (linked) |
| 21 | Reading 2: dinner phrases (enjoy, hope you like it, thanks for the meal, good night, you too) | P | C | L "At the table and saying good night"; R r-dinner; V *Kiitos ruoasta!, Toivottavasti maistuu!, Samoin!, Hyvää yötä myös sinulle!* |

### m1-4 Pronouns & olla (deck04)
| # | Teaching point | Before | After | Where |
|---|---|---|---|---|
| 22 | Personal pronouns, written + spoken | C | C | L "olla = to be"; V pronouns |
| 23 | olla present | C | C | S olla |
| 24 | olla negative | C | C | L; S ollaNeg |
| 25 | Spoken olla + spoken negative | C | C | S ollaSpoken; L tip |
| 26 | Questions: Olenko / Oletko | C | C | L; S ollaQ |
| 27 | Age with olla; plural predicates (iloisia, vanhoja) | P | C | L "Age and plural descriptions"; V *Olen 30-vuotias., Me olemme iloisia.* |

### m1-5 Days of the week (deck05)
| # | Teaching point | Before | After | Where |
|---|---|---|---|---|
| 28 | Day names | C | C | L; V days; S days |
| 29 | When? → -na/-nä | C | C | L; S days |
| 30 | Relative days (today … day after tomorrow) | C | C | L table; S days; G RELDAYS |
| 31 | "When?" questions and answers; "what day is it?" | P | C | L "Asking and answering when?"; R r-week (linked); V *viikonloppuna, joka päivä, ensi viikolla* (S days has a wording bug, see Notes) |

### m1-6 Vowel harmony (deck06)
| 32 | Front / back / neutral vowels | C | C | L; S harmony |
| 33 | Choosing ending pairs (-ssa/-ssä, -ko/-kö…) | C | C | L "The rule SuomiT uses"; S harmony |

### m1-7 T-plural (deck07)
| 34 | Add -t | C | C | L step 1; S tplural |
| 35 | Word-type stem changes before -t | C | C | L step 2 |
| 36 | kpt-gradation in the plural | C | C | L step 3 |

### m1-8 Countries, nationalities, languages (deck08)
| # | Teaching point | Before | After | Where |
|---|---|---|---|---|
| 37 | Countries | P | C | L table (13 rows); V countries (15 countries); G COUNTRIES (30 entries, 5 new); S countries |
| 38 | Nationalities | P | C | same; V 16 nationality words |
| 39 | Languages, partitive after *puhua*, mother tongue | P | C | L "More ways to ask"; V *äidinkieli, Äidinkieleni on venäjä.* |
| 40 | Asking others where they're from and their nationality | C | C | L; R r-countries (linked) |

### m1-9 Verb type 1 (deck09)
| 41 | Present conjugation | C | C | L; S vt1 |
| 42 | Negative | C | C | S vt1neg |
| 43 | -ko/-kö questions | C | C | S questionKo |
| 44 | Learn many VT1 verbs | C | C | data/verbs.js (17 without kpt, 24 with kpt) |

### m1-10 Question words (deck10)
| # | Teaching point | Before | After | Where |
|---|---|---|---|---|
| 45 | Full question-word list (how old / many / much, at what time, nationality, from which country) | P | C | L table (extended); V qwords (*mistä maasta*, *Kuinka vanha sinä olet?*) |
| 46 | Straight word order in questions | C | C | L |
| 47 | Open vs. closed questions; joo / ei / ehkä | P | C | L "Open and closed questions" |
| 48 | Mikä or mitä | C | C | L; S qwords |
| 49 | Forming -ko/-kö questions | C | C | S questionKo, ollaQ |

### m1-11 Family (deck11)
| 50 | Family vocabulary | C | C | L; V family; R r-family |

## Module 2

### m2-2 Weather (deck12)
| # | Teaching point | Before | After | Where |
|---|---|---|---|---|
| 51 | sää = keli = ilma | C | C | L; V weather |
| 52 | Temperature scale (really cold … really hot) | C | C | L; V |
| 53 | Weather adjectives (sunny, rainy, foggy…) | C | C | V weather |
| 54 | tykätä / pitää + -sta | C | C | L "I like…" |
| 55 | Favourite weather / season / month; weather you don't like | M | C | L "Favourites: lempi-"; V *lempivuodenaika, lempiväri, lempiruoka* + questions |
| 56 | Listening: place weather symbols from a forecast | P | P | R r-weather covers the vocabulary; a forecast listening drill is still needed (spec B) |

### m2-3 Months & seasons (deck13)
| # | Teaching point | Before | After | Where |
|---|---|---|---|---|
| 57 | Months | C | C | L; V months; S months |
| 58 | Seasons + -lla/-llä | C | C | L; S months |
| 59 | In which month? → -ssa | C | C | L; S months |
| 60 | Questions: birth month, name day, New Year, May Day | P | C | L "Questions with months and seasons"; V *Missä kuussa sinä olet syntynyt?* |
| 61 | Season + month answers | P | C | same card |
| 62 | Reading: seasons in Finland (slush, short days, cottage, skiing, sleet) | P | C | R r-year (linked); V *loska, kaamos* |
| 63 | Mixed test: months, seasons, weekdays, times of day | P | C | L "Parts of the day"; lesson skills now include `days`; V time-of-day words |

### m2-4 Verb type 1 + kpt (deck14)
| 64 | Strong / weak grades in VT1 | C | C | L; S vt1kpt |
| 65 | Many kpt verbs | C | C | data/verbs.js |

### m2-5 Colours (deck15)
| 66 | Colours, what colour? | C | C | L; V colors |

### m2-6 Clothes (deck16)
| # | Teaching point | Before | After | Where |
|---|---|---|---|---|
| 67 | Clothes vocabulary | C | C | V clothes |
| 68 | I'm wearing / he/she is wearing | C | C | L; S clothes |
| 69 | Plural clothes + plural adjective | C | C | L; S clothes |
| 70 | Shopping for clothes | M | C | L "Shopping for clothes"; R r-clothes (linked); V *koko, sovituskoppi, liian, Saanko sovittaa tätä?…* |

### m2-7 "I have" (deck17)
| 71 | minulla on… (all persons) | C | C | L; S have |
| 72 | Onko sinulla? yes / no | C | C | L |
| 73 | Names + -lla (Mirjalla, Jukalla) | C | C | L; S have; G NAMES |
| 74 | Who has? / Who doesn't have? + partitive | P | C | L (added the negative question); V *Kenellä ei ole…?* |
| 75 | minulla on vs. minä olen | C | C | L tip |

### m2-8 Appearance (deck18)
| 76 | Hän on… vs. Hänellä on… | C | C | L |
| 77 | Appearance vocabulary | C | C | V appearance; R r-friend |
| 78 | Millainen vs. minkänäköinen | P | C | L "Millainen or minkänäköinen?"; V *Millainen hän on?, ulkonäkö* |

### m2-9 Adjectives (deck19)
| 79 | Describing things (Millainen?) | C | C | L; V adjectives |
| 80 | Opposites | C | C | S opposites; G OPPOSITES |

### m2-10 Genitive (deck20)
| # | Teaching point | Before | After | Where |
|---|---|---|---|---|
| 81 | -n, kenen / minkä | C | C | L; S genitive, genitivePron |
| 82 | Genitive + "must" (pitää) | C | C | L |
| 83 | Genitive + postpositions | C | C | L; S postpos |
| 84 | Gradation and word types in the genitive | C | C | L "Watch the stem" |
| 85 | "X is Mirja's" (genitive after *on*) | P | C | L "Whose is it?"; R r-whose (linked); drill suggested (spec D) |
| 86 | Themed vocabulary and category words (animals, fruit, berries, vehicles, furniture, dishes, tools) | P | C | L "Category words"; V genitive topic (22 new words) |

## Module 3

### m3-1 Partitive (deck21)
| # | Teaching point | Before | After | Where |
|---|---|---|---|---|
| 87 | After numbers (not 1) | C | C | L; S partitive |
| 88 | After amount words (pair, kilo, bunch, glass) | P | C | L; V *nippu, pussi, purkki, paketti, kannu* |
| 89 | With eat / drink | C | C | L; S partitive |
| 90 | Open amount ("some", there is some … in …) | P | C | L; V *Lasissa on maitoa., Saanko lisää kahvia?, kangas* |
| 91 | Negative sentences (general) | P | C | L; drill suggested (spec C) |
| 92 | Greetings in the partitive | C | C | L; V *Päivää!, Huomenta!, Iltaa!* |
| 93 | Forming the partitive | C | C | L "How? Three endings"; S partitive |
| 94 | Verbs that take a partitive object | C | C | L (list extended) |
| 95 | minulla ei ole + partitive | C | C | L; S have |

### m3-2 Verb types 1–5 (deck22)
| 96 | Identify the verb type | C | C | L; S verbtype |
| 97 | Present conjugation of every type | P | C | L "Full tables: one verb per type"; S vt15, vt15neg |
| 98 | The present also covers the future | M | C | L same card |

### m3-3 Home (deck23)
| # | Teaching point | Before | After | Where |
|---|---|---|---|---|
| 99 | House types (incl. semi-detached, low-rise block) | P | C | L "Homes and rooms"; V *paritalo, pienkerrostalo* |
| 100 | Rooms + ad abbreviations (K, OH, MH, KH/KPH, VH, ET, S, P, WC) | P | C | L table |
| 101 | Flat sizes, open-plan kitchen, floor area in m² | P | C | L "Reading a flat ad"; R r-flat (linked); V *avokeittiö, neliö, neliömetri, pinta-ala, kerros, hissi, vuokra* |
| 102 | Furniture | C | C | V home |
| 103 | Postpositions | C | C | L; S postpos |
| 104 | Where do you live? (home talk) | P | C | L; V *Missä sinä asut?, Asun kerrostalossa.*; R r-room, r-flat |

### m3-4 Consonant gradation + word types (deck24, deck25)
| 105 | kpt group A (all pairs) | P | C | L "group A (strong → weak)", 11 pairs |
| 106 | kpt group B | P | C | L "group B (weak → strong)"; V gradation topic (A/B example nouns) |
| 107 | Word types by ending | C | C | L table (+ -is, -ut/-yt, -uus rows) |
| 108 | Word types in the t-plural and genitive | C | C | S tplural, genitive |

## Module 4

### m4-2 Local cases (deck26)
| # | Teaching point | Before | After | Where |
|---|---|---|---|---|
| 109 | Inner cases: in / out of / into | C | C | L; S local |
| 110 | Outer cases | C | C | L; S local |
| 111 | Case names (inessive … allative) | M | C | L "The six local cases by name" |
| 112 | Forming the illative | C | C | L |
| 113 | Verbs and cases (go / come / visit) | P | C | L "Verbs pick the question"; V *Mihin sinä menet?, Mistä sinä tulet?, Käyn kaupassa.* |
| 114 | Moving around town | P | C | R r-city (linked); b-4 lesson |

### m4-3 Time & clock (deck27)
| 115 | Telling the time | C | C | L; S clock |
| 116 | At what time? → -lta | C | C | L; S clockAbl |
| 117 | Times of day | C | C | L (+ *aamupäivällä*); V time |

Revision lessons (m1-12, m2-1, m2-11, m3-5, m3-6, m3-9, m4-1, m4-4) and the reading lessons have no decks. They reuse the skills and topics above.

---

## Notes

- **Bug (js/exercises.js, not changed by this audit):** the `days` skill asks `Mikä päivä on eilen?` and `Mikä päivä on toissapäivänä?`. Past days need the past tense: `Mikä päivä oli eilen?` / `…oli toissapäivänä?`. Fix: `const verb = off < 0 ? 'oli' : 'on'` and use it in both `P(...)` and `say`.
- **Fixed in data/readings.js:** the third question of r-newjob asked what *Timo* does as a hobby but marked *Laura's* hobby as correct, and two options were true for Timo. It now asks about Laura.
- New vocab words have no pre-generated neural audio clips yet, so the app falls back to its normal TTS for them until the audio is regenerated.
- Some existing words were also listed in an earlier topic, so their `lesson` moved earlier. Their ids are unchanged, so learner progress is kept: *aamu, ilta, yö, aamulla, päivällä, illalla, yöllä* (m4-3 → m2-3) and *hedelmä, marja* (b-1 → m2-10).

## Drill specs (new skill types for js/exercises.js)

**A. `phone` – listen and write a phone number (m1-2).**
Generate `'0' + pick(['40','44','45','50'])` followed by 7 random digits. Speak it in groups of 3-3-4, digit by digit, randomly in written (*neljä, viisi, kahdeksan, yhdeksän*) or spoken style (*viis, kuus, seittemän, kasi, ysi*). Show a speaker icon and ask "Write the number in digits". Accept the answer with spaces and dashes removed. Example: say *nolla neljä viis, kuus seittemän kaks, ysi kasi yks kaks* → answer `0456729812`. Use `kind: 'type'`, `listen: true`, `numeric: true`.

**B. `forecast` – weather listening (m2-2).**
Pick a city from PLACES and a weather condition from a list like `[['Aurinko paistaa.','sun'],['Sataa.','rain'],['Sataa lunta.','snow'],['Tuulee.','wind'],['On sumuista.','fog'],['On pilvistä.','cloud']]`, plus a temperature from −20 to +30. Say, for example, *Helsingissä sataa lunta. Lämpötila on miinus viisi astetta.* Then ask an MC question for the condition (icons or English) and/or type the temperature. City in the inessive comes from `F.local(p).missa`.

**C. `partNeg` – make it negative with a partitive object (m3-1).**
Take a sentence pattern `[subject, verb, object]` with an object from `nouns()` or `DRINKS`/`FOODS`. Show the positive sentence (*Minä ostan auton.* / *Minulla on kissa.*) and ask for the negative (*Minä en osta autoa.* / *Minulla ei ole kissaa.*). Answer = `F.negative(v)[p] + ' ' + w.part`. Also add an amount variant: *kilo / pussi / lasi / pari / nippu* + ___ (w.fi) → `w.part`.

**D. `genPred` – whose is it? (m2-10).**
Show "The carrot is Mirja's." and ask for *Porkkana on Mirjan.* (tiles or type), using NAMES.gen and HAVE_THINGS. Reverse variant: *Kenen ___ on?* with MC over genitive names.

**E. `gradAB` – strong or weak? (m3-4).**
From `nouns()` pick words where `gen` stem ≠ basic-form stem. Ask "Basic form → genitive" (type `w.gen`), or MC "Group A or B?". Classify by comparing the basic form with `w.gen`: a longer or "stronger" consonant cluster in the genitive means B (*sade/sateen*, *hammas/hampaan*), and a weaker one means A (*kauppa/kaupan*). The explanation line shows the pair.

**F. `caseVerb` – verb chooses the case (m4-2).**
Template `[verb phrase, case key]`: `menen → mihin`, `tulen (from) → mista`, `asun / olen / käyn → missa`, `lähden → mista`. Pick a place from PLACES, show *Käyn ___ (posti)* and expect `F.local(p)[key]` → *postissa*.
