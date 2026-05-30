import Button from '../shared/Button';
import { useAlarmStore } from '../../store/alarmStore';
import { unlockAlarmFeedback } from '../../services/alarmService';

export default function AlarmSetup() {
  const { config, setAlarmTime, setAlarmEnabled } = useAlarmStore();

  return (
    <div className="bg-bg-card border border-border rounded-2xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <span className="font-display text-2xl tracking-wide">Будильник</span>
        <button
          type="button"
          onClick={() => setAlarmEnabled(!config.enabled)}
          className={`w-14 h-8 rounded-full screen-transition relative ${
            config.enabled ? 'bg-accent' : 'bg-border'
          }`}
        >
          <span
            className={`absolute top-1 w-6 h-6 bg-white rounded-full screen-transition ${
              config.enabled ? 'left-7' : 'left-1'
            }`}
          />
        </button>
      </div>

      <div>
        <label className="text-xs text-muted block mb-2">Время</label>
        <input
          type="time"
          value={config.time}
          onChange={(e) => setAlarmTime(e.target.value)}
          className="w-full bg-bg-primary border border-border rounded-xl p-4 text-3xl font-display text-center text-white outline-none"
        />
      </div>

      {config.wakeStreak > 0 && (
        <p className="text-accent-success text-center">
          🔥 Серия: {config.wakeStreak} дн.
        </p>
      )}

      <Button
        variant="secondary"
        className="w-full"
        onClick={() => {
          unlockAlarmFeedback();
          useAlarmStore.getState().triggerAlarm();
        }}
      >
        Тест будильника (не остановится без подтверждения)
      </Button>
    </div>
  );
}
