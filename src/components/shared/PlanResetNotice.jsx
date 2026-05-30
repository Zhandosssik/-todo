import { useEffect, useState } from 'react';
import Button from './Button';
import { setOnPlanReset } from '../../services/dailyPlanService';

export default function PlanResetNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setOnPlanReset(() => {
      setVisible(true);
    });
    return () => setOnPlanReset(null);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-6">
      <div className="bg-bg-card border border-red-500/50 rounded-2xl p-6 max-w-sm w-full space-y-4">
        <div className="text-4xl text-center">💀</div>
        <h2 className="font-display text-3xl tracking-wide text-center">Прогресс обнулён</h2>
        <p className="text-sm text-muted text-center leading-relaxed">
          Ты не выполнил весь план до дедлайна. Серия и весь накопленный прогресс сброшены.
          Начни заново сегодня.
        </p>
        <Button className="w-full" onClick={() => setVisible(false)}>
          Понятно
        </Button>
      </div>
    </div>
  );
}
