# The learning science behind SuomiT

SuomiT doesn't use one magic method. It combines a handful of findings that are among the best supported in memory and second-language research, and points each one at the specific hard parts of Finnish. This page explains each principle and the SuomiT feature that applies it.

---

## 1. Retrieval practice (the testing effect)

Pulling an answer *out* of memory strengthens it far more than reading it again. In Roediger & Karpicke (2006), students who practised recalling a text remembered more a week later than students who re-studied it, even though re-studying *felt* more effective. Karpicke & Roediger (2008) showed the same for foreign-language word pairs: repeated retrieval, not repeated study, drove long-term retention.

**In SuomiT:** almost every screen asks you to produce something. You see a new word once on its intro card, and two or three cards later SuomiT asks you to recall it. There is no "just read the list" mode.

## 2. Spacing

Reviews spread out over time beat the same reviews crammed together. Cepeda et al. (2006) synthesised hundreds of studies and found a robust benefit of distributed over massed practice. The best gap grows with how long you want to remember. For second-language learning specifically, the meta-analysis by Kim & Webb (2022) found that spaced practice reliably outperformed massed practice, with the advantage most visible on delayed tests.

**In SuomiT:** each word and each grammar skill is scheduled individually (see FSRS below). The **Daily mix** always starts with what is due today.

## 3. FSRS-6: scheduling each item at the right moment

SuomiT uses **FSRS-6** (Free Spaced Repetition Scheduler) from the open-spaced-repetition project, the same family of algorithm Anki now ships. FSRS models every item with three numbers:

- **Stability**: how many days until recall probability drops to 90 %
- **Difficulty**: how hard the item is for *you*
- **Retrievability**: the current chance you'd recall it

After every answer it updates these and schedules the next review for when your predicted recall reaches the **target retention of 0.9**. Reviews land just before you'd forget, which is the most efficient point. SuomiT uses the published FSRS-6 default parameters and formulas from `py-fsrs`.

**In SuomiT:** your answers grade the card automatically. Wrong = *Again*. Right with a typo or missing dots = *Hard*. Right = *Good*. Quickly typed right on a known card = *Easy*. Flashcard mode lets you grade yourself. Grammar skills are scheduled the same way, based on your accuracy in each drill.

## 4. Production over recognition (the generation effect)

Information you generate yourself is remembered better than information you only read (Slamecka & Graf, 1978). Recognising *kissa* among four options is much easier than **typing** it, and typing is closer to what speaking demands.

**In SuomiT:** new and fragile words start with multiple choice (recognition). As stability grows they move to **typed recall** (English → Finnish), **dictation** (listen → type) and **sentence building**. Grammar drills are mostly typed.

## 5. Interleaving

Mixing different problem types in one session feels harder than practising one type at a time, but it produces better learning. You have to choose the right rule each time, not just repeat it (Rohrer & Taylor, 2007). For Finnish this is crucial: in real sentences you constantly choose between partitive and genitive, inner and outer cases, strong and weak grades.

**In SuomiT:** the Daily mix and lesson sessions interleave vocabulary with two or more grammar skills, and never repeat the same skill twice in a row. Revision lessons deliberately mix whole modules.

## 6. Desirable difficulties, without punishment

Bjork (1994) coined *desirable difficulties*: conditions that slow down practice in the moment (spacing, interleaving, retrieval, varied formats) but improve long-term retention. The key word is *desirable*. Difficulty should come from effortful recall, not from anxiety.

**In SuomiT:** no hearts and no lives, and nothing gets locked away. A mistake simply means that item comes back a few cards later and sooner in the schedule. Feedback always shows the correct answer, speaks it, and explains the rule (*"pöytä has front vowels → -ssä"*).

## 7. Input and output

Grammar and vocabulary drills build the pieces, but language is acquired from large amounts of **understandable input** (Krashen, 1982). Producing language yourself forces you to notice the gaps in your knowledge (Swain, 1985). Both matter.

**In SuomiT:** graded stories at your level with tap-to-translate and read-aloud; every lesson links to videos, listening and reading on Yle (Selkouutiset, Kielikoulu, Areena), podcasts and YouTube. Sentence-building, typed answers and "say it out loud" prompts provide the output side.

## 8. High-frequency words and chunks first

A small set of very frequent words covers a large share of everyday language, so learning those first pays off fastest (Nation, 2013). Much fluent speech is also built from ready-made **chunks** (*Mitä kuuluu?*, *Ei se mitään*, *Minulla on nälkä*) rather than words assembled one by one (Wray, 2002).

**In SuomiT:** the vocabulary follows the course's everyday themes (greetings, family, food, home, time, places). Phrases are learned as whole units, and long ones are practised by building them from word tiles.

## 9. What makes Finnish specifically hard, and how SuomiT targets it

The US Foreign Service Institute groups Finnish with its "hard" languages for English speakers: about **44 weeks / 1,100 class hours** to professional working proficiency. The difficulty isn't pronunciation or spelling (both are very regular). It's **morphology**: one noun can take dozens of forms, and the stem itself changes. The only way through is to make these patterns automatic.

| Finnish challenge | SuomiT drill |
|---|---|
| **Vowel harmony** (-ssa/-ssä, -ko/-kö, -vat/-vät) | *Vowel harmony* drill with the rule explained on every mistake |
| **Consonant gradation** (kpt: *kauppa → kaupan*, *nukkua → nukun*) | *Verb type 1 + kpt*, *T-plural*, *Genitive*. Every noun card shows its genitive, partitive and plural |
| **Verb types 1–6** | *Spot the verb type*, conjugation in all persons, negatives, -ko/-kö questions, past tense |
| **Cases** (partitive, genitive, local cases) | *Partitive*, *Genitive*, *Minulla on*, *Postpositions*, *Missä / mistä / mihin* (incl. the outer-case trap: *Tampereella, torilla*) |
| **Length changes meaning** (*tuli / tuuli / tulli*, *kuka / kukka*) | *Long vs. short* listening drill. The answer checker never accepts a length error as a "typo" |
| **Dots change meaning** (a/ä, o/ö) | Missing dots are flagged every time (strict mode available) |
| **Spoken ≠ written Finnish** (*minä olen → mä oon*, *kaksi → kaks*) | *olla: spoken*, *Spoken numbers*, a bonus *Puhekieli* lesson, and links to real spoken Finnish |

## 10. Habit, and the limits of gamification

What learners do every day matters more than any single technique. Streaks, daily goals and small rewards help with **consistency**. SuomiT uses them carefully: XP rewards correct recall rather than time spent, streak freezes (*Sisu shields*) keep one missed day from wiping out weeks of progress, and nothing is ever taken away for a mistake. The game exists to bring you back each day; the spaced repetition is what makes that day count.

---

## How to use SuomiT for maximum efficiency (15–30 min/day)

1. **Daily mix first (5–10 min).** Clear today's reviews before anything new. Due items are the cheapest gains you'll get.
2. **One lesson or drill (5–10 min).** Continue the course path, or drill the grammar skill with the weakest bar.
3. **Input (5–10 min).** Read a SuomiT story, or watch/listen to something from the lesson's Resources, Yle Selkouutiset (news in easy Finnish), Yle Areena or a podcast. Don't aim to understand everything.
4. **Say every answer out loud**, including typed ones. Use 🐢 slow audio and repeat it.
5. **Capture words you meet** in real life: select or tap them and save them to a list. SuomiT schedules them like everything else.
6. **Don't skip days, shorten them.** A 5-minute Daily mix beats a missed day. If you miss days, do your reviews before any new words.

---

## Sources

- Roediger, H. L., & Karpicke, J. D. (2006). Test-enhanced learning: Taking memory tests improves long-term retention. *Psychological Science, 17*(3), 249–255.
- Karpicke, J. D., & Roediger, H. L. (2008). The critical importance of retrieval for learning. *Science, 319*(5865), 966–968.
- Cepeda, N. J., Pashler, H., Vul, E., Wixted, J. T., & Rohrer, D. (2006). Distributed practice in verbal recall tasks: A review and quantitative synthesis. *Psychological Bulletin, 132*(3), 354–380.
- Kim, S. K., & Webb, S. (2022). The effects of spaced practice on second language learning: A meta-analysis. *Language Learning, 72*(1), 269–319.
- Slamecka, N. J., & Graf, P. (1978). The generation effect: Delineation of a phenomenon. *Journal of Experimental Psychology: Human Learning and Memory, 4*(6), 592–604.
- Rohrer, D., & Taylor, K. (2007). The shuffling of mathematics problems improves learning. *Instructional Science, 35*, 481–498.
- Bjork, R. A. (1994). Memory and metamemory considerations in the training of human beings. In J. Metcalfe & A. Shimamura (Eds.), *Metacognition: Knowing about knowing* (pp. 185–205). MIT Press.
- Krashen, S. (1982). *Principles and Practice in Second Language Acquisition.* Pergamon.
- Swain, M. (1985). Communicative competence: Some roles of comprehensible input and comprehensible output in its development. In S. Gass & C. Madden (Eds.), *Input in Second Language Acquisition* (pp. 235–253). Newbury House.
- Nation, I. S. P. (2013). *Learning Vocabulary in Another Language* (2nd ed.). Cambridge University Press.
- Wray, A. (2002). *Formulaic Language and the Lexicon.* Cambridge University Press.
- Foreign Service Institute: Foreign language training (language difficulty categories): https://www.state.gov/foreign-language-training/
- FSRS: open-spaced-repetition / py-fsrs (reference implementation, FSRS-6 parameters): https://github.com/open-spaced-repetition/py-fsrs
- Expertium, *A technical explanation of FSRS*: https://expertium.github.io/Algorithm.html
- F. Borretti, *Implementing FSRS in 100 lines*: https://borretti.me/article/implementing-fsrs-in-100-lines
