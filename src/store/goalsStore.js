import { create } from 'zustand';
import {
  getAllGoals,
  saveGoal,
  deleteGoal as deleteGoalDB,
  getAllDreams,
  saveDream,
  deleteDream as deleteDreamDB,
  getSetting,
  setSetting,
} from '../db/indexedDB';

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export const useGoalsStore = create((set, get) => ({
  goals: [],
  dreams: [],
  hydrated: false,
  planLocked: false,

  hydrate: async () => {
    const [goals, dreams, planLocked] = await Promise.all([
      getAllGoals(),
      getAllDreams(),
      getSetting('planLocked', false),
    ]);
    set({ goals, dreams, planLocked: !!planLocked, hydrated: true });
  },

  addGoal: async (goalData) => {
    if (get().planLocked) return null;

    const goal = {
      id: crypto.randomUUID(),
      name: goalData.name,
      description: goalData.description || '',
      startDate: new Date().toISOString().split('T')[0],
      durationDays: goalData.durationDays,
      endDate: addDays(new Date().toISOString().split('T')[0], goalData.durationDays),
      dailyHours: goalData.dailyHours,
      category: goalData.category || 'other',
      locked: goalData.locked ?? false,
      createdAt: new Date().toISOString(),
    };
    await saveGoal(goal);
    set({ goals: [...get().goals, goal] });
    return goal;
  },

  updateGoal: async (id, updates) => {
    const existing = get().goals.find((g) => g.id === id);
    if (existing?.locked) return;

    const goals = get().goals.map((g) => {
      if (g.id !== id) return g;
      const updated = { ...g, ...updates };
      if (updates.durationDays) {
        updated.endDate = addDays(updated.startDate, updates.durationDays);
      }
      return updated;
    });
    const goal = goals.find((g) => g.id === id);
    if (goal) await saveGoal(goal);
    set({ goals });
  },

  removeGoal: async (id) => {
    const existing = get().goals.find((g) => g.id === id);
    if (existing?.locked) return;

    await deleteGoalDB(id);
    set({ goals: get().goals.filter((g) => g.id !== id) });
  },

  addDream: async (text) => {
    const dream = {
      id: crypto.randomUUID(),
      text,
      createdAt: new Date().toISOString(),
    };
    await saveDream(dream);
    set({ dreams: [...get().dreams, dream] });
    return dream;
  },

  removeDream: async (id) => {
    await deleteDreamDB(id);
    set({ dreams: get().dreams.filter((d) => d.id !== id) });
  },

  getGoalProgress: (goal) => {
    const startDate = goal.startDate || new Date().toISOString().split('T')[0];
    const endDate = goal.endDate || startDate;
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const now = Date.now();
    const total = Math.max(end - start, 1);
    const elapsed = now - start;
    const progress = Math.min(Math.max(elapsed / total, 0), 1);
    const daysRemaining = Math.max(
      0,
      Math.ceil((end - now) / (1000 * 60 * 60 * 24))
    );
    return { progress, daysRemaining };
  },
}));

export const useAppStore = create((set) => ({
  appOpenCount: 0,
  showInstallPrompt: false,

  incrementAppOpen: async () => {
    const count = ((await getSetting('appOpenCount', 0)) || 0) + 1;
    await setSetting('appOpenCount', count);
    set({
      appOpenCount: count,
      showInstallPrompt: count >= 3,
    });
  },

  dismissInstallPrompt: () => set({ showInstallPrompt: false }),
}));
