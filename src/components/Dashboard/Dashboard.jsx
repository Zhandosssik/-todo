import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import GoalItem from './GoalItem';
import DreamsList from './DreamsList';
import { useGoalsStore } from '../../store/goalsStore';
import { useAlarmStore } from '../../store/alarmStore';
import { useNotificationStore } from '../../store/notificationStore';
import { getSetting, getAllGoalDayLogs } from '../../db/indexedDB';
import { getGlobalStreak } from '../../utils/planCheck';

export default function Dashboard() {
  const goals = useGoalsStore((s) => s.goals);
  const planLocked = useGoalsStore((s) => s.planLocked);
  const wakeStreak = useAlarmStore((s) => s.config.wakeStreak);
  const featuredMessage = useNotificationStore((s) => s.featuredMessage);
  const [globalStreak, setGlobalStreak] = useState(0);
  const [dailyDeadline, setDailyDeadline] = useState('22:00');

  useEffect(() => {
    async function loadStreak() {
      const [logs, deadline] = await Promise.all([
        getAllGoalDayLogs(),
        getSetting('dailyDeadline', '22:00'),
      ]);
      setGlobalStreak(getGlobalStreak(goals, logs));
      setDailyDeadline(deadline);
    }
    if (goals.length) loadStreak();
  }, [goals]);

  return (
    <div className="space-y-6 pb-24 screen-transition">
      <header>
        <h1 className="font-display text-4xl tracking-wide">Сегодня</h1>
        <div className="mt-2 space-y-1">
          {globalStreak > 0 && (
            <p className="text-accent font-medium">
              🔥 {globalStreak} {globalStreak === 1 ? 'день' : globalStreak < 5 ? 'дня' : 'дней'} серия — все цели выполнены
            </p>
          )}
          {wakeStreak > 0 && (
            <p className="text-accent-success font-medium">
              ⏰ {wakeStreak} {wakeStreak === 1 ? 'день' : wakeStreak < 5 ? 'дня' : 'дней'} подряд встал вовремя
            </p>
          )}
          {planLocked && (
            <p className="text-xs text-muted">
              Дедлайн сегодня: {dailyDeadline} · план зафиксирован 🔒
            </p>
          )}
        </div>
      </header>

      {featuredMessage && (
        <div className="bg-bg-card border border-accent/30 rounded-2xl p-4">
          <p className="text-xs text-accent uppercase tracking-widest mb-2">
            Сегодняшняя мотивация
          </p>
          <p className="text-base leading-relaxed">{featuredMessage}</p>
        </div>
      )}

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-2xl tracking-wide">Цели</h2>
          <Link to="/goals" className="text-accent text-sm">
            Все →
          </Link>
        </div>
        <div className="space-y-3">
          {goals.slice(0, 3).map((goal) => (
            <GoalItem key={goal.id} goal={goal} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl tracking-wide mb-3">Мечты</h2>
        <DreamsList compact />
      </section>
    </div>
  );
}
