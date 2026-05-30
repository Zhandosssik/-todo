import { useEffect, useState, useRef } from 'react';
import WakeUpChallenge from './WakeUpChallenge';
import GoalItem from '../Dashboard/GoalItem';
import { useAlarmStore } from '../../store/alarmStore';
import { useGoalsStore } from '../../store/goalsStore';
import {
  startAlarmSound,
  stopAlarmSound,
  isAlarmSoundPlaying,
  requestWakeLock,
  releaseWakeLock,
} from '../../services/alarmService';
import { getEscalatedMessage } from '../../data/wakeUpMessages';

export default function AlarmScreen() {
  const {
    isRinging,
    wakeMessages,
    wakeUpSuccess,
    dismissAlarm,
    alarmStartedAt,
  } = useAlarmStore();
  const goals = useGoalsStore((s) => s.goals);
  const dreams = useGoalsStore((s) => s.dreams);
  const [showGoals, setShowGoals] = useState(false);
  const [time, setTime] = useState(new Date());
  const [message, setMessage] = useState('');
  const soundGuardRef = useRef(null);

  useEffect(() => {
    if (isRinging) {
      startAlarmSound();
      requestWakeLock();

      soundGuardRef.current = setInterval(() => {
        if (useAlarmStore.getState().isRinging && !isAlarmSoundPlaying()) {
          startAlarmSound();
        }
      }, 2000);
    } else {
      stopAlarmSound();
      releaseWakeLock();
      if (soundGuardRef.current) {
        clearInterval(soundGuardRef.current);
        soundGuardRef.current = null;
      }
    }
    return () => {
      stopAlarmSound();
      releaseWakeLock();
      if (soundGuardRef.current) clearInterval(soundGuardRef.current);
    };
  }, [isRinging]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isRinging) return;

    const updateMessage = () => {
      const started = alarmStartedAt || Date.now();
      const elapsed = Math.floor((Date.now() - started) / 1000);
      const stored = wakeMessages || [];
      if (stored.length > 0) {
        const idx = Math.floor(elapsed / 8) % stored.length;
        setMessage(stored[idx]);
      } else {
        setMessage(getEscalatedMessage(goals, dreams, elapsed));
      }
    };

    updateMessage();
    const msgTimer = setInterval(updateMessage, 8000);
    return () => clearInterval(msgTimer);
  }, [isRinging, alarmStartedAt, wakeMessages, goals, dreams]);

  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden && isRinging) {
        startAlarmSound();
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isRinging]);

  if (!isRinging && !showGoals) return null;

  const handleWakeUp = async () => {
    await wakeUpSuccess();
    setShowGoals(true);
  };

  const timeStr = time.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const dateStr = time.toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  if (showGoals) {
    return (
      <div className="fixed inset-0 z-50 bg-bg-primary flex flex-col px-6 py-8 overflow-y-auto max-w-mobile mx-auto">
        <div className="text-center mb-6 screen-transition">
          <h1 className="font-display text-4xl text-accent tracking-wide">
            Ты проснулся. Действуй.
          </h1>
          <p className="text-muted mt-2">Сегодня без отмазок:</p>
        </div>
        <div className="space-y-3 flex-1">
          {goals.map((goal) => (
            <GoalItem key={goal.id} goal={goal} />
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            dismissAlarm();
            setShowGoals(false);
          }}
          className="mt-6 min-h-[48px] text-accent font-medium"
        >
          Начать день →
        </button>
      </div>
    );
  }

  const elapsed = alarmStartedAt
    ? Math.floor((Date.now() - alarmStartedAt) / 1000)
    : 0;

  return (
    <div className="fixed inset-0 z-50 bg-bg-primary flex flex-col items-center justify-center px-6 max-w-mobile mx-auto alarm-pulse">
      <div className="text-center mb-8 w-full">
        <p className="text-accent uppercase tracking-widest text-sm mb-2 font-medium">
          {elapsed >= 60
            ? `Будильник уже ${Math.floor(elapsed / 60)} мин — хватит спать`
            : 'Просыпайся'}
        </p>
        <p className="text-muted capitalize mb-2">{dateStr}</p>
        <p className="font-display text-8xl tracking-wide text-accent">{timeStr}</p>
        {message && (
          <p className="text-white mt-8 text-xl leading-relaxed max-w-sm mx-auto font-medium">
            {message}
          </p>
        )}
      </div>
      <WakeUpChallenge onWakeUp={handleWakeUp} />
    </div>
  );
}
