import { openDB } from 'idb';

const DB_NAME = 'goal-alarm-db';
const DB_VERSION = 2;

export async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('goals')) {
        db.createObjectStore('goals', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('dreams')) {
        db.createObjectStore('dreams', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('notifications')) {
        const store = db.createObjectStore('notifications', { keyPath: 'id' });
        store.createIndex('scheduledFor', 'scheduledFor');
        store.createIndex('sent', 'sent');
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('dayLogs')) {
        db.createObjectStore('dayLogs', { keyPath: 'date' });
      }
      if (!db.objectStoreNames.contains('goalDayLogs')) {
        const store = db.createObjectStore('goalDayLogs', { keyPath: 'id' });
        store.createIndex('goalId', 'goalId');
        store.createIndex('date', 'date');
      }
    },
  });
}

export async function getAllGoals() {
  const db = await getDB();
  return db.getAll('goals');
}

export async function saveGoal(goal) {
  const db = await getDB();
  await db.put('goals', goal);
}

export async function deleteGoal(id) {
  const db = await getDB();
  await db.delete('goals', id);
}

export async function getAllDreams() {
  const db = await getDB();
  return db.getAll('dreams');
}

export async function saveDream(dream) {
  const db = await getDB();
  await db.put('dreams', dream);
}

export async function deleteDream(id) {
  const db = await getDB();
  await db.delete('dreams', id);
}

export async function getAllNotifications() {
  const db = await getDB();
  return db.getAll('notifications');
}

export async function saveNotifications(notifications) {
  const db = await getDB();
  const tx = db.transaction('notifications', 'readwrite');
  await Promise.all(notifications.map((n) => tx.store.put(n)));
  await tx.done;
}

export async function updateNotification(notification) {
  const db = await getDB();
  await db.put('notifications', notification);
}

export async function getSetting(key, defaultValue = null) {
  const db = await getDB();
  const row = await db.get('settings', key);
  return row ? row.value : defaultValue;
}

export async function setSetting(key, value) {
  const db = await getDB();
  await db.put('settings', { key, value });
}

export async function getDayLog(date) {
  const db = await getDB();
  return db.get('dayLogs', date);
}

export async function saveDayLog(log) {
  const db = await getDB();
  await db.put('dayLogs', log);
}

export async function hasCompletedOnboarding() {
  const goals = await getAllGoals();
  return goals.length > 0;
}

export async function clearAllData() {
  const db = await getDB();
  const stores = ['goals', 'dreams', 'notifications', 'settings', 'dayLogs', 'goalDayLogs'];
  for (const store of stores) {
    await db.clear(store);
  }
}

export async function getAllGoalDayLogs() {
  const db = await getDB();
  return db.getAll('goalDayLogs');
}

export async function clearProgressData() {
  const db = await getDB();
  await db.clear('goalDayLogs');
  await db.clear('dayLogs');
}

export function goalDayLogId(goalId, date) {
  return `${goalId}_${date}`;
}

export async function getGoalDayLogs(goalId) {
  const db = await getDB();
  return db.getAllFromIndex('goalDayLogs', 'goalId', goalId);
}

export async function getGoalDayLog(goalId, date) {
  const db = await getDB();
  return db.get('goalDayLogs', goalDayLogId(goalId, date));
}

export async function addGoalWorkSeconds(goalId, date, seconds) {
  const db = await getDB();
  const id = goalDayLogId(goalId, date);
  const existing = (await db.get('goalDayLogs', id)) || {
    id,
    goalId,
    date,
    secondsWorked: 0,
  };
  existing.secondsWorked += seconds;
  await db.put('goalDayLogs', existing);
  return existing;
}
