import { todayStr, parseDate } from './goalStats';

function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isGoalDayComplete(goal, log) {
  const targetSeconds = (Number(goal.dailyHours) || 1) * 3600;
  return (log?.secondsWorked || 0) >= targetSeconds;
}

export function buildLogsByGoalAndDate(allLogs) {
  const map = {};
  for (const log of allLogs) {
    if (!map[log.goalId]) map[log.goalId] = {};
    map[log.goalId][log.date] = log;
  }
  return map;
}

export function areAllGoalsCompleteForDate(goals, logsByGoal, date) {
  if (!goals.length) return true;
  return goals.every((goal) => {
    const log = logsByGoal[goal.id]?.[date];
    return isGoalDayComplete(goal, log);
  });
}

export function parseDeadlineToday(deadlineTime) {
  const [h, m] = (deadlineTime || '22:00').split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

export function msUntilDeadline(deadlineTime) {
  const deadline = parseDeadlineToday(deadlineTime);
  const now = Date.now();
  const diff = deadline.getTime() - now;
  return diff > 0 ? diff : 0;
}

export function isPastDeadline(deadlineTime, dateStr = todayStr()) {
  const [h, m] = (deadlineTime || '22:00').split(':').map(Number);
  const deadline = parseDate(dateStr);
  deadline.setHours(h, m, 0, 0);
  return Date.now() >= deadline.getTime();
}

export function getGlobalStreak(goals, allLogs) {
  if (!goals.length) return 0;

  const logsByGoal = buildLogsByGoalAndDate(allLogs);
  const today = todayStr();
  const earliestStart = goals.reduce(
    (min, g) => (g.startDate && g.startDate < min ? g.startDate : min),
    today
  );

  let streak = 0;
  const cursor = parseDate(today);

  for (let i = 0; i < 365; i++) {
    const key = toDateKey(cursor);
    if (key < earliestStart) break;

    if (areAllGoalsCompleteForDate(goals, logsByGoal, key)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else if (key === today) {
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export function getYesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toDateKey(d);
}
