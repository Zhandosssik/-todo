import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Button from './Button';
import { getSetting, setSetting } from '../../db/indexedDB';
import { todayStr } from '../../utils/goalStats';
import { setOnPlanReset } from '../../services/dailyPlanService';

export default function PlanResetNotice() {
  const [visible, setVisible] = useState(false);

  const showIfNeeded = useCallback(async () => {
    const today = todayStr();
    const ack = await getSetting('planResetNoticeAckDate');
    if (ack === today) return;
    setVisible(true);
  }, []);

  useEffect(() => {
    setOnPlanReset(showIfNeeded);
    return () => setOnPlanReset(null);
  }, [showIfNeeded]);

  useEffect(() => {
    async function restoreNotice() {
      const today = todayStr();
      const [lastReset, ack] = await Promise.all([
        getSetting('lastPlanResetDate'),
        getSetting('planResetNoticeAckDate'),
      ]);
      if (lastReset === today && ack !== today) {
        setVisible(true);
      }
    }
    restoreNotice();
  }, []);

  const handleDismiss = async () => {
    await setSetting('planResetNoticeAckDate', todayStr());
    setVisible(false);
  };

  if (!visible) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 px-6 touch-manipulation"
      role="dialog"
      aria-modal="true"
      aria-labelledby="plan-reset-title"
      onClick={handleDismiss}
    >
      <div
        className="relative z-10 bg-bg-card border border-red-500/50 rounded-2xl p-6 max-w-sm w-full space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-4xl text-center">💀</div>
        <h2 id="plan-reset-title" className="font-display text-3xl tracking-wide text-center">
          Прогресс обнулён
        </h2>
        <p className="text-sm text-muted text-center leading-relaxed">
          Ты не выполнил весь план до дедлайна. Серия и весь накопленный прогресс сброшены.
          Начни заново сегодня.
        </p>
        <Button className="w-full touch-manipulation" onClick={handleDismiss}>
          Понятно
        </Button>
      </div>
    </div>,
    document.body
  );
}
