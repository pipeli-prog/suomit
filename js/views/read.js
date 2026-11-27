import * as store from '../store.js';
import { icon } from '../icons.js';
import { esc, fw, toast, confetti } from '../ui.js';
import { speak, stopSpeaking, sfx } from '../audio.js';
import { READINGS, READING_BY_ID } from '../../data/readings.js';
import { LESSON_BY_ID } from '../../data/course.js';
import { checkAchievements, claimQuests } from '../gamify.js';
import { rerender, go } from '../app.js';

const OUTSIDE = [
  [icon('news') + ' Read: easy Finnish news', [
    ['Yle Selkouutiset', 'https://yle.fi/selkouutiset', 'Daily news in plain Finnish, with audio. The best habit you can build.'],
    ['Selkosanomat', 'https://selkosanomat.fi/', 'Easy-Finnish newspaper.'],
    ['Yle: Perustaso', 'https://yle.fi/aihe/artikkeli/2015/12/15/perustaso-0', 'Beginner-level reading & listening.'],
    ['Yle: Keskitaso', 'https://yle.fi/aihe/artikkeli/2015/12/15/keskitaso-0', 'Intermediate level, for later.'],
  ]],
  [icon('headphones') + ' Listen', [
    ['Yle Areena podcast', 'https://areena.yle.fi/podcastit/1-50309762', 'Finnish podcast on Yle Areena.'],
    ['Waltari Education on SoundCloud', 'https://soundcloud.com/waltari-education', 'Listening comprehension episodes incl. 80 essential phrases.'],
    ['Yle Kielikoulu: learn Finnish', 'https://yle.fi/a/20-146800', 'Lessons, exercises and videos.'],
    ['Finnish learning songs (YouTube)', 'https://www.youtube.com/playlist?list=OLAK5uy_mmn9rkijgAM74luTLxAWOORB8qqc1zyck', 'Playlist of songs for learners.'],
  ]],
  [icon('tv') + ' Watch', [
    ['Yle Kielikoulu', 'https://kielikoulu.yle.fi/', 'Watch Areena with clickable Finnish subtitles. Designed for learners.'],
    ['Pipsa Possu (Peppa Pig)', 'https://areena.yle.fi/1-3739583', 'Simple language, easy stories. Perfect for beginners.'],
    ['Pirjo', 'https://areena.yle.fi/1-4484171', 'Short, funny sketches in fast spoken Finnish.'],
    ['Areena picks from your course', 'https://areena.yle.fi/1-1349130', 'Aki Kaurismäki: slow, sparse dialogue. Try Finnish subtitles!'],
    ['More Areena', 'https://areena.yle.fi/1-3540097', ''],
  ]],
  [icon('game') + ' Extra practice', [
    ['Gimara: person & inner circle', 'https://gimara.fi/ihminen-ja-lahipiiri-person-and-inner-circle/ihminen1/', 'Vocabulary exercises with pictures.'],
    ['Osaan suomea', 'https://www.osaansuomea.fi/', 'Free interactive Finnish exercises.'],
    ['UusiKielemme', 'https://uusikielemme.fi/', 'The best free Finnish grammar reference in English.'],
  ]],
];

export function renderRead(el) {
  const S = store.state();
  el.innerHTML = `<h1 class="pg">Lue <span class="muted">· read & listen</span></h1>
    <p class="muted">Short stories written for SuomiT. Tap any word to translate it, then answer the questions.</p>
    <a class="card loot-home tw-home" href="#/twisters"><span class="lh-ico">${icon('chat')}</span><div><b class="fi">Kielisolmut</b><div class="muted small">Tongue twisters: slow, normal and fast, plus two games</div></div><span class="lh-p">${icon('play')}</span></a>
    <div class="stories">${READINGS.map(r => {
    const sc = S.reads[r.id];
    return `<a class="story ${sc != null ? 'done' : ''}" href="#/read/${r.id}"><span class="s-e">${icon(r.icon)}</span><div><b class="fi">${esc(r.title)}</b>
        <div class="muted small">${esc(r.en)} · ${r.level}</div></div><span class="s-sc">${sc != null ? `${sc}/${r.q.length} ✓` : 'new'}</span></a>`;
  }).join('')}</div>
    ${OUTSIDE.map(([h, items]) => `<h3 class="sec">${h}</h3>` + items.map(([n, u, d]) => `<a class="res out" href="${u}" target="_blank" rel="noopener"><div class="res-a"><b>${esc(n)} ↗</b>${d ? `<span class="muted small">${esc(d)}</span>` : ''}</div></a>`).join('')).join('')}
    <p class="muted small">Tip from your course: with Kaurismäki films and Areena, start with English subtitles if needed, then switch to Finnish subtitles + Finnish audio for the biggest gains.</p>`;
}

export function renderStory(el, id) {
  const r = READING_BY_ID[id]; if (!r) return go('#/read');
  const S = store.state(), lesson = LESSON_BY_ID[r.lesson];
  el.innerHTML = `<a class="back" href="#/read">‹ Lue</a>
    <div class="story-h"><span>${icon(r.icon)}</span><div><h1 class="fi">${esc(r.title)}</h1><div class="muted">${esc(r.en)} · ${r.level}${lesson ? ` · fits lesson “${esc(lesson.title)}”` : ''}</div></div></div>
    <div class="row-btns"><button class="btn sm" id="play">${icon('play')} Read aloud</button><button class="btn sm ghost" id="tr">Show translation</button></div>
    <article class="card text">${r.s.map(([fi, en], i) => `<p class="sent" data-i="${i}"><span class="fi">${fw(fi)}</span> <button class="s-say" data-i="${i}" aria-label="Listen">${icon('speaker')}</button><span class="tr" hidden>${esc(en)}</span></p>`).join('')}</article>
    <h3 class="sec">Kysymykset · Questions</h3>
    <div class="qs">${r.q.map((q, k) => `<div class="card rq" data-k="${k}"><b class="fi">${fw(q.q)}</b><div class="muted small">${esc(q.en)}</div>
      <div class="choices col no-tap">${q.o.map((o, j) => `<button class="choice" data-j="${j}">${fw(o)}</button>`).join('')}</div></div>`).join('')}</div>
    <div class="row-btns"><button class="btn big-btn wide" id="done" disabled>Answer all questions</button></div>`;
  let playing = false;
  const sents = [...el.querySelectorAll('.sent')];
  const playFrom = i => {
    sents.forEach(s => s.classList.remove('hl'));
    if (!playing || i >= sents.length) { playing = false; el.querySelector('#play').innerHTML = icon('play') + ' Read aloud'; return; }
    sents[i].classList.add('hl'); sents[i].scrollIntoView({ block: 'center', behavior: 'smooth' });
    speak(r.s[i][0], { onend: () => playFrom(i + 1) });
  };
  el.querySelector('#play').onclick = e => { playing = !playing; e.currentTarget.innerHTML = playing ? icon('pause') + ' Stop' : icon('play') + ' Read aloud'; if (playing) playFrom(0); else { stopSpeaking(); sents.forEach(s => s.classList.remove('hl')); } };
  el.querySelector('#tr').onclick = e => { const show = e.target.textContent.startsWith('Show'); el.querySelectorAll('.tr').forEach(t => t.hidden = !show); e.target.textContent = show ? 'Hide translation' : 'Show translation'; };
  el.querySelectorAll('.s-say').forEach(b => b.onclick = () => speak(r.s[+b.dataset.i][0]));
  const answers = {};
  el.querySelectorAll('.rq').forEach(card => card.querySelectorAll('.choice').forEach(b => b.onclick = e => {
    if (e.target.closest('.fw') && card.classList.contains('answered')) return;
    if (card.classList.contains('answered')) return;
    const k = +card.dataset.k, j = +b.dataset.j, ok = r.q[k].a === j;
    answers[k] = ok; card.classList.add('answered'); card.querySelector('.choices').classList.remove('no-tap');
    card.querySelectorAll('.choice').forEach((c, jj) => { c.disabled = true; if (jj === r.q[k].a) c.classList.add('right'); else if (c === b) c.classList.add('wrong'); });
    sfx(ok ? 'ok' : 'bad');
    const btn = el.querySelector('#done');
    if (Object.keys(answers).length === r.q.length) { btn.disabled = false; btn.textContent = '✓ Finish story'; }
  }));
  el.querySelector('#done').onclick = () => {
    const score = Object.values(answers).filter(Boolean).length, first = S.reads[r.id] == null;
    S.reads[r.id] = Math.max(S.reads[r.id] || 0, score);
    const xp = first ? 20 + score * 5 : score * 3;
    store.addXp(xp); const d = store.dayRec(); d.read = (d.read || 0) + 1; store.save();
    if (score === r.q.length) confetti(80);
    toast(`${score}/${r.q.length} correct · +${xp} XP`, 'read', 2600);
    claimQuests(); checkAchievements(); go('#/read');
  };
}
