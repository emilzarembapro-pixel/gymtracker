import React, { useState } from 'react';
import { useExerciseStore } from '../../stores/exerciseStore';
import type { ExerciseCategory, ExerciseEquipment, ExerciseTrackBy } from '../../types';
import { Button } from '../ui/Button';

const CATEGORIES: Array<{ id: ExerciseCategory; label: string }> = [
  { id: 'klatka', label: 'Klatka' },
  { id: 'plecy', label: 'Plecy' },
  { id: 'nogi', label: 'Nogi' },
  { id: 'barki', label: 'Barki' },
  { id: 'biceps', label: 'Biceps' },
  { id: 'triceps', label: 'Triceps' },
  { id: 'brzuch', label: 'Brzuch' },
  { id: 'cardio', label: 'Cardio' },
];

const EQUIPMENT: Array<{ id: ExerciseEquipment; label: string }> = [
  { id: 'sztanga', label: 'Sztanga' },
  { id: 'hantle', label: 'Hantle' },
  { id: 'maszyna', label: 'Maszyna' },
  { id: 'wolny', label: 'Bez sprzętu (BW)' },
];

const TRACK_BY: Array<{ id: ExerciseTrackBy; label: string }> = [
  { id: 'weight-reps', label: 'Ciężar × powtórzenia' },
  { id: 'reps-only', label: 'Same powtórzenia (masa własna)' },
  { id: 'time', label: 'Czas (plank, cardio)' },
];

interface CustomExerciseFormProps {
  onCreated?: () => void;
}

export function CustomExerciseForm({ onCreated }: CustomExerciseFormProps) {
  const addCustomExercise = useExerciseStore(s => s.addCustomExercise);
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [category, setCategory] = useState<ExerciseCategory>('klatka');
  const [equipment, setEquipment] = useState<ExerciseEquipment>('hantle');
  const [trackBy, setTrackBy] = useState<ExerciseTrackBy>('weight-reps');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Podaj nazwę po polsku.'); return; }
    if (!nameEn.trim()) { setError('Podaj nazwę po angielsku.'); return; }
    setError('');

    addCustomExercise({
      name: name.trim(),
      nameEn: nameEn.trim(),
      category,
      equipment,
      trackBy,
    });

    setName('');
    setNameEn('');
    onCreated?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs text-slate-400 mb-1">Nazwa (PL) *</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="np. Podciąganie szerokim chwytem"
          className="w-full bg-slate-800 text-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 ring-[var(--accent)]"
        />
      </div>

      <div>
        <label className="block text-xs text-slate-400 mb-1">Nazwa (EN) *</label>
        <input
          type="text"
          value={nameEn}
          onChange={e => setNameEn(e.target.value)}
          placeholder="np. Wide Grip Pull-Up"
          className="w-full bg-slate-800 text-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 ring-[var(--accent)]"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Kategoria</label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value as ExerciseCategory)}
            className="w-full bg-slate-800 text-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 ring-[var(--accent)]"
          >
            {CATEGORIES.map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Sprzęt</label>
          <select
            value={equipment}
            onChange={e => setEquipment(e.target.value as ExerciseEquipment)}
            className="w-full bg-slate-800 text-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 ring-[var(--accent)]"
          >
            {EQUIPMENT.map(eq => (
              <option key={eq.id} value={eq.id}>{eq.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs text-slate-400 mb-1">Sposób zapisu</label>
        <select
          value={trackBy}
          onChange={e => setTrackBy(e.target.value as ExerciseTrackBy)}
          className="w-full bg-slate-800 text-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 ring-[var(--accent)]"
        >
          {TRACK_BY.map(t => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <Button type="submit" variant="primary" fullWidth>
        Dodaj ćwiczenie
      </Button>
    </form>
  );
}
