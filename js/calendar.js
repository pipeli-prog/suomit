// Streak calendar: one month at a time, flip with arrows. Days: kept (goal met), frozen (Sisu shield), missed.
import * as store from './store.js';
import { icon } from './icons.js';

const FI_MONTHS = ['tammikuu', 'helmikuu', 'maaliskuu', 'huhtikuu', 'toukokuu', 'kesäkuu', 'heinäkuu', 'elokuu', 'syyskuu', 'lokakuu', 'marraskuu', 'joulukuu'];
const EN_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WD = ['ma', 'ti', 'ke', 'to', 'pe', 'la', 'su'];

function dayState(k, todayKey, firstKey) {
  const S = store.state(), xp = S.days[k]?.xp || 0;
  if (xp >= S.profile.goal) return 'kept';
  if (S.frozen[k]) return 'frozen';
  if (k === todayKey) return xp > 0 ? 'today-part' : 'today';
  if (k > todayKey) return 'future';
  if (!firstKey || k < firstKey) return 'before';
  return xp > 0 ? 'partial' : 'missed';
}

/** Render into `el`. Keeps its own month state. */
export function renderCalendar(el) {
  const now = new Date();
  let y = now.getFullYear(), m = now.getMonth();
  const draw = () => {
    const S = store.state(), todayKey = store.today();
    const firstKey = Object.keys(S.days).filter(k => (S.days[k].xp || 0) > 0).sort()[0];
    const first = new Date(y, m, 1), days = new Date(y, m + 1, 0).getDate(), lead = (first.getDay() + 6) % 7;
    const cells = [];
    for (let i = 0; i < lead; i++) cells.push('<i class="cd empty"></i>');
    let kept = 0, frozen = 0, missed = 0;
    for (let d = 1; d <= days; d++) {
      const k = store.today(new Date(y, m, d)), st = dayState(k, todayKey, firstKey);
      if (st === 'kept') kept++; else if (st === 'frozen') frozen++; else if (st === 'missed' || st === 'partial') missed++;
      const mark = st === 'kept' ? icon('flame') : st === 'frozen' ? icon('shield') : '';
      cells.push(`<i class="cd ${st}" title="${k}: ${S.days[k]?.xp || 0} XP">${mark}<b>${d}</b></i>`);
    }
    const isNow = y === now.getFullYear() && m === now.getMonth();
    el.innerHTML = `
      <div class="cal-h"><button class="cal-nav" data-d="-1" aria-label="Previous month">${icon('undo')}</button>
        <div class="cal-t"><b class="fi">${FI_MONTHS[m]} ${y}</b><span class="muted small">${EN_MONTHS[m]}</span></div>
        <button class="cal-nav next" data-d="1" aria-label="Next month" ${isNow ? 'disabled' : ''}>${icon('undo')}</button></div>
      <div class="cal-g">${WD.map(w => `<span class="wd">${w}</span>`).join('')}${cells.join('')}</div>
      <div class="cal-leg"><span><i class="dot kept"></i>${kept} kept</span><span><i class="dot frozen"></i>${frozen} frozen</span><span><i class="dot missed"></i>${missed} missed</span></div>`;
    el.querySelectorAll('.cal-nav').forEach(b => b.onclick = () => { m += +b.dataset.d; if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; } draw(); });
  };
  draw();
}
