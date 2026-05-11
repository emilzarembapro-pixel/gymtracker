import { useState } from 'react';
import type { Workout } from '../../types';
import { useExerciseStore } from '../../stores/exerciseStore';
import { useHistoryStore } from '../../stores/historyStore';
import { Button } from '../ui/Button';
import { formatDurationMinutes, formatTime } from '../../utils/dates';
import { getTotalVolume, getWorkoutDuration } from '../../utils/calculations';

interface WorkoutDetailProps {
  workout: Workout;
  onClose: () => void;
  onDelete: () => void;
}

export function WorkoutDetail({ workout, onDelete }: WorkoutDetailProps) {
  const getById = useExerciseStore(s => s.getById);
  const updateWorkout = useHistoryStore(s => s.updateWorkout);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState(workout.notes ?? '');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const exerciseIds = [...new Set(workout.sets.map(s => s.exerciseId))];
  const totalVolume = getTotalVolume(workout);
  const duration = getWorkoutDuration(workout);

  const saveNotes = () => {
    updateWorkout(workout.id, workout.profileId, { notes });
    setEditingNotes(false);
  };

  return (
    <div>
      {/* Header info */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="bg-slate-800 rounded-xl px-3 py-2 text-sm">
          <div className="text-slate-500 text-xs">Czas trwania</div>
          <div className="text-slate-200 font-medium">{duration > 0 ? formatDurationMinutes(duration) : '—'}</div>
        </div>
        <div className="bg-slate-800 rounded-xl px-3 py-2 text-sm">
          <div className="text-slate-500 text-xs">Objętość</div>
          <div className="text-slate-200 font-medium">{totalVolume.toLocaleString('pl-PL')} kg</div>
        </div>
        <div className="bg-slate-800 rounded-xl px-3 py-2 text-sm">
          <div className="text-slate-500 text-xs">Ćwiczenia</div>
          <div className="text-slate-200 font-medium">{exerciseIds.length}</div>
        </div>
        {workout.startTime && (
          <div className="bg-slate-800 rounded-xl px-3 py-2 text-sm">
            <div className="text-slate-500 text-xs">Start</div>
            <div className="text-slate-200 font-medium">{formatTime(workout.startTime)}</div>
          </div>
        )}
      </div>

      {/* Exercises grouped */}
      <div className="space-y-4 mb-4">
        {exerciseIds.map(exId => {
          const exercise = getById(exId);
          const exSets = workout.sets.filter(s => s.exerciseId === exId);
          return (
            <div key={exId} className="bg-slate-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-700">
                <div className="font-semibold text-slate-200 text-sm">{exercise?.name ?? exId}</div>
                <div className="text-xs text-slate-500">{exercise?.nameEn}</div>
              </div>
              <div className="divide-y divide-slate-700/30">
                {exSets.map((set, idx) => (
                  <div key={set.id} className="flex items-center px-4 py-2.5 gap-2">
                    <span className="text-slate-500 text-xs w-6">S{idx + 1}</span>
                    <span className={`flex-1 text-sm ${set.isWarmup ? 'text-slate-500' : 'text-slate-200'}`}>
                      {set.weightKg} kg × {set.reps} powt.
                      {set.isWarmup && <span className="text-slate-600 ml-1">(rozg.)</span>}
                    </span>
                    {set.isPR && <span className="text-yellow-400">★ PR</span>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Notes */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-400">Notatki</span>
          {!editingNotes && (
            <button
              onClick={() => setEditingNotes(true)}
              className="text-xs text-[var(--accent)]"
            >
              {notes ? 'Edytuj' : 'Dodaj'}
            </button>
          )}
        </div>
        {editingNotes ? (
          <div className="space-y-2">
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-slate-800 text-slate-200 rounded-xl p-3 text-sm resize-none h-24 outline-none focus:ring-2 ring-[var(--accent)]"
              placeholder="Napisz notatkę do treningu..."
            />
            <div className="flex gap-2">
              <Button variant="primary" size="sm" onClick={saveNotes}>Zapisz</Button>
              <Button variant="ghost" size="sm" onClick={() => setEditingNotes(false)}>Anuluj</Button>
            </div>
          </div>
        ) : (
          <p className="text-slate-500 text-sm bg-slate-800/50 rounded-xl p-3 min-h-[2.5rem]">
            {notes || <span className="italic">Brak notatek</span>}
          </p>
        )}
      </div>

      {/* Delete */}
      {confirmDelete ? (
        <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-4 space-y-3">
          <p className="text-red-300 text-sm font-medium">Na pewno usunąć ten trening?</p>
          <div className="flex gap-2">
            <Button variant="danger" size="sm" onClick={onDelete}>Tak, usuń</Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>Anuluj</Button>
          </div>
        </div>
      ) : (
        <Button variant="danger" size="sm" fullWidth onClick={() => setConfirmDelete(true)}>
          Usuń trening
        </Button>
      )}
    </div>
  );
}
