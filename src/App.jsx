import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import Goals from './pages/Goals';
import GoalDetail from './pages/GoalDetail';
import AlarmPage from './pages/AlarmPage';
import Settings from './pages/Settings';
import BottomNav from './components/shared/BottomNav';
import AlarmScreen from './components/Alarm/AlarmScreen';
import Button from './components/shared/Button';
import { useGoalsStore, useAppStore } from './store/goalsStore';
import { useAlarmStore } from './store/alarmStore';
import { useNotificationStore } from './store/notificationStore';
import { hasCompletedOnboarding } from './db/indexedDB';
import {
  startNotificationScheduler,
  scheduleDailyRegeneration,
} from './services/notificationScheduler';
import {
  startAlarmChecker,
  cacheAlarmConfig,
  unlockAlarmFeedback,
} from './services/alarmService';
import {
  startDailyPlanService,
} from './services/dailyPlanService';
import PlanResetNotice from './components/shared/PlanResetNotice';

function InstallPrompt() {
  const show = useAppStore((s) => s.showInstallPrompt);
  const dismiss = useAppStore((s) => s.dismissInstallPrompt);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!show) return null;

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    }
    dismiss();
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 max-w-mobile mx-auto z-30 bg-bg-card border border-accent rounded-2xl p-4 shadow-xl">
      <p className="text-sm mb-3">Добавь GoalAlarm на главный экран для лучшего опыта</p>
      <div className="flex gap-2">
        <Button variant="ghost" className="flex-1" onClick={dismiss}>
          Позже
        </Button>
        <Button className="flex-1" onClick={handleInstall}>
          Установить
        </Button>
      </div>
    </div>
  );
}

function AppShell() {
  const location = useLocation();
  const showNav = !/^\/goals\/[^/]+$/.test(location.pathname);
  const [ready, setReady] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const hydrateGoals = useGoalsStore((s) => s.hydrate);
  const hydrateAlarm = useAlarmStore((s) => s.hydrate);
  const hydrateNotifications = useNotificationStore((s) => s.hydrate);
  const incrementAppOpen = useAppStore((s) => s.incrementAppOpen);
  const alarmConfig = useAlarmStore((s) => s.config);
  const triggerAlarm = useAlarmStore((s) => s.triggerAlarm);

  useEffect(() => {
    registerSW({ immediate: true });
  }, []);

  useEffect(() => {
    const unlock = () => unlockAlarmFeedback();
    document.addEventListener('pointerdown', unlock, { once: true });
    document.addEventListener('keydown', unlock, { once: true });
    return () => {
      document.removeEventListener('pointerdown', unlock);
      document.removeEventListener('keydown', unlock);
    };
  }, []);

  useEffect(() => {
    async function init() {
      try {
        await Promise.all([
          hydrateGoals(),
          hydrateAlarm(),
          hydrateNotifications(),
        ]);
        const completed = await hasCompletedOnboarding();
        setOnboarded(completed);

        await incrementAppOpen();

        if (completed) {
          await startDailyPlanService();
          await hydrateGoals();
          startNotificationScheduler();
          scheduleDailyRegeneration();
        }
      } catch (error) {
        console.error('App init failed:', error);
      } finally {
        setReady(true);
      }
    }
    init();
  }, [hydrateGoals, hydrateAlarm, hydrateNotifications, incrementAppOpen]);

  useEffect(() => {
    cacheAlarmConfig(alarmConfig);
    startAlarmChecker(triggerAlarm);
  }, [alarmConfig, triggerAlarm]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="font-display text-3xl text-accent animate-pulse">GOALALARM</div>
      </div>
    );
  }

  if (!onboarded) {
    return (
      <Onboarding
        onDone={async () => {
          await startDailyPlanService();
          await hydrateGoals();
          setOnboarded(true);
        }}
      />
    );
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/goals/:id" element={<GoalDetail />} />
        <Route path="/alarm" element={<AlarmPage />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {showNav && <BottomNav />}
      <AlarmScreen />
      <PlanResetNotice />
      <InstallPrompt />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
