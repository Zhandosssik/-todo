import { useState } from 'react';
import { buildCalendarDays, WEEKDAYS, MONTHS, formatDuration } from '../../utils/goalStats';

export default function GoalCalendar({ goal, dayLogs }) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState(null);

  const days = buildCalendarDays(viewYear, viewMonth, goal, dayLogs);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
    setSelectedDay(null);
  };

  return (
    <div className="bg-bg-card border border-border rounded-2xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <button type="button" onClick={prevMonth} className="min-w-[48px] min-h-[48px] text-muted">
          ←
        </button>
        <h3 className="font-display text-xl tracking-wide">
          {MONTHS[viewMonth]} {viewYear}
        </h3>
        <button type="button" onClick={nextMonth} className="min-w-[48px] min-h-[48px] text-muted">
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((d) => (
          <span key={d} className="text-xs text-muted py-1">
            {d}
          </span>
        ))}

        {days.map((day) => {
          if (day.empty) {
            return <span key={day.key} />;
          }

          let cellClass = 'bg-bg-primary text-muted';
          if (day.beforeStart || day.afterEnd) {
            cellClass = 'bg-transparent text-muted/30';
          } else if (day.targetMet) {
            cellClass = 'bg-accent-success/20 text-accent-success font-bold';
          } else if (day.worked) {
            cellClass = 'bg-accent/20 text-accent font-bold';
          } else if (day.isToday) {
            cellClass = 'bg-bg-primary text-white ring-1 ring-accent';
          }

          return (
            <button
              key={day.key}
              type="button"
              disabled={day.beforeStart || day.afterEnd}
              onClick={() => setSelectedDay(day)}
              className={`aspect-square rounded-lg text-sm flex items-center justify-center screen-transition ${cellClass}`}
            >
              {day.day}
            </button>
          );
        })}
      </div>

      <div className="flex gap-4 text-xs text-muted justify-center">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-accent/20 inline-block" /> работал
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-accent-success/20 inline-block" /> норма выполнена
        </span>
      </div>

      {selectedDay && !selectedDay.beforeStart && (
        <div className="border-t border-border pt-3 text-sm text-center">
          <p className="text-muted">
            {selectedDay.date.split('-').reverse().join('.')}
          </p>
          {selectedDay.worked ? (
            <p className="text-white mt-1">
              {formatDuration(selectedDay.seconds)} работы
            </p>
          ) : (
            <p className="text-muted mt-1">Без активности</p>
          )}
        </div>
      )}
    </div>
  );
}
