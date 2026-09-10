import { useState, useCallback } from 'react';
import { useExerciseStore } from '../../stores/exerciseStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { PROFILE_ID } from '../../constants/profiles';
import type { Exercise, ExerciseCategory } from '../../types';
import { cn } from '../../utils/cn';

const CATEGORIES: Array<{ id: ExerciseCategory | 'all'; label: string }> = [
  { id: 'all', label: 'Wszystkie' },
  { id: 'klatka', label: 'Klatka' },
  { id: 'plecy', label: 'Plecy' },
  { id: 'nogi', label: 'Nogi' },
  { id: 'barki', label: 'Barki' },
  { id: 'biceps', label: 'Biceps' },
  { id: 'triceps', label: 'Triceps' },
  { id: 'brzuch', label: 'Brzuch' },
  { id: 'cardio', label: 'Cardio' },
];

const EQUIPMENT_LABELS: Record<string, string> = {
  sztanga: 'Sztanga',
  hantle: 'Hantle',
  maszyna: 'Maszyna',
  wolny: 'BW',
};

function PinIcon({ filled }: { filled: boolean }) {
  if (filled) {
    return (
      <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
        <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
    </svg>
  );
}

interface ExercisePickerProps {
  onSelect: (exercise: Exercise) => void;
}

export function ExercisePicker({ onSelect }: ExercisePickerProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ExerciseCategory | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const toggleExpanded = useCallback((id: string) => setExpandedId(prev => prev === id ? null : id), []);
  const exercises = useExerciseStore(s => s.exercises);
  const { isPinned, togglePinnedExercise } = useSettingsStore();

  const filtered = exercises
    .filter(e => {
      const matchCat = category === 'all' || e.category === category;
      const q = query.toLowerCase();
      const matchQ = !q || e.name.toLowerCase().includes(q) || e.nameEn.toLowerCase().includes(q);
      return matchCat && matchQ;
    })
    .sort((a, b) => {
      const aPinned = isPinned(PROFILE_ID, a.id);
      const bPinned = isPinned(PROFILE_ID, b.id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return a.nameEn.localeCompare(b.nameEn, 'en');
    });

  return (
    <div className="flex flex-col gap-3">
      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2"
          style={{ color: 'var(--accent)' }}
          viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          placeholder="Szukaj ćwiczenia..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full text-white placeholder-white/25 rounded-2xl py-3.5 pl-11 pr-4 text-sm outline-none"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-glass)',
            caretColor: 'var(--accent)',
          }}
        />
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id as ExerciseCategory | 'all')}
            className={cn(
              'flex-shrink-0 px-3.5 py-2 rounded-full text-xs font-semibold transition-all',
              category === cat.id
                ? 'text-white'
                : 'bg-white/5 border border-white/10 text-white/45',
            )}
            style={category === cat.id ? {
              background: 'linear-gradient(135deg, var(--accent), var(--accent-muted))',
              transition: 'background 0.45s ease',
            } : undefined}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Exercise list */}
      <div className="flex flex-col gap-2">
        {filtered.length === 0 && (
          <p className="text-center text-white/30 py-10 text-sm">Brak ćwiczeń</p>
        )}
        {filtered.map(exercise => {
          const pinned = isPinned(PROFILE_ID, exercise.id);
          const isExpanded = expandedId === exercise.id;
          return (
            <div
              key={exercise.id}
              className="rounded-2xl overflow-hidden"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-glass)' }}
            >
              <div className="flex items-center gap-3 px-4 py-3.5">
                <button className="flex-1 text-left" onClick={() => onSelect(exercise)}>
                  <div className="text-white font-semibold text-sm">{exercise.nameEn}</div>
                  <div className="text-white/35 text-xs mt-0.5">{exercise.name}</div>
                </button>
                <span
                  className="text-[11px] font-medium px-2 py-0.5 rounded-lg flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)' }}
                >
                  {EQUIPMENT_LABELS[exercise.equipment] ?? exercise.equipment}
                </span>
                {exercise.description && (
                  <button
                    onClick={e => { e.stopPropagation(); toggleExpanded(exercise.id); }}
                    className={cn('p-2 rounded-xl transition-colors flex-shrink-0', isExpanded ? 'text-[var(--accent)]' : 'text-white/25 hover:text-white/50')}
                    title="Jak wykonać"
                  >
                    <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
                    </svg>
                  </button>
                )}
                <button
                  onClick={e => { e.stopPropagation(); togglePinnedExercise(PROFILE_ID, exercise.id); }}
                  className={cn('p-2 rounded-xl transition-colors flex-shrink-0', pinned ? 'text-[var(--accent)]' : 'text-white/25 hover:text-white/50')}
                  title={pinned ? 'Odepnij' : 'Przypnij'}
                >
                  <PinIcon filled={pinned} />
                </button>
              </div>
              {isExpanded && exercise.description && (
                <div style={{
                  padding: '0 16px 14px',
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  paddingTop: 12,
                }}>
                  <p style={{ fontSize: 12.5, lineHeight: 1.6, color: 'rgba(255,255,255,0.55)' }}>
                    {exercise.description}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
