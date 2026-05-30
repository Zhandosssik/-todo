import { useGoalsStore } from '../../store/goalsStore';

export default function DreamsList({ compact = false }) {
  const dreams = useGoalsStore((s) => s.dreams);

  if (dreams.length === 0) {
    return (
      <p className="text-muted text-sm text-center py-4">
        Добавь мечты на странице «Цели»
      </p>
    );
  }

  return (
    <div className={`grid gap-3 ${compact ? 'grid-cols-1' : 'grid-cols-2'}`}>
      {dreams.map((dream) => (
        <div
          key={dream.id}
          className="bg-gradient-to-br from-bg-card to-[#1a0a00] border border-border rounded-2xl p-4 min-h-[100px] flex items-end"
        >
          <p className={`${compact ? 'text-sm' : 'text-base'} leading-snug`}>
            ✨ {dream.text}
          </p>
        </div>
      ))}
    </div>
  );
}
