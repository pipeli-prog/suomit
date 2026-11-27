import * as store from '../store.js';
import { icon } from '../icons.js';
import { esc, md, fw, modal, toast } from '../ui.js';
import { speak } from '../audio.js';
import { runSession } from '../session.js';
import { MODULES, LESSONS, LESSON_BY_ID, MODULE_BY_ID } from '../../data/course.js';
import { LESSON_RESOURCES } from '../../data/resources.js';
import { READING_BY_ID } from '../../data/readings.js';
import { lessonLearn, lessonPractice, lessonTest, skillDrill, lessonWords, currentLesson } from '../plan.js';
import { SKILL_NAMES, SKILL_ICON } from '../exercises.js';
import { strength } from '../srs.js';
import { checkAchievements } from '../gamify.js';
import { rerender, go } from '../app.js';
import { wordRow, wireWordRows, listName } from './words.js';
import { setsFor, setCards, wireSetCards, playSet } from '../practice.js';
import { t, lessonText } from '../i18n.js';

const stars = n => `<span class="stars">${[1, 2, 3].map(i => `<i class="${i <= n ? 'on' : ''}">★</i>`).join('')}</span>`;

export function renderPath(el) {
  const S = store.state(), cur = currentLesson();
  el.innerHTML = `<h1 class="pg">Polku <span class="muted">· ${t('your course')}</span></h1>` + MODULES.map(m => {
    const ls = LESSONS.filter(l => l.mod === m.id), doneN = ls.filter(l => (S.lessons[l.id]?.stars || 0) >= 1).length;
    return `<section class="mod" style="--mc:${m.color}">
      <div class="mod-h"><div><div class="muted small">${t('Module {n}', { n: m.n === 5 ? '★' : m.n })}</div><h2>${esc(t(m.title))}</h2><div class="fi small">${esc(m.fi)}</div></div>
        <div class="mod-p"><b>${doneN}/${ls.length}</b><div class="mini-bar"><div style="width:${doneN / ls.length * 100}%"></div></div></div></div>
      <div class="trail">${ls.map((l, i) => {
      const st = S.lessons[l.id]?.stars || 0, off = [0, 1, 2, 1][i % 4];
      return `<a class="node ${st ? 'done' : ''} ${l === cur ? 'cur' : ''} ${l.revision ? 'rev' : ''}" style="--off:${off}" href="#/lesson/${l.id}">
          <span class="n-ico">${icon(l.icon)}</span>${l === cur ? `<span class="here">${t('START')}</span>` : ''}
          <span class="n-lbl">${esc(lessonText(l).title)}</span>${stars(st)}</a>`;
    }).join('')}</div></section>`;
  }).join('');
  setTimeout(() => el.querySelector('.node.cur')?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 80);
}

export function renderLesson(el, id, tab = 'learn') {
  const l = LESSON_BY_ID[id]; if (!l) return go('#/path');
  const S = store.state(), rec = store.lessonRec(id), mod = MODULE_BY_ID[l.mod];
  const idx = LESSONS.indexOf(l), prev = LESSONS[idx - 1], next = LESSONS[idx + 1];
  const res = LESSON_RESOURCES[id] || [], words = lessonWords(l), lt = lessonText(l);
  const tabs = [['learn', t('Learn')], ['practice', t('Practice')], ['words', `${t('Words')} · ${words.length}`], ['res', `${t('Resources')} · ${res.length}`]];
  el.innerHTML = `
    <div class="l-head" style="--mc:${mod.color}">
      <a class="back" href="#/path">‹ Polku</a>
      <div class="l-ico">${icon(l.icon)}</div>
      <div class="muted small">${t('Module {n} · Lesson {k}', { n: mod.n === 5 ? t('Bonus') : mod.n, k: LESSONS.filter(x => x.mod === l.mod).indexOf(l) + 1 })}</div>
      <h1>${esc(lt.title)}</h1><div class="fi">${fw(l.fi)}</div>
      ${stars(rec.stars)}
      <div class="star-help small muted">${t('★ finish the lesson · ★★ practice ≥ 85% · ★★★ test ≥ 90%')}</div>
    </div>
    <nav class="tabs">${tabs.map(([k, n]) => `<a class="${k === tab ? 'on' : ''}" href="#/lesson/${id}/${k}">${n}</a>`).join('')}</nav>
    <div class="l-body"></div>
    <div class="l-nav">${prev ? `<a href="#/lesson/${prev.id}">‹ ${esc(lessonText(prev).title)}</a>` : '<span></span>'}${next ? `<a href="#/lesson/${next.id}">${esc(lessonText(next).title)} ›</a>` : ''}</div>`;
  const body = el.querySelector('.l-body');
  const finishLesson = (kind) => r => {
    if (r.quit) return;
    const rr = store.lessonRec(id); rr.sessions++; rr.best = Math.max(rr.best, Math.round(r.acc * 100));
    if (kind === 'learn') { rr.learned = true; store.setStars(id, 1); }
    if (kind === 'practice') store.setStars(id, r.acc >= .85 ? 2 : r.acc >= .6 ? 1 : 0);
    if (kind === 'test') store.setStars(id, r.acc >= .9 ? 3 : r.acc >= .75 ? 1 : 0);
    store.save(); checkAchievements();
  };
  const start = kind => runSession({
    title: lt.title, mode: kind === 'test' ? 'drill' : 'learn',
    questions: kind === 'learn' ? lessonLearn(l) : kind === 'test' ? lessonTest(l) : lessonPractice(l),
    onFinish: finishLesson(kind), onClose: rerender, again: () => start(kind),
    endExtra: r => kind === 'test' ? `<p class="center ${r.acc >= .9 ? 'good-t' : 'muted'}">${r.acc >= .9 ? t('★★★ Lesson mastered!') : t('Score 90% or more for the third star.')}</p>` : '',
  });

  if (tab === 'learn') {
    const rd = l.reading && READING_BY_ID[l.reading];
    body.innerHTML = `
      <div class="card goals"><h3>${icon('target')} ${t('After this lesson you can…')}</h3><ul>${lt.goals.map(g => `<li>${esc(g)}</li>`).join('')}</ul></div>
      ${lt.learn.map((c, i) => `<article class="card learn"><h3><span class="num">${i + 1}</span>${esc(c.h)}</h3>${md(c.body)}</article>`).join('')}
      ${rd ? `<a class="card story-link" href="#/read/${rd.id}"><span>${icon(rd.icon)}</span><div><b class="fi">${esc(rd.title)}</b><div class="muted small">${t('Story · {level} · tap words to translate', { level: rd.level })}</div></div><span class="arrow">›</span></a>` : ''}
      <div class="sticky-cta"><button class="btn big-btn wide" id="go-learn">${rec.learned ? '↻ ' + t('Do the lesson again') : icon('play') + ' ' + t('Start lesson')}</button></div>`;
    body.querySelector('#go-learn').onclick = () => start('learn');
    body.querySelectorAll('.learn .fi').forEach(f => f.addEventListener('dblclick', () => speak(f.textContent)));
  }
  if (tab === 'practice') {
    const sk = l.skills.filter(s => SKILL_NAMES[s]);
    body.innerHTML = `
      <div class="grid2">
        <button class="tile-btn" id="p-mix"><span>${icon('repeat')}</span><b>${t('Practice')}</b><small>${t('adaptive mix · ★★ at 85%')}</small></button>
        <button class="tile-btn" id="p-test"><span>${icon('flag')}</span><b>${t('Lesson test')}</b><small>${t('20 questions · ★★★ at 90%')}</small></button>
      </div>
      ${sk.length ? `<h3 class="sec">${t('Grammar drills')}</h3>` + sk.map(s => {
        const c = S.skills[s], acc = c?.acc != null ? Math.round(c.acc * 100) : null;
        return `<button class="drill" data-s="${s}"><span class="d-ico">${icon(SKILL_ICON[s] || 'puzzle')}</span><div class="d-t"><b>${esc(SKILL_NAMES[s])}</b>
          <div class="mini-bar"><div style="width:${acc ?? 0}%"></div></div></div><span class="muted small">${acc == null ? t('new') : acc + '%'}</span></button>`;
      }).join('') : ''}
      ${setsFor(id).length ? `<h3 class="sec">${icon('book')} ${t('From your course resources')}</h3><p class="muted small">${t("The course's external exercises, rebuilt inside SuomiT.")}</p>${setCards(id, setsFor(id))}` : ''}
      <p class="muted small center">${t("Drills generate fresh questions every time, so you can't run out.")}</p>`;
    wireSetCards(body, id, rerender);
    body.querySelector('#p-mix').onclick = () => start('practice');
    body.querySelector('#p-test').onclick = () => start('test');
    body.querySelectorAll('[data-s]').forEach(b => b.onclick = () => runSession({ title: SKILL_NAMES[b.dataset.s], mode: 'drill', questions: skillDrill(b.dataset.s, 12), onClose: rerender, again: () => b.click() }));
  }
  if (tab === 'words') {
    body.innerHTML = `<div class="row-btns">
        <button class="btn sm" id="w-train">${icon('target')} ${t('Train these')}</button><button class="btn sm ghost" id="w-add">${icon('pin')} ${t('Add all to a list')}</button></div>
      <div class="wlist">${words.map(w => wordRow(w)).join('')}</div>`;
    wireWordRows(body);
    body.querySelector('#w-train').onclick = () => go(`#/words/train/lesson:${id}`);
    body.querySelector('#w-add').onclick = () => {
      const m = modal(`<h3>${words.length === 1 ? t('Add {n} word to…', { n: 1 }) : t('Add {n} words to…', { n: words.length })}</h3>${S.lists.map(x => `<button class="btn wide ghost" data-l="${x.id}">${esc(listName(x))}</button>`).join('')}`);
      m.el.querySelectorAll('[data-l]').forEach(b => b.onclick = () => { let n = 0; for (const w of words) if (!store.inList(b.dataset.l, w.id)) { store.toggleList(b.dataset.l, w.id); n++; } toast(n === 1 ? t('{n} word added', { n }) : t('{n} words added', { n }), 'pin'); m.close(); });
    };
  }
  if (tab === 'res') {
    const groups = [['video', icon('film') + ' ' + t('Watch')], ['game', icon('game') + ' ' + t('Practise & test yourself')], ['read', icon('file') + ' ' + t('Read')], ['listen', icon('headphones') + ' ' + t('Listen')]];
    const doneN = res.filter(r => S.res[r.u]).length;
    body.innerHTML = res.length ? `<p class="muted small">${t('The free resources linked from your course for this lesson. Tick them off for +1 XP each. {done}/{total} done.', { done: doneN, total: res.length })}</p>` + groups.map(([k, h]) => {
      const items = res.filter(r => r.t === k); if (!items.length) return '';
      return `<h3 class="sec">${h}</h3>` + items.map(r => `<div class="res ${S.res[r.u] ? 'done' : ''}">
        <button class="chk" data-u="${esc(r.u)}" aria-label="${t('Mark done')}">${S.res[r.u] ? '✓' : ''}</button>
        <a href="${esc(r.u)}" target="_blank" rel="noopener" data-t="${k}" class="res-a"><b>${esc(r.n)}</b><span class="muted small">${k === 'video' ? t('plays here') : setsFor(id, r.u).length ? t('rebuilt in SuomiT · original') + ' ↗' : esc(new URL(r.u).hostname.replace('www.', '')) + ' ↗'}</span></a>
        ${setsFor(id, r.u).length ? `<button class="btn sm inapp" data-src="${esc(r.u)}">${icon('play')} ${setsFor(id, r.u).length > 1 ? t('{n} sets', { n: setsFor(id, r.u).length }) : t('Practise')}</button>` : ''}</div>`).join('');
    }).join('') : `<p class="muted">${t('No external resources for this lesson. The drills have you covered.')}</p>`;
    body.querySelectorAll('.inapp').forEach(b => b.onclick = () => {
      const sets = setsFor(id, b.dataset.src);
      if (sets.length === 1) return playSet(id, sets[0], rerender);
      const m = modal(`<h3>${t('Practise in SuomiT')}</h3><div class="psets">${setCards(id, sets)}</div>`);
      wireSetCards(m.el, id, () => { m.close(); rerender(); });
      m.el.querySelectorAll('[data-set]').forEach(x => x.addEventListener('click', () => m.close()));
    });
    body.querySelectorAll('.chk').forEach(b => b.onclick = () => {
      const u = b.dataset.u;
      if (S.res[u]) delete S.res[u]; else { S.res[u] = Date.now(); store.addXp(1.25); toast(t('+{xp} XP', { xp: 1 }), 'check', 1200); }
      store.save(); rerender();
    });
    body.querySelectorAll('.res-a[data-t=video]').forEach(a => a.addEventListener('click', e => {
      const m = a.href.match(/[?&]v=([\w-]{11})/); if (!m) return;
      e.preventDefault();
      modal(`<div class="yt"><iframe src="https://www.youtube-nocookie.com/embed/${m[1]}?autoplay=1&cc_load_policy=1&cc_lang_pref=fi" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>
        <div class="row-btns"><a class="btn sm ghost" href="${esc(a.href)}" target="_blank" rel="noopener">${t('Open on YouTube')} ↗</a></div>`, { cls: 'wide-modal' });
    }));
  }
}
