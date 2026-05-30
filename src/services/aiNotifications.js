import { getFallbackMessages } from '../data/fallbackMessages';

const API_BASE = import.meta.env.VITE_API_BASE || '';

export async function generateNotifications(goals, dreams, count = 20) {
  try {
    const response = await fetch(`${API_BASE}/api/ai/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goals, dreams, count }),
      signal: AbortSignal.timeout(55000),
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const data = await response.json();
    if (!data.messages?.length) throw new Error('Empty messages');

    return buildNotificationObjects(goals, data.messages);
  } catch {
    return buildNotificationObjects(goals, getFallbackMessages(count, goals, dreams));
  }
}

function buildNotificationObjects(goals, messages) {
  const now = Date.now();
  const intervalMs = 90 * 60 * 1000;

  return messages.map((message, i) => {
    const goal = goals[i % Math.max(goals.length, 1)];
    return {
      id: crypto.randomUUID(),
      goalId: goal?.id || 'general',
      message,
      scheduledFor: now + (i + 1) * intervalMs + Math.random() * 30 * 60 * 1000,
      sent: false,
    };
  });
}

export async function generateWakeUpMessages(goals, dreams, count = 12) {
  try {
    const response = await fetch(`${API_BASE}/api/ai/wake-messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goals, dreams, count }),
      signal: AbortSignal.timeout(55000),
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const data = await response.json();
    if (!data.messages?.length) throw new Error('Empty messages');

    return data.messages;
  } catch {
    const { getWakeUpMessages } = await import('../data/wakeUpMessages');
    return getWakeUpMessages(goals, dreams, count);
  }
}

export async function generateMorningMessage(goals, dreams) {
  const messages = await generateWakeUpMessages(goals, dreams, 12);
  return messages;
}

export async function regenerateDailyNotifications(goals, dreams) {
  return generateNotifications(goals, dreams, 24);
}
