import { useState, useEffect } from 'react';
import AlarmSetup from '../components/Alarm/AlarmSetup';
import NotificationSettings from '../components/Settings/NotificationSettings';
import GoalCard from '../components/Onboarding/GoalCard';
import Button from '../components/shared/Button';
import { useGoalsStore } from '../store/goalsStore';
import { clearAllData, getSetting } from '../db/indexedDB';
import { stopNotificationScheduler } from '../services/notificationScheduler';
import { stopDailyPlanService } from '../services/dailyPlanService';

export default function Settings() {
  const { goals, planLocked } = useGoalsStore();
  const [confirmReset, setConfirmReset] = useState(false);
  const [dailyDeadline, setDailyDeadline] = useState('22:00');

  useEffect(() => {
    getSetting('dailyDeadline', '22:00').then(setDailyDeadline);
  }, []);

  const handleReset = async () => {
    stopNotificationScheduler();
    stopDailyPlanService();
    await clearAllData();
    window.location.reload();
  };

  return (
    <div className="px-6 py-8 pb-24 space-y-8 screen-transition">
      <h1 className="font-display text-4xl tracking-wide">Настройки</h1>

      <AlarmSetup />

      <NotificationSettings />

      {planLocked && (
        <section className="bg-bg-card border border-border rounded-2xl p-4">
          <p className="text-sm font-medium mb-1">Ежедневный дедлайн</p>
          <p className="font-display text-2xl tracking-wide">{dailyDeadline}</p>
          <p className="text-xs text-muted mt-2">
            Задан при регистрации. Невыполнение всех целей до этого времени обнуляет прогресс.
          </p>
        </section>
      )}

      <section>
        <h2 className="font-display text-2xl tracking-wide mb-3">
          {planLocked ? 'Твой план' : 'Редактировать цели'}
        </h2>
        {planLocked && (
          <p className="text-sm text-muted mb-3">
            🔒 План нельзя изменить после регистрации
          </p>
        )}
        <div className="space-y-4">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              readOnly={planLocked || goal.locked}
            />
          ))}
        </div>
      </section>

      <section className="border-t border-border pt-6">
        {!confirmReset ? (
          <Button
            variant="ghost"
            className="w-full text-red-400"
            onClick={() => setConfirmReset(true)}
          >
            Сбросить все данные
          </Button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted text-center">
              Это удалит все цели, мечты и уведомления. Продолжить?
            </p>
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setConfirmReset(false)}>
                Отмена
              </Button>
              <Button className="flex-1 bg-red-600" onClick={handleReset}>
                Удалить всё
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
