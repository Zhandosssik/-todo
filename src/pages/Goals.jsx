import GoalCard from '../components/Onboarding/GoalCard';
import GoalItem from '../components/Dashboard/GoalItem';
import DreamsList from '../components/Dashboard/DreamsList';
import { useGoalsStore } from '../store/goalsStore';
import { getSetting } from '../db/indexedDB';
import { useEffect, useState } from 'react';

export default function Goals() {
  const { goals, planLocked } = useGoalsStore();
  const [dailyDeadline, setDailyDeadline] = useState('22:00');

  useEffect(() => {
    getSetting('dailyDeadline', '22:00').then(setDailyDeadline);
  }, []);

  return (
    <div className="px-6 py-8 pb-24 space-y-6 screen-transition">
      <h1 className="font-display text-4xl tracking-wide">Цели и мечты</h1>

      {planLocked && (
        <div className="bg-bg-card border border-border rounded-2xl p-4">
          <p className="text-sm text-muted">
            🔒 План зафиксирован при регистрации и не может быть изменён.
          </p>
          <p className="text-sm text-muted mt-1">
            Дедлайн выполнения: {dailyDeadline} — если не выполнишь все цели полностью, прогресс обнулится.
          </p>
        </div>
      )}

      <section>
        <h2 className="font-display text-2xl tracking-wide mb-3">Активные цели</h2>
        <div className="space-y-3 mb-6">
          {goals.map((goal) => (
            <GoalItem key={goal.id} goal={goal} />
          ))}
        </div>
      </section>

      {planLocked ? (
        <section>
          <h2 className="font-display text-2xl tracking-wide mb-3">Твой план</h2>
          <div className="space-y-4">
            {goals.map((goal) => (
              <GoalCard key={`view-${goal.id}`} goal={goal} readOnly />
            ))}
          </div>
        </section>
      ) : (
        <section>
          <h2 className="font-display text-2xl tracking-wide mb-3">Редактировать</h2>
          <p className="text-sm text-muted">Редактирование доступно только до фиксации плана.</p>
        </section>
      )}

      <section>
        <h2 className="font-display text-2xl tracking-wide mb-3">Доска мечтаний</h2>
        <DreamsList />
      </section>
    </div>
  );
}
