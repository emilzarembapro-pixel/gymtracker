import React, { useState } from 'react';
import { useExerciseStore } from '../../stores/exerciseStore';
import { useProfileStore } from '../../stores/profileStore';
import type { ExerciseCategory, ExerciseEquipment } from '../../types';
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

interface CustomExerciseFormProps {
  onCreated?: () => void;
}

export function CustomExerciseForm({ onCreated }: CustomExerciseFormProps) {
  const addCustomExercise = useExerciseStore(s => s.addCustomExercise);
  const activeProfile = useProfileStore(s => s.activeProfile);
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [category, setCategory] = useState<ExerciseCategory>('klatka');
  const [equipment, setEquipment] = useState<ExerciseEquipment>('hantle');
  const [onlyMe, setOnlyMe] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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
      ownerId: onlyMe ? activeProfile : undefined,
    });

    setName('');
    setNameEn('');
    setOnlyMe(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
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

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={onlyMe}
          onChange={e => setOnlyMe(e.target.checked)}
          className="w-4 h-4 rounded"
        />
        <span className="text-sm text-slate-400">Tylko dla mnie</span>
      </label>

      {error && <p className="text-red-400 text-sm">{error}</p>}
      {success && <p className="text-green-400 text-sm">✓ Ćwiczenie dodane!</p>}

      <Button type="submit" variant="primary" fullWidth>
        Dodaj ćwiczenie
      </Button>
    </form>
  );
}
