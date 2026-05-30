import {
  getAllGoals,
  getSetting,
  setSetting,
  getAllGoalDayLogs,
  clearProgressData,
  saveGoal,
} from '../db/indexedDB';
import { todayStr, parseDate } from '../utils/goalStats';
import {
  areAllGoalsCompleteForDate,
  buildLogsByGoalAndDate,
  isPastDeadline,
  msUntilDeadline,
  getYesterdayStr,
} from '../utils/planCheck';
import { useAlarmStore } from '../store/alarmStore';
import { useGoalProgressStore } from '../store/goalProgressStore';

let deadlineTimeout = null;
let onResetCallback = null;

export function setOnPlanReset(callback) {
  onResetCallback = callback;
}

async function resetAllProgress(reason) {
  await clearProgressData();

  const config = { ...useAlarmStore.getState().config, wakeStreak: 0, snoozeCount: 0 };
  await setSetting('alarmConfig', config);
  useAlarmStore.setState({ config });

  useGoalProgressStore.setState({ logsByGoal: {} });

  if (onResetCallback) onResetCallback(reason);
}

async function runDeadlineCheck() {
  const goals = await getAllGoals();
  if (!goals.length) return;

  const deadline = (await getSetting('dailyDeadline')) || '22:00';
  const today = todayStr();
  const lastCheck = await getSetting('lastDeadlineCheckDate');

  const allLogs = await getAllGoalDayLogs();
  const logsByGoal = buildLogsByGoalAndDate(allLogs);

  if (lastCheck && lastCheck !== today) {
    const missed = !areAllGoalsCompleteForDate(goals, logsByGoal, lastCheck);
    if (missed && isPastDeadline(deadline, lastCheck)) {
      await resetAllProgress('deadline_missed');
      await setSetting('lastDeadlineCheckDate', today);
      scheduleDeadlineCheck();
      return;
    }
  }

  if (isPastDeadline(deadline, today)) {
    const complete = areAllGoalsCompleteForDate(goals, logsByGoal, today);
    if (!complete) {
      await resetAllProgress('deadline_missed');
    }
    await setSetting('lastDeadlineCheckDate', today);
  }

  scheduleDeadlineCheck();
}

export function scheduleDeadlineCheck() {
  if (deadlineTimeout) {
    clearTimeout(deadlineTimeout);
    deadlineTimeout = null;
  }

  getSetting('dailyDeadline', '22:00').then((deadline) => {
    const ms = msUntilDeadline(deadline);
    if (ms === 0) {
      runDeadlineCheck();
      return;
    }
    deadlineTimeout = setTimeout(runDeadlineCheck, ms);
  });
}

export async function checkMissedDaysOnStartup() {
  const goals = await getAllGoals();
  if (!goals.length) return;

  const planLocked = await getSetting('planLocked');
  if (!planLocked) {
    await setSetting('planLocked', true);
    for (const goal of goals) {
      if (!goal.locked) {
        await saveGoal({ ...goal, locked: true });
      }
    }
  }

  const deadline = (await getSetting('dailyDeadline')) || '22:00';
  const lastCheck = await getSetting('lastDeadlineCheckDate');
  const today = todayStr();
  const allLogs = await getAllGoalDayLogs();
  const logsByGoal = buildLogsByGoalAndDate(allLogs);

  if (lastCheck && lastCheck < today) {
    let cursor = lastCheck;
    while (cursor < today) {
      const next = new Date(parseDate(cursor));
      next.setDate(next.getDate() + 1);
      const nextKey = next.toISOString().split('T')[0];
      if (nextKey >= today) break;

      const missed = !areAllGoalsCompleteForDate(goals, logsByGoal, cursor);
      if (missed && isPastDeadline(deadline, cursor)) {
        await resetAllProgress('deadline_missed');
        await setSetting('lastDeadlineCheckDate', today);
        scheduleDeadlineCheck();
        return;
      }
      cursor = nextKey;
    }
  }

  if (!lastCheck) {
    const yesterday = getYesterdayStr();
    const missedYesterday = !areAllGoalsCompleteForDate(goals, logsByGoal, yesterday);
    if (missedYesterday && isPastDeadline(deadline, yesterday)) {
      await resetAllProgress('deadline_missed');
    }
  }

  await runDeadlineCheck();
}

export async function startDailyPlanService() {
  await checkMissedDaysOnStartup();
}

export function stopDailyPlanService() {
  if (deadlineTimeout) {
    clearTimeout(deadlineTimeout);
    deadlineTimeout = null;
  }
}
