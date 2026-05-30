import { generateNotifications } from './aiNotifications';
import { useNotificationStore } from '../store/notificationStore';
import { useGoalsStore } from '../store/goalsStore';

const INTERVAL_MIN = 90 * 60 * 1000;
const INTERVAL_MAX = 120 * 60 * 1000;

let schedulerTimeout = null;
let batteryPaused = false;

async function checkBattery() {
  if (!navigator.getBattery) return true;
  try {
    const battery = await navigator.getBattery();
    batteryPaused = battery.level < 0.15 && !battery.charging;
    return !batteryPaused;
  } catch {
    return true;
  }
}

export function showNotification(notif) {
  if ('serviceWorker' in navigator && 'Notification' in window) {
    navigator.serviceWorker.ready.then((sw) => {
      sw.showNotification('🎯 GoalAlarm', {
        body: notif.message,
        icon: '/icons/icon-192.png',
        badge: '/icons/badge-72.png',
        vibrate: [200, 100, 200],
        tag: 'goalnotif',
        renotify: true,
        data: { goalId: notif.goalId },
      });
    });
  } else if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('🎯 GoalAlarm', {
      body: notif.message,
      icon: '/icons/icon-192.png',
    });
  }

  if (navigator.vibrate) {
    navigator.vibrate([200, 100, 200]);
  }
}

async function scheduleNextNotification() {
  const canRun = await checkBattery();
  if (!canRun) {
    schedulerTimeout = setTimeout(scheduleNextNotification, 5 * 60 * 1000);
    return;
  }

  const { queue, markSent, addToQueue, setFeaturedMessage } =
    useNotificationStore.getState();
  const { goals, dreams } = useGoalsStore.getState();

  const pending = queue.filter((n) => !n.sent);
  let nextNotif = pending.sort((a, b) => a.scheduledFor - b.scheduledFor)[0];

  if (!nextNotif) {
    const newBatch = await generateNotifications(goals, dreams, 20);
    await addToQueue(newBatch);
    nextNotif = newBatch[0];
  }

  const delay = INTERVAL_MIN + Math.random() * (INTERVAL_MAX - INTERVAL_MIN);

  schedulerTimeout = setTimeout(async () => {
    showNotification(nextNotif);
    await markSent(nextNotif.id);

    const remaining = useNotificationStore
      .getState()
      .queue.filter((n) => !n.sent);
    if (remaining.length > 0) {
      await setFeaturedMessage(remaining[0].message);
    }

    scheduleNextNotification();
  }, delay);
}

export function startNotificationScheduler() {
  const { schedulerRunning, setSchedulerRunning } =
    useNotificationStore.getState();
  if (schedulerRunning) return;

  setSchedulerRunning(true);
  scheduleNextNotification();
}

export function stopNotificationScheduler() {
  if (schedulerTimeout) {
    clearTimeout(schedulerTimeout);
    schedulerTimeout = null;
  }
  useNotificationStore.getState().setSchedulerRunning(false);
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  const result = await Notification.requestPermission();
  return result === 'granted';
}

/** iOS: вызывать синхронно из onClick, до любых await */
export function requestNotificationPermissionSync() {
  if (!('Notification' in window)) {
    return Promise.resolve('unsupported');
  }
  if (Notification.permission === 'granted') {
    return Promise.resolve('granted');
  }
  if (Notification.permission === 'denied') {
    return Promise.resolve('denied');
  }
  return Notification.requestPermission();
}

export function isStandalonePwa() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

export function isIos() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function getNotificationStatus() {
  if (!('Notification' in window)) {
    return { supported: false, permission: 'unsupported', standalone: isStandalonePwa() };
  }
  return {
    supported: true,
    permission: Notification.permission,
    standalone: isStandalonePwa(),
    ios: isIos(),
  };
}

export async function enableNotifications() {
  const granted = await requestNotificationPermissionSync();
  if (granted === 'granted') {
    startNotificationScheduler();
    await scheduleDailyRegeneration();
    showNotification({
      id: 'test',
      goalId: 'test',
      message: 'Уведомления включены. GoalAlarm будет напоминать о целях.',
    });
    return 'granted';
  }
  return granted;
}

export async function scheduleDailyRegeneration() {
  const lastGen = localStorage.getItem('lastNotificationGen');
  const today = new Date().toISOString().split('T')[0];

  if (lastGen === today) return;

  const { goals, dreams } = useGoalsStore.getState();
  const { generateNotifications: gen } = await import('./aiNotifications');
  const batch = await gen(goals, dreams, 24);
  await useNotificationStore.getState().addToQueue(batch);
  localStorage.setItem('lastNotificationGen', today);
}
