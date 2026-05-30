import { useState } from 'react';
import Button from '../shared/Button';
import { useNotificationStore } from '../../store/notificationStore';
import { useGoalsStore } from '../../store/goalsStore';
import { generateNotifications } from '../../services/aiNotifications';

export default function NotificationPreview() {
  const queue = useNotificationStore((s) => s.queue);
  const setQueue = useNotificationStore((s) => s.setQueue);
  const setFeaturedMessage = useNotificationStore((s) => s.setFeaturedMessage);
  const goals = useGoalsStore((s) => s.goals);
  const dreams = useGoalsStore((s) => s.dreams);
  const [loading, setLoading] = useState(false);

  const pending = queue.filter((n) => !n.sent).slice(0, 5);
  const sent = queue.filter((n) => n.sent).slice(-5).reverse();

  const handleRegenerate = async () => {
    setLoading(true);
    try {
      const batch = await generateNotifications(goals, dreams, 24);
      await setQueue(batch);
      if (batch[0]) await setFeaturedMessage(batch[0].message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {goals.length > 0 && (
        <Button
          variant="secondary"
          className="w-full"
          onClick={handleRegenerate}
          disabled={loading}
        >
          {loading ? 'Генерируем...' : '🔥 Обновить — максимальная жёсткость'}
        </Button>
      )}

      {pending.length > 0 && (
        <div>
          <h3 className="text-xs text-muted uppercase tracking-widest mb-2">
            В очереди
          </h3>
          <div className="space-y-2">
            {pending.map((n) => (
              <div
                key={n.id}
                className="bg-bg-card border border-accent/20 rounded-xl p-3 text-sm leading-relaxed"
              >
                {n.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {sent.length > 0 && (
        <div>
          <h3 className="text-xs text-muted uppercase tracking-widest mb-2">
            Отправленные
          </h3>
          <div className="space-y-2">
            {sent.map((n) => (
              <div
                key={n.id}
                className="bg-bg-primary border border-border rounded-xl p-3 text-sm text-muted line-through opacity-60"
              >
                {n.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {pending.length === 0 && sent.length === 0 && (
        <p className="text-muted text-sm text-center py-4">
          Уведомления появятся после онбординга
        </p>
      )}
    </div>
  );
}
