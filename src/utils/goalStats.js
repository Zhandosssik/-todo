export function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export function parseDate(dateStr) {
  if (!dateStr) return new Date();
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function daysBetween(startStr, endStr) {
  const start = parseDate(startStr);
  const end = parseDate(endStr);
  return Math.round((end - start) / (1000 * 60 * 60 * 24));
}

export function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}ч ${m}м`;
  if (m > 0) return `${m}м ${s}с`;
  return `${s}с`;
}

export function formatTimer(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

export function getGoalStats(goal, dayLogs = []) {
  const today = todayStr();
  const logsByDate = Object.fromEntries(dayLogs.map((l) => [l.date, l]));
  const dailyHours = Number(goal.dailyHours) || 1;
  const targetSeconds = dailyHours * 3600;
  const startDate = goal.startDate || today;

  const activeDays = dayLogs.filter((l) => l.secondsWorked > 0).length;
  const daysSinceStart = Math.max(0, daysBetween(startDate, today) + 1);
  const totalSeconds = dayLogs.reduce((sum, l) => sum + (l.secondsWorked || 0), 0);

  let streak = 0;
  const cursor = parseDate(today);
  for (let i = 0; i < 365; i++) {
    const key = toDateKey(cursor);
    if (key < startDate) break;
    const log = logsByDate[key];
    const targetMet = (log?.secondsWorked || 0) >= targetSeconds;
    if (targetMet) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else if (key === today) {
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  const todayLog = logsByDate[today];
  const todaySeconds = todayLog?.secondsWorked || 0;
  const todayProgress = targetSeconds > 0 ? Math.min(todaySeconds / targetSeconds, 1) : 0;

  return {
    activeDays,
    daysSinceStart,
    totalSeconds,
    streak,
    todaySeconds,
    todayProgress,
    targetSeconds,
  };
}

export function buildCalendarDays(year, month, goal, dayLogs = []) {
  const logsByDate = Object.fromEntries(dayLogs.map((l) => [l.date, l]));
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startPad = (first.getDay() + 6) % 7;
  const today = todayStr();
  const startDate = goal.startDate || today;
  const endDate = goal.endDate || today;
  const dailyHours = Number(goal.dailyHours) || 1;

  const days = [];

  for (let i = 0; i < startPad; i++) {
    days.push({ empty: true, key: `pad-${i}` });
  }

  for (let d = 1; d <= last.getDate(); d++) {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const log = logsByDate[date];
    const beforeStart = date < startDate;
    const afterEnd = date > endDate;
    const worked = (log?.secondsWorked || 0) > 0;
    const targetMet = (log?.secondsWorked || 0) >= dailyHours * 3600;

    days.push({
      key: date,
      date,
      day: d,
      beforeStart,
      afterEnd,
      worked,
      targetMet,
      isToday: date === today,
      seconds: log?.secondsWorked || 0,
    });
  }

  return days;
}

export const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];
