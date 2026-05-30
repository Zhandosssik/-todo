import { create } from 'zustand';
import { getSetting, setSetting, getDayLog, saveDayLog } from '../db/indexedDB';

const DEFAULT_ALARM = {
  time: '07:00',
  enabled: true,
  snoozeCount: 0,
  wakeStreak: 0,
};

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export const useAlarmStore = create((set, get) => ({
  config: { ...DEFAULT_ALARM },
  isRinging: false,
  wakeMessages: [],
  alarmStartedAt: null,
  hydrated: false,

  hydrate: async () => {
    const config = (await getSetting('alarmConfig')) || DEFAULT_ALARM;
    let wakeMessages = (await getSetting('wakeMessages')) || [];
    if (!wakeMessages.length) {
      const legacy = await getSetting('morningMessage');
      if (legacy) wakeMessages = [legacy];
    }
    set({ config, wakeMessages, hydrated: true });
  },

  setAlarmTime: async (time) => {
    const config = { ...get().config, time };
    await setSetting('alarmConfig', config);
    set({ config });
  },

  setAlarmEnabled: async (enabled) => {
    const config = { ...get().config, enabled };
    await setSetting('alarmConfig', config);
    set({ config });
  },

  setWakeMessages: async (messages) => {
    await setSetting('wakeMessages', messages);
    set({ wakeMessages: messages });
  },

  triggerAlarm: () => {
    set({ isRinging: true, alarmStartedAt: Date.now() });
  },

  dismissAlarm: () => {
    set({ isRinging: false, alarmStartedAt: null });
  },

  wakeUpSuccess: async () => {
    const today = todayStr();
    const log = (await getDayLog(today)) || {
      date: today,
      wokeOnTime: false,
      snoozedTimes: 0,
      notificationsSent: 0,
    };

    const wokeOnFirst = true;
    log.wokeOnTime = wokeOnFirst;

    let wakeStreak = get().config.wakeStreak + 1;

    const config = {
      ...get().config,
      snoozeCount: 0,
      wakeStreak,
    };

    await saveDayLog(log);
    await setSetting('alarmConfig', config);
    set({ config, isRinging: false, alarmStartedAt: null });
  },

  resetDailySnooze: async () => {
    const config = { ...get().config, snoozeCount: 0 };
    await setSetting('alarmConfig', config);
    set({ config });
  },
}));
