import { useState } from 'react';
import GoalCard from './GoalCard';
import DreamsInput from './DreamsInput';
import Button from '../shared/Button';

const emptyGoal = () => ({
  id: crypto.randomUUID(),
  name: '',
  description: '',
  durationDays: 365,
  dailyHours: 2,
  category: 'other',
});

function normalizeGoals(goals) {
  return goals
    .map((g) => ({
      ...g,
      name: g.name.trim() || g.description?.trim().slice(0, 80) || '',
      description: g.description?.trim() || '',
      durationDays: Number(g.durationDays) > 0 ? Number(g.durationDays) : 365,
      dailyHours: Number(g.dailyHours) > 0 ? Number(g.dailyHours) : 1,
    }))
    .filter((g) => g.name);
}

function canProceedFromGoals(goals) {
  return goals.some((g) => g.name.trim() || g.description?.trim());
}

export default function OnboardingFlow({ onComplete }) {
  const [step, setStep] = useState(0);
  const [goals, setGoals] = useState([emptyGoal()]);
  const [dreams, setDreams] = useState([]);
  const [dailyDeadline, setDailyDeadline] = useState('22:00');
  const [loading, setLoading] = useState(false);

  const updateGoal = (index, updated) => {
    setGoals((prev) => prev.map((g, i) => (i === index ? updated : g)));
  };

  const addGoal = () => setGoals((prev) => [...prev, emptyGoal()]);

  const removeGoal = (index) => {
    if (goals.length <= 1) return;
    setGoals((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGoalsNext = () => {
    const normalized = normalizeGoals(goals);
    if (normalized.length === 0) return;
    setGoals(normalized);
    setStep(2);
  };

  const handleComplete = async () => {
    setLoading(true);
    await onComplete(normalizeGoals(goals), dreams, dailyDeadline);
    setLoading(false);
  };

  if (step === 0) {
    return (
      <div className="min-h-screen flex flex-col justify-center px-6 screen-transition">
        <div className="text-center space-y-6">
          <div className="text-6xl">🎯</div>
          <h1 className="font-display text-5xl tracking-wide leading-tight">
            GOAL
            <br />
            ALARM
          </h1>
          <p className="text-muted text-lg">
            Достижение целей через жёсткую мотивацию, умные уведомления и
            будильник, который не даст тебе сдаться.
          </p>
          <Button onClick={() => setStep(1)} className="w-full">
            Начать
          </Button>
        </div>
      </div>
    );
  }

  if (step === 1) {
    const canProceed = canProceedFromGoals(goals);

    return (
      <div className="min-h-screen flex flex-col screen-transition">
        <div className="flex-1 px-6 py-8 pb-32 overflow-y-auto">
          <h2 className="font-display text-4xl tracking-wide mb-2">Твои цели</h2>
          <p className="text-muted mb-6">
            Добавь цели одну за другой. Укажи срок и сколько часов готов
            вкладывать каждый день. После запуска план нельзя будет изменить.
          </p>

          <div className="space-y-4 mb-6">
            {goals.map((goal, i) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onChange={(updated) => updateGoal(i, updated)}
                onRemove={() => removeGoal(i)}
                showRemove={goals.length > 1}
              />
            ))}
          </div>

          <Button onClick={addGoal} variant="secondary" className="w-full">
            + Ещё цель
          </Button>

          <div className="mt-6 bg-bg-card border border-border rounded-2xl p-4">
            <label className="text-xs text-muted block mb-1">
              Дедлайн выполнения плана на сегодня
            </label>
            <input
              type="time"
              value={dailyDeadline}
              onChange={(e) => setDailyDeadline(e.target.value)}
              className="w-full bg-bg-primary border border-border rounded-xl p-3 text-white outline-none"
            />
            <p className="text-xs text-muted mt-2">
              Если к этому времени не выполнишь все цели полностью — весь прогресс обнулится.
            </p>
          </div>

          {!canProceed && (
            <p className="text-sm text-muted text-center mt-4">
              Заполни название хотя бы одной цели
            </p>
          )}
        </div>

        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-mobile bg-bg-primary border-t border-border px-6 py-4 flex gap-3 z-10">
          <Button onClick={() => setStep(0)} variant="ghost" className="flex-1">
            Назад
          </Button>
          <Button
            onClick={handleGoalsNext}
            className="flex-1"
            disabled={!canProceed}
          >
            Дальше
          </Button>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="min-h-screen px-6 py-8 screen-transition">
        <DreamsInput
          dreams={dreams}
          onAdd={(text) => setDreams((prev) => [...prev, text])}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 screen-transition">
      <div className="text-center space-y-6">
        <div className="text-5xl">🔥</div>
        <h2 className="font-display text-4xl tracking-wide">Всё готово!</h2>
        <p className="text-muted">
          Мы сгенерируем персональные мотивационные уведомления на основе твоих
          целей и мечтаний.
        </p>
        <div className="bg-bg-card border border-border rounded-2xl p-4 text-left space-y-2">
          <p className="text-sm text-muted">Цели: {goals.filter((g) => g.name.trim()).length}</p>
          <p className="text-sm text-muted">Мечты: {dreams.length}</p>
          <p className="text-sm text-muted">Дедлайн: {dailyDeadline}</p>
          <p className="text-sm text-accent">🔒 План будет зафиксирован</p>
        </div>
        <Button onClick={handleComplete} className="w-full" disabled={loading}>
          {loading ? 'Генерируем...' : 'Запустить GoalAlarm'}
        </Button>
      </div>
    </div>
  );
}
