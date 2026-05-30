import { useRef, useState, useCallback } from 'react';
import { unlockAlarmFeedback } from '../../services/alarmService';

const HOLD_MS = 3000;

export default function WakeUpChallenge({ onWakeUp }) {
  const [progress, setProgress] = useState(0);
  const [holding, setHolding] = useState(false);
  const timerRef = useRef(null);
  const startRef = useRef(0);
  const rafRef = useRef(null);

  const cancel = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    timerRef.current = null;
    rafRef.current = null;
    setHolding(false);
    setProgress(0);
  }, []);

  const updateProgress = useCallback(() => {
    const elapsed = Date.now() - startRef.current;
    const pct = Math.min(elapsed / HOLD_MS, 1);
    setProgress(pct);
    if (pct >= 1) {
      cancel();
      onWakeUp();
      return;
    }
    rafRef.current = requestAnimationFrame(updateProgress);
  }, [cancel, onWakeUp]);

  const startHold = () => {
    unlockAlarmFeedback();
    setHolding(true);
    startRef.current = Date.now();
    rafRef.current = requestAnimationFrame(updateProgress);
  };

  return (
    <div className="w-full max-w-sm space-y-4">
      <p className="text-center text-sm text-muted">
        Будильник не остановится, пока не подтвердишь пробуждение
      </p>
      <button
        type="button"
        onPointerDown={startHold}
        onPointerUp={cancel}
        onPointerLeave={cancel}
        onPointerCancel={cancel}
        className={`relative w-full min-h-[64px] rounded-2xl font-display text-xl tracking-wide screen-transition overflow-hidden ${
          holding ? 'bg-accent scale-[0.98]' : 'bg-accent/90 animate-pulse'
        }`}
      >
        <span
          className="absolute inset-0 bg-accent-success/40 origin-left screen-transition"
          style={{ transform: `scaleX(${progress})` }}
        />
        <span className="relative z-10 text-white">
          {holding ? 'Держи...' : 'УДЕРЖИ, ЧТОБЫ ВСТАТЬ'}
        </span>
      </button>
      <p className="text-center text-xs text-muted">
        Удерживай 3 секунды — без этого звук не прекратится
      </p>
    </div>
  );
}
