import { create } from 'zustand';
import { getGoalDayLogs, addGoalWorkSeconds } from '../db/indexedDB';
import { todayStr } from '../utils/goalStats';

const EMPTY_LOGS = [];

export const useGoalProgressStore = create((set, get) => ({
  logsByGoal: {},

  loadGoalLogs: async (goalId) => {
    try {
      const logs = await getGoalDayLogs(goalId);
      set({
        logsByGoal: { ...get().logsByGoal, [goalId]: logs },
      });
      return logs;
    } catch (error) {
      console.error('Failed to load goal logs:', error);
      set({
        logsByGoal: { ...get().logsByGoal, [goalId]: EMPTY_LOGS },
      });
      return EMPTY_LOGS;
    }
  },

  getLogs: (goalId) => get().logsByGoal[goalId] ?? EMPTY_LOGS,

  addWorkTime: async (goalId, seconds, date = todayStr()) => {
    const updated = await addGoalWorkSeconds(goalId, date, seconds);
    const logs = get().logsByGoal[goalId] ?? EMPTY_LOGS;
    const idx = logs.findIndex((l) => l.date === date);
    const next = idx >= 0
      ? logs.map((l) => (l.date === date ? updated : l))
      : [...logs, updated];

    set({
      logsByGoal: { ...get().logsByGoal, [goalId]: next },
    });
    return updated;
  },
}));
