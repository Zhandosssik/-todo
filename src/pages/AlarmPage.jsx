import AlarmSetup from '../components/Alarm/AlarmSetup';
import NotificationPreview from '../components/Notifications/NotificationPreview';

export default function AlarmPage() {
  return (
    <div className="px-6 py-8 pb-24 space-y-8 screen-transition">
      <h1 className="font-display text-4xl tracking-wide">Будильник</h1>
      <AlarmSetup />
      <section>
        <h2 className="font-display text-2xl tracking-wide mb-3">Уведомления</h2>
        <NotificationPreview />
      </section>
    </div>
  );
}
