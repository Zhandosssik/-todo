import { useEffect, useState } from 'react';
import Button from '../shared/Button';
import { useGoalTimerStore } from '../../store/goalTimerStore';
import { useGoalProgressStore } from '../../store/goalProgressStore';
import { formatTimer, formatDuration } from '../../utils/goalStats';

export default function GoalTimer({ goal, stats }) {
  const { goalId, running, start, pause, reset, getElapsed, stopAndSave } =
    useGoalTimerStore();
  const addWorkTime = useGoalProgressStore((s) => s.addWorkTime);
  const [display, setDisplay] = useState(0);

  const isActive = goalId === goal.id;

  useEffect(() => {
    if (!isActive || !running) {
      setDisplay(isActive ? getElapsed() : 0);
      return;
    }

    setDisplay(getElapsed());
    const interval = setInterval(() => setDisplay(getElapsed()), 1000);
    return () => clearInterval(interval);
  }, [isActive, running, goalId, getElapsed]);

  const handleStart = () => start(goal.id);

  const handlePause = () => pause();

  const handleSave = async () => {
    if (isActive) {
      await stopAndSave(addWorkTime);
    }
  };

  const handleReset = () => {
    if (isActive) reset();
  };

  const totalToday = stats.todaySeconds + (isActive ? display : 0);
  const progress = stats.targetSeconds > 0
    ? Math.min(totalToday / stats.targetSeconds, 1)
    : 0;

  return (
    <div className="bg-bg-card border border-border rounded-2xl p-6 space-y-5">
      <div className="text-center">
        <p className="text-xs text-muted uppercase tracking-widest mb-2">Таймер сегодня</p>
        <p className="font-display text-6xl tracking-wider text-accent tabular-nums">
          {formatTimer(isActive ? display : 0)}
        </p>
        <p className="text-sm text-muted mt-2">
          Цель: {goal.dailyHours} ч · Сделано: {formatDuration(totalToday)}
        </p>
      </div>

      <div className="h-2 bg-bg-primary rounded-full overflow-hidden">
        <div
          className="h-full rounded-full screen-transition bg-accent-success"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div className="flex gap-3">
        {!isActive || !running ? (
          <Button onClick={handleStart} className="flex-1">
            {isActive && display > 0 ? 'Продолжить' : 'Старт'}
          </Button>
        ) : (
          <Button onClick={handlePause} variant="secondary" className="flex-1">
            Пауза
          </Button>
        )}
        <Button
          onClick={handleSave}
          variant="success"
          className="flex-1"
          disabled={!isActive || display === 0}
        >
          Сохранить
        </Button>
      </div>

      {isActive && display > 0 && (
        <button
          type="button"
          onClick={handleReset}
          className="w-full text-sm text-muted min-h-[48px]"
        >
          Сбросить таймер
        </button>
      )}
    </div>
  );
}
