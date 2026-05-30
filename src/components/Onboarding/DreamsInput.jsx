import { useState } from 'react';
import Button from '../shared/Button';

export default function DreamsInput({ dreams, onAdd, onNext, onBack }) {
  const [text, setText] = useState('');

  const handleAdd = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setText('');
    if (navigator.vibrate) navigator.vibrate(10);
  };

  return (
    <div className="space-y-6 screen-transition">
      <div>
        <h2 className="font-display text-4xl tracking-wide">Твои мечты</h2>
        <p className="text-muted mt-2">
          Опиши всё, о чём мечтаешь. Чем подробнее — тем сильнее мотивация.
        </p>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Например: свой дом у моря, свобода путешествовать, финансовая независимость..."
        rows={4}
        className="w-full bg-bg-card border border-border rounded-2xl p-4 text-white outline-none resize-none placeholder:text-muted"
      />

      <Button onClick={handleAdd} variant="secondary" className="w-full">
        Добавить мечту
      </Button>

      {dreams.length > 0 && (
        <div className="space-y-2">
          {dreams.map((dream, i) => (
            <div
              key={i}
              className="bg-bg-card border border-border rounded-xl p-3 text-sm"
            >
              {dream}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button onClick={onBack} variant="ghost" className="flex-1">
          Назад
        </Button>
        <Button
          onClick={onNext}
          className="flex-1"
          disabled={dreams.length === 0}
        >
          Готово
        </Button>
      </div>
    </div>
  );
}
