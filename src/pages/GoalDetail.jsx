import { useEffect } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import ProgressRing from '../components/shared/ProgressRing';
import GoalTimer from '../components/Goal/GoalTimer';
import GoalCalendar from '../components/Goal/GoalCalendar';
import { useGoalsStore } from '../store/goalsStore';
import { useGoalProgressStore } from '../store/goalProgressStore';
import { getGoalStats, formatDuration } from '../utils/goalStats';

export default function GoalDetail() {
  const { id } = useParams();
  const goals = useGoalsStore((s) => s.goals);
  const hydrated = useGoalsStore((s) => s.hydrated);
  const getGoalProgress = useGoalsStore((s) => s.getGoalProgress);
  const loadGoalLogs = useGoalProgressStore((s) => s.loadGoalLogs);
  const dayLogs = useGoalProgressStore((s) => s.logsByGoal[id] ?? null);

  const goal = goals.find((g) => g.id === id);

  useEffect(() => {
    if (id) loadGoalLogs(id);
  }, [id, loadGoalLogs]);

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="font-display text-2xl text-accent animate-pulse">Загрузка...</div>
      </div>
    );
  }

  if (!goal) {
    return <Navigate to="/goals" replace />;
  }

  const { progress, daysRemaining } = getGoalProgress(goal);
  const stats = getGoalStats(goal, dayLogs ?? []);

  return (
    <div className="min-h-screen pb-8 screen-transition">
      <header className="sticky top-0 z-20 bg-bg-primary/95 backdrop-blur border-b border-border px-6 py-4">
        <Link to="/" className="text-accent text-sm mb-2 inline-block min-h-[48px] leading-[48px]">
          ← Назад
        </Link>
        <h1 className="font-display text-3xl tracking-wide">{goal.name}</h1>
        {goal.description && (
          <p className="text-sm text-muted mt-1">{goal.description}</p>
        )}
      </header>

      <div className="px-6 py-6 space-y-6">
        <div className="grid grid-cols-3 gap-3">
          <StatCard value={stats.daysSinceStart} label="дней в пути" accent />
          <StatCard value={stats.activeDays} label="дней работал" />
          <StatCard value={stats.streak} label="серия" suffix="🔥" />
        </div>

        <div className="bg-bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <ProgressRing progress={progress} size={72} />
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
              {Math.round(progress * 100)}%
            </span>
          </div>
          <div>
            <p className="text-sm text-muted">Общий прогресс</p>
            <p className="font-display text-2xl tracking-wide">
              {daysRemaining} дн. осталось
            </p>
            <p className="text-sm text-muted mt-1">
              Всего: {formatDuration(stats.totalSeconds)}
            </p>
          </div>
        </div>

        <GoalTimer goal={goal} stats={stats} />

        <section>
          <h2 className="font-display text-2xl tracking-wide mb-3">Календарь</h2>
          <GoalCalendar goal={goal} dayLogs={dayLogs ?? []} />
        </section>
      </div>
    </div>
  );
}

function StatCard({ value, label, accent = false, suffix = '' }) {
  return (
    <div className="bg-bg-card border border-border rounded-2xl p-3 text-center">
      <p className={`font-display text-3xl tracking-wide ${accent ? 'text-accent' : 'text-white'}`}>
        {value}{suffix}
      </p>
      <p className="text-xs text-muted mt-1 leading-tight">{label}</p>
    </div>
  );
}
