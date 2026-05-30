import { create } from 'zustand';

export const useGoalTimerStore = create((set, get) => ({
  goalId: null,
  running: false,
  startedAt: null,
  pausedSeconds: 0,

  start: (goalId) => {
    const state = get();
    if (state.goalId === goalId && state.running) return;
    set({
      goalId,
      running: true,
      startedAt: Date.now(),
      pausedSeconds: state.goalId === goalId ? state.pausedSeconds : 0,
    });
  },

  pause: () => {
    const { running, startedAt, pausedSeconds } = get();
    if (!running || !startedAt) return;
    set({
      running: false,
      startedAt: null,
      pausedSeconds: pausedSeconds + Math.floor((Date.now() - startedAt) / 1000),
    });
  },

  reset: () => {
    set({ goalId: null, running: false, startedAt: null, pausedSeconds: 0 });
  },

  getElapsed: () => {
    const { running, startedAt, pausedSeconds } = get();
    if (running && startedAt) {
      return pausedSeconds + Math.floor((Date.now() - startedAt) / 1000);
    }
    return pausedSeconds;
  },

  stopAndSave: async (saveFn) => {
    const elapsed = get().getElapsed();
    const { goalId } = get();
    get().reset();
    if (goalId && elapsed > 0) {
      await saveFn(goalId, elapsed);
    }
    return elapsed;
  },
}));
