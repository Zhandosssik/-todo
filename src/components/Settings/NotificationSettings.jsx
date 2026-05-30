import { useEffect, useState } from 'react';
import Button from '../shared/Button';
import {
  enableNotifications,
  getNotificationStatus,
  isIos,
  isStandalonePwa,
} from '../../services/notificationScheduler';

export default function NotificationSettings() {
  const [status, setStatus] = useState(getNotificationStatus());
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const refresh = () => setStatus(getNotificationStatus());

  useEffect(() => {
    refresh();
    const onVis = () => refresh();
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const handleEnable = () => {
    setLoading(true);
    setMessage('');

    enableNotifications()
      .then((result) => {
        refresh();
        if (result === 'granted') {
          setMessage('Готово! Тестовое уведомление должно прийти сейчас.');
        } else if (result === 'denied') {
          setMessage('Доступ запрещён. Включите вручную в настройках iPhone (см. ниже).');
        } else {
          setMessage('Уведомления не поддерживаются в этом браузере.');
        }
      })
      .finally(() => setLoading(false));
  };

  const { permission, supported, standalone } = status;
  const ios = isIos();

  return (
    <section className="bg-bg-card border border-border rounded-2xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Push-уведомления</p>
          <p className="text-xs text-muted mt-1">
            {permission === 'granted' && '✅ Включены'}
            {permission === 'denied' && '❌ Запрещены'}
            {permission === 'default' && '⚠️ Не настроены'}
            {!supported && '❌ Не поддерживаются'}
          </p>
        </div>
      </div>

      {ios && !standalone && (
        <p className="text-xs text-accent leading-relaxed">
          Откройте GoalAlarm с иконки на главном экране (Safari → Поделиться → На экран «Домой»).
          Из обычного Safari уведомления не работают.
        </p>
      )}

      {supported && permission !== 'granted' && (
        <Button className="w-full touch-manipulation" onClick={handleEnable} disabled={loading}>
          {loading ? 'Запрос...' : '🔔 Включить уведомления'}
        </Button>
      )}

      {supported && permission === 'granted' && (
        <Button
          variant="secondary"
          className="w-full touch-manipulation"
          onClick={handleEnable}
          disabled={loading}
        >
          {loading ? 'Отправка...' : 'Проверить уведомление'}
        </Button>
      )}

      {permission === 'denied' && ios && (
        <div className="text-xs text-muted space-y-1 leading-relaxed">
          <p className="font-medium text-white">Как включить вручную:</p>
          <p>1. Настройки iPhone → GoalAlarm → Уведомления</p>
          <p>2. Включите «Допуск уведомлений»</p>
          <p className="text-accent">
            Если GoalAlarm нет в списке — удалите иконку с главного экрана, добавьте заново через
            Safari, затем нажмите кнопку выше.
          </p>
        </div>
      )}

      {message && <p className="text-xs text-accent">{message}</p>}
    </section>
  );
}
