<img src="assets/icon.svg" width="64" height="64" alt="">

# SuomiT

**A game-like Finnish trainer for phone and Mac.** SuomiT turns a beginner Finnish course (Modules 1–4, plus a bonus module) into daily, bite-sized sessions built on how memory actually works: spaced repetition, active recall, typed production and lots of mixed practice.

**Live:** https://pipeli-prog.github.io/suomit/

## Features

### Learn
- **Course path**: 43 lessons in the original course order (alphabet → numbers → greetings → *olla* → … → partitive → verb types → local cases → time → past tense), plus a bonus module (food, health, hobbies, transport, spoken Finnish).
- **Explanation cards**: short, original grammar explanations with tables and tips for every lesson.
- **Graded readings**: 9 short stories (A1–A2) with tap-to-translate, per-sentence translations, read-aloud and comprehension questions.
- **Resources per lesson**: 325 linked videos, interactive exercises and readings, grouped by type, with a checklist.

### Practise
- **Daily mix**: one tap builds the best session for today: due reviews, your weakest due grammar skill and a few new words from where you are in the course.
- **FSRS-6 spaced repetition**: every word and every grammar skill gets its own memory model (target retention 90 %).
- **35 grammar drills with generated questions**: vowel harmony, t-plural, verb types 1–6 (present, negative, -ko/-kö questions, past), consonant gradation, genitive, partitive, *minulla on*, postpositions, local cases (*missä/mistä/mihin*), numbers & prices (written and spoken), clock times, word order and more. Questions are generated fresh, so drills never run out.
- **Vocab trainer** for any source (due, weak words, a list, a topic, a lesson, everything learned) in these modes: Smart · Flashcards FI→EN · Flashcards EN→FI · Write it · Listen & write · Multiple choice · Match pairs · Speed round.
- **Finnish-aware answer checking**: tolerant of small typos, but strict where Finnish is strict. *kisa ≠ kissa* (length) and *a ≠ ä* (dots) are flagged.
- **Audio** via your device's Finnish voice (normal and slow 🐢).

### Collect words
- **Tap any Finnish word** anywhere (lessons, readings, feedback) to see its meaning, forms and audio, and save it to a list.
- **Select any text** to add it as a word.
- **Custom lists & custom words** with your own translations; they get spaced repetition too.

### Stay motivated
- Streaks, **Sisu shield** streak freezes, XP & levels with Finnish ranks, **markka** 🪙 coins, 3 daily quests, a chest when you hit your daily goal, 25+ achievements.
- **Shop**: 8 app themes (Revontulet, Kesäyö, Mökki, Sauna…) and skins for **Nuppu the norppa** (Saimaa ringed seal): hats, glasses, scarves and colours. Module rewards included.
- No hearts and no punishment: mistakes just come back sooner.

### Everywhere
- **Offline PWA**: installable, and works without internet after the first visit.
- **Sync code**: copy a code on one device and paste it on the other. Progress is *merged*, so nothing is lost. No account and no server.

## Install

**iPhone / iPad**: open the live link in **Safari** → Share → **Add to Home Screen**. It opens full-screen like an app. For audio, make sure a Finnish voice is installed: Settings → Accessibility → Spoken Content → Voices → Finnish.

**Mac**: open the link in Safari (File → **Add to Dock**) or Chrome (⋮ → Cast, save and share → **Install page as app**). Keyboard: `1–4` answer/grade, `Enter` check/continue, `Space` flips flashcards.

**Moving progress between devices**: Me → Settings → **Copy sync code** on device A, then **Import code** on device B.

## Run locally

There's no build step. Serve the repo root over HTTP:

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

## Project structure

```
index.html            app shell
manifest.webmanifest  PWA manifest
sw.js                 service worker (offline cache)
css/app.css           styles + themes
js/
  app.js              router & views shell
  fi.js               Finnish engine: vowel harmony, conjugation, cases, numbers, clock, answer checking
  srs.js              FSRS-6 scheduler
  store.js            state, streaks, coins, sync codes, merge
  exercises.js        question generators (vocab + 35 grammar skills)
  plan.js             daily mix & lesson session planning
  session.js          practice session runner
  lexicon.js          tap-to-translate index (all inflected forms → word)
  gamify.js           quests, achievements, chests, shop, themes
  audio.js · ui.js    speech, sound effects, UI helpers, mascot
data/
  course.js           modules, lessons, explanation cards
  vocab.js            ~700 words with genitive / partitive / plural
  verbs.js            85 verbs with stems and past forms
  grammar.js          countries, places, names, opposites, days, months
  readings.js         graded stories
  resources.js        linked third-party resources per lesson
```

See also [LEARNING_SCIENCE.md](LEARNING_SCIENCE.md) for why SuomiT works the way it does, and [COURSE_MAP.md](COURSE_MAP.md) for every lesson at a glance.

## Content & credits

All explanations, vocabulary data, exercises and stories in SuomiT are original. No course slides or course text were copied. SuomiT follows the lesson order of a beginner course and **links** to publicly available third-party resources (YouTube channels, Yle, Wordwall, Quizlet, UusiKielemme, Peda.net, Rovala, Lingua.com, Osaan suomea). Those resources stay on their original sites and belong to their creators.

Spaced repetition: [FSRS](https://github.com/open-spaced-repetition) by the open-spaced-repetition project.

## Audio

Finnish speech comes from pre-generated clips in `audio/`, made with Microsoft Edge neural TTS (voice `fi-FI-NooraNeural`) through the [edge-tts](https://github.com/rany2/edge-tts) package, for personal study use. Each clip is named by the first 12 hex characters of the SHA-1 of its text (`audio/<first 2>/<hash>.mp3`), and `data/audio-index.js` lists the clips that exist. `js/audio.js` plays a clip when there is one; any string without a clip (for example your own custom words) falls back to the device's Finnish voice. The service worker caches clips as they are played (cache `suomit-audio`, kept across releases).

To regenerate after changing content (needs Node, Python 3 and, for trimming trailing silence, ffmpeg):

```sh
python3 -m venv ~/.venvs/edge-tts && ~/.venvs/edge-tts/bin/pip install edge-tts   # once
node tools/harvest.mjs && ~/.venvs/edge-tts/bin/python tools/gen_audio.py
```

`tools/harvest.mjs` collects every string the app can speak into `tools/speech-strings.json` (capped at about 60 MB of audio, lowest-priority strings dropped first; change with `--max-mb`). `tools/gen_audio.py` only generates clips that are missing, so re-runs are incremental (`--prune` deletes clips whose text is gone).

## Offline

After the first visit everything works offline: lessons, drills, stories, the 352 practice sets, the shop and your progress. Voice clips are cached as you hear them; **Minä → Settings → Offline → Download all audio** saves all 11,820 clips (~120 MB) so every pronunciation works without internet. Embedded videos and outside links still need a connection.
