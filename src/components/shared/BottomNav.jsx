import { Link, useLocation } from 'react-router-dom';

const tabs = [
  { path: '/', label: 'Главная', icon: '🏠' },
  { path: '/goals', label: 'Цели', icon: '🎯' },
  { path: '/alarm', label: 'Будильник', icon: '⏰' },
  { path: '/settings', label: 'Настройки', icon: '⚙️' },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-mobile bg-bg-card border-t border-border px-2 pb-safe z-40">
      <div className="flex justify-around items-center h-16">
        {tabs.map((tab) => {
          const active = location.pathname === tab.path;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex flex-col items-center justify-center min-w-[64px] min-h-[48px] screen-transition ${
                active ? 'text-accent' : 'text-muted'
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="text-xs mt-0.5">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
