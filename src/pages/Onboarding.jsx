import OnboardingFlow from '../components/Onboarding/OnboardingFlow';
import { useGoalsStore } from '../store/goalsStore';
import { useNotificationStore } from '../store/notificationStore';
import { useAlarmStore } from '../store/alarmStore';
import { generateNotifications, generateWakeUpMessages } from '../services/aiNotifications';
import {
  requestNotificationPermission,
  startNotificationScheduler,
  scheduleDailyRegeneration,
} from '../services/notificationScheduler';
import { setSetting } from '../db/indexedDB';

export default function Onboarding({ onDone }) {
  const addGoal = useGoalsStore((s) => s.addGoal);
  const addDream = useGoalsStore((s) => s.addDream);
  const setQueue = useNotificationStore((s) => s.setQueue);
  const setFeaturedMessage = useNotificationStore((s) => s.setFeaturedMessage);
  const setWakeMessages = useAlarmStore((s) => s.setWakeMessages);

  const handleComplete = async (goalsData, dreamsData, dailyDeadline = '22:00') => {
    const savedGoals = [];
    for (const g of goalsData) {
      const goal = await addGoal({ ...g, locked: true });
      savedGoals.push(goal);
    }

    const savedDreams = [];
    for (const text of dreamsData) {
      const dream = await addDream(text);
      savedDreams.push(dream);
    }

    await setSetting('onboardingComplete', true);
    await setSetting('planLocked', true);
    await setSetting('dailyDeadline', dailyDeadline);

    const notifications = await generateNotifications(savedGoals, savedDreams, 24);
    await setQueue(notifications);

    if (notifications.length > 0) {
      await setFeaturedMessage(notifications[0].message);
    }

    const morningMsg = await generateWakeUpMessages(savedGoals, savedDreams, 12);
    await setWakeMessages(morningMsg);

    await requestNotificationPermission();
    startNotificationScheduler();
    scheduleDailyRegeneration();

    onDone();
  };

  return <OnboardingFlow onComplete={handleComplete} />;
}
