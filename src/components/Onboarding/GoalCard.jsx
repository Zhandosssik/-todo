export default function GoalCard({ goal, onChange, onRemove, showRemove = false, readOnly = false }) {
  const inputClass =
    'w-full bg-bg-primary border border-border rounded-xl p-3 text-white outline-none';
  const disabledClass = readOnly ? ' opacity-70 cursor-not-allowed' : '';

  return (
    <div className="bg-bg-card border border-border rounded-2xl p-4 space-y-3">
      {readOnly && (
        <p className="text-xs text-muted">🔒 План зафиксирован при регистрации</p>
      )}
      <div>
        <label className="text-xs text-muted block mb-1">
          Название цели {!readOnly && <span className="text-accent">*</span>}
        </label>
        <input
          type="text"
          value={goal.name}
          onChange={(e) => onChange({ ...goal, name: e.target.value })}
          placeholder="Например: Learn Python"
          readOnly={readOnly}
          disabled={readOnly}
          className={`${inputClass} font-display text-xl tracking-wide placeholder:text-muted${disabledClass}`}
        />
      </div>
      <textarea
        value={goal.description || ''}
        onChange={(e) => onChange({ ...goal, description: e.target.value })}
        placeholder="Расскажи подробнее — чем больше деталей, тем точнее мотивация"
        rows={2}
        readOnly={readOnly}
        disabled={readOnly}
        className={`${inputClass} text-sm resize-none placeholder:text-muted${disabledClass}`}
      />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted block mb-1">Срок (дней)</label>
          <input
            type="number"
            min={1}
            value={goal.durationDays}
            onChange={(e) =>
              onChange({ ...goal, durationDays: Number(e.target.value) })
            }
            readOnly={readOnly}
            disabled={readOnly}
            className={`${inputClass}${disabledClass}`}
          />
        </div>
        <div>
          <label className="text-xs text-muted block mb-1">Часов в день</label>
          <input
            type="number"
            min={0.5}
            step={0.5}
            value={goal.dailyHours}
            onChange={(e) =>
              onChange({ ...goal, dailyHours: Number(e.target.value) })
            }
            readOnly={readOnly}
            disabled={readOnly}
            className={`${inputClass}${disabledClass}`}
          />
        </div>
      </div>
      {showRemove && !readOnly && (
        <button
          type="button"
          onClick={onRemove}
          className="text-sm text-red-400 min-h-[48px]"
        >
          Удалить цель
        </button>
      )}
    </div>
  );
}
