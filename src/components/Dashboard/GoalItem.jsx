import { Link } from 'react-router-dom';
import ProgressRing from '../shared/ProgressRing';
import { useGoalsStore } from '../../store/goalsStore';

export default function GoalItem({ goal }) {
  const getGoalProgress = useGoalsStore((s) => s.getGoalProgress);
  const { progress, daysRemaining } = getGoalProgress(goal);

  return (
    <Link
      to={`/goals/${goal.id}`}
      className="bg-bg-card border border-border rounded-2xl p-4 flex gap-4 items-center screen-transition active:scale-[0.98] hover:border-accent/40"
    >
      <div className="relative flex-shrink-0">
        <ProgressRing progress={progress} />
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
          {Math.round(progress * 100)}%
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-display text-xl tracking-wide truncate">{goal.name}</h3>
        <p className="text-sm text-muted mt-1">
          {goal.dailyHours} ч сегодня · {daysRemaining} дн. осталось
        </p>
        <div className="mt-2 h-1.5 bg-bg-primary rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full screen-transition"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
      <span className="text-muted text-lg flex-shrink-0">→</span>
    </Link>
  );
}
