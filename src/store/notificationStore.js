import { create } from 'zustand';
import {
  getAllNotifications,
  saveNotifications,
  updateNotification,
  getSetting,
  setSetting,
  getDayLog,
  saveDayLog,
} from '../db/indexedDB';

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export const useNotificationStore = create((set, get) => ({
  queue: [],
  history: [],
  featuredMessage: '',
  schedulerRunning: false,
  hydrated: false,

  hydrate: async () => {
    const queue = await getAllNotifications();
    const featuredMessage = (await getSetting('featuredMessage')) || '';
    set({ queue, featuredMessage, hydrated: true });
  },

  setQueue: async (notifications) => {
    await saveNotifications(notifications);
    set({ queue: notifications });
  },

  addToQueue: async (notifications) => {
    const queue = [...get().queue, ...notifications];
    await saveNotifications(notifications);
    set({ queue });
  },

  markSent: async (id) => {
    const queue = get().queue.map((n) => {
      if (n.id !== id) return n;
      return { ...n, sent: true, sentAt: Date.now() };
    });
    const notif = queue.find((n) => n.id === id);
    if (notif) await updateNotification(notif);

    const log = (await getDayLog(todayStr())) || {
      date: todayStr(),
      wokeOnTime: false,
      snoozedTimes: 0,
      notificationsSent: 0,
    };
    log.notificationsSent += 1;
    await saveDayLog(log);

    set({ queue });
  },

  setFeaturedMessage: async (message) => {
    await setSetting('featuredMessage', message);
    set({ featuredMessage: message });
  },

  getPendingNotifications: () => get().queue.filter((n) => !n.sent),

  setSchedulerRunning: (running) => set({ schedulerRunning: running }),
}));
