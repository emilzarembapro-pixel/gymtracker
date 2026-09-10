import { useRef, useState } from 'react';
import { useWorkoutStore } from '../../stores/workoutStore';
import { useExerciseStore } from '../../stores/exerciseStore';
import { usePRCheck } from '../../hooks/usePRCheck';
import { ExercisePicker } from './ExercisePicker';
import { parseTimeToSeconds, formatSecondsToTime } from '../../utils/calculations';
import type { Exercise, ExerciseTrackBy, WorkoutSet } from '../../types';

interface WorkoutEditorProps {
  onClose: () => void;
  onGoToExercise: (exerciseId: string) => void;
}

function setValue(set: WorkoutSet, trackBy: ExerciseTrackBy): string {
  if (trackBy === 'time') return formatSecondsToTime(set.reps);
  if (trackBy === 'reps-only') return `${set.reps} powt.`;
  return `${set.weightKg} kg × ${set.reps}`;
}

const labelStyle = { fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--accent)' } as const;
const inputStyle = {
  width: '100%', minWidth: 0, padding: '10px', borderRadius: 12, textAlign: 'center' as const,
  background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
  color: '#FAFAFA', fontSize: 22, fontWeight: 800, outline: 'none',
  caretColor: 'var(--accent)', boxSizing: 'border-box' as const,
};

function EditSetModal({
  set,
  trackBy,
  onClose,
  onSave,
  onDelete,
}: {
  set: WorkoutSet;
  trackBy: ExerciseTrackBy;
  onClose: () => void;
  onSave: (patch: Partial<WorkoutSet>) => void;
  onDelete: () => void;
}) {
  const [weight, setWeight] = useState(String(set.weightKg));
  const [reps, setReps] = useState(String(set.reps));
  const [time, setTime] = useState(formatSecondsToTime(set.reps));
  const [isWarmup, setIsWarmup] = useState(set.isWarmup);

  const save = () => {
    if (trackBy === 'time') {
      const sec = parseTimeToSeconds(time);
      if (sec > 0) onSave({ weightKg: 0, reps: sec, isWarmup });
    } else if (trackBy === 'reps-only') {
      const r = parseInt(reps, 10);
      if (!isNaN(r) && r > 0) onSave({ weightKg: 0, reps: r, isWarmup });
    } else {
      const w = parseFloat(weight);
      const r = parseInt(reps, 10);
      if (!isNaN(w) && !isNaN(r) && r > 0) onSave({ weightKg: Math.max(0, w), reps: Math.max(1, r), isWarmup });
    }
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 11000,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--surface)', borderRadius: 24, padding: 24, width: '100%', maxWidth: 340,
          border: '1px solid rgba(255,255,255,0.1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontSize: 16, fontWeight: 800, color: '#FAFAFA', marginBottom: 16 }}>Edytuj serię</div>

        {trackBy === 'weight-reps' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 12, marginBottom: 16 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
              <span style={labelStyle}>KG</span>
              <input type="number" inputMode="decimal" value={weight} onChange={e => setWeight(e.target.value)} style={inputStyle} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
              <span style={labelStyle}>POWT.</span>
              <input type="number" inputMode="numeric" value={reps} onChange={e => setReps(e.target.value)} style={inputStyle} />
            </label>
          </div>
        )}
        {trackBy === 'reps-only' && (
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0, marginBottom: 16 }}>
            <span style={labelStyle}>POWT.</span>
            <input type="number" inputMode="numeric" value={reps} onChange={e => setReps(e.target.value)} style={inputStyle} />
          </label>
        )}
        {trackBy === 'time' && (
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0, marginBottom: 16 }}>
            <span style={labelStyle}>CZAS (mm:ss)</span>
            <input type="text" inputMode="numeric" value={time} onChange={e => setTime(e.target.value)} style={inputStyle} />
          </label>
        )}

        <button
          onClick={() => setIsWarmup(v => !v)}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 14, marginBottom: 16,
            background: isWarmup ? 'rgba(249,115,22,0.12)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${isWarmup ? 'rgba(249,115,22,0.35)' : 'rgba(255,255,255,0.08)'}`,
            color: isWarmup ? '#fb923c' : 'rgba(255,255,255,0.38)',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}
        >
          {isWarmup ? 'Rozgrzewkowa' : 'Seria robocza'}
        </button>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => { onDelete(); onClose(); }}
            style={{
              flex: 1, height: 48, borderRadius: 14, border: '1px solid rgba(220,38,38,0.4)',
              background: 'rgba(220,38,38,0.1)', color: '#f87171',
              fontSize: 15, fontWeight: 600, cursor: 'pointer',
            }}
          >Usuń</button>
          <button
            onClick={save}
            style={{
              flex: 2, height: 48, borderRadius: 14, border: 'none',
              background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
              color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
            }}
          >Zapisz</button>
        </div>
      </div>
    </div>
  );
}

export function WorkoutEditor({ onClose, onGoToExercise }: WorkoutEditorProps) {
  const activeWorkout = useWorkoutStore(s => s.activeWorkout);
  const updateSet = useWorkoutStore(s => s.updateSet);
  const deleteSet = useWorkoutStore(s => s.deleteSet);
  const addSet = useWorkoutStore(s => s.addSet);
  const renameWorkout = useWorkoutStore(s => s.renameWorkout);
  const getById = useExerciseStore(s => s.getById);
  const checkPR = usePRCheck();

  const [editing, setEditing] = useState<{ set: WorkoutSet; trackBy: ExerciseTrackBy } | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [name, setName] = useState(activeWorkout?.name ?? '');
  // A set added here is a copy of the last one — its PR is checked once the
  // user is done with it, so an edited or deleted set never leaves a stale PR.
  const pendingPRRef = useRef<WorkoutSet | null>(null);

  if (!activeWorkout) return null;

  const exerciseIds = [...new Set(activeWorkout.sets.map(s => s.exerciseId))];

  const handleAddSet = (exerciseId: string) => {
    const exSets = activeWorkout.sets.filter(s => s.exerciseId === exerciseId);
    const last = exSets[exSets.length - 1];
    const trackBy = getById(exerciseId)?.trackBy ?? 'weight-reps';
    const created = addSet({
      exerciseId,
      weightKg: last?.weightKg ?? 0,
      reps: last?.reps ?? (trackBy === 'time' ? 30 : 1),
      isWarmup: false,
    });
    pendingPRRef.current = created;
    setEditing({ set: created, trackBy });
  };

  const handleAddExercise = (exercise: Exercise) => {
    setShowPicker(false);
    handleAddSet(exercise.id);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10500,
      background: 'var(--bg-base, #0A0A0A)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: 'calc(env(safe-area-inset-top, 0px) + 14px) 16px 12px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      }}>
        <div style={{ fontSize: 17, fontWeight: 900, color: '#FAFAFA' }}>Edytuj trening</div>
        <button
          onClick={onClose}
          style={{
            padding: '8px 16px', borderRadius: 12, cursor: 'pointer',
            background: 'rgba(var(--accent-rgb),0.12)', border: '1px solid rgba(var(--accent-rgb),0.3)',
            color: 'var(--accent)', fontSize: 14, fontWeight: 700,
          }}
        >Gotowe</button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 40px' }}>
        {/* Workout name */}
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.42)' }}>
            NAZWA TRENINGU
          </span>
          <input
            type="text"
            value={name}
            placeholder="Bez nazwy"
            onChange={e => setName(e.target.value)}
            onBlur={() => renameWorkout(name)}
            style={{
              width: '100%', minWidth: 0, boxSizing: 'border-box',
              padding: '12px 14px', borderRadius: 14,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              color: '#FAFAFA', fontSize: 15, fontWeight: 600, outline: 'none',
              caretColor: 'var(--accent)',
            }}
          />
        </label>

        {exerciseIds.length === 0 && (
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>
            Brak zapisanych serii w tym treningu.
          </p>
        )}

        {exerciseIds.map(exId => {
          const exercise = getById(exId);
          const trackBy: ExerciseTrackBy = exercise?.trackBy ?? 'weight-reps';
          const exSets = activeWorkout.sets.filter(s => s.exerciseId === exId);
          let warmupNo = 0;
          let workingNo = 0;

          return (
            <div key={exId} style={{
              borderRadius: 18, marginBottom: 14, overflow: 'hidden',
              background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.07)',
            }}>
              <div style={{
                padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#FAFAFA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {exercise?.nameEn ?? exId}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', marginTop: 1 }}>{exercise?.name}</div>
                </div>
                <button
                  onClick={() => onGoToExercise(exId)}
                  style={{
                    flexShrink: 0, padding: '6px 12px', borderRadius: 10, cursor: 'pointer',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.62)', fontSize: 12, fontWeight: 600,
                  }}
                >Przejdź</button>
              </div>

              <div>
                {exSets.map(set => {
                  const label = set.isWarmup ? `R${++warmupNo}` : `S${++workingNo}`;
                  return (
                    <button
                      key={set.id}
                      onClick={() => setEditing({ set, trackBy })}
                      style={{
                        width: '100%', textAlign: 'left', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '11px 14px', background: 'none',
                        border: 'none', borderTop: '1px solid rgba(255,255,255,0.04)',
                      }}
                    >
                      <span style={{
                        width: 28, fontSize: 11, fontWeight: 800,
                        color: set.isWarmup ? '#fb923c' : 'rgba(255,255,255,0.42)',
                      }}>{label}</span>
                      <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#FAFAFA', fontVariantNumeric: 'tabular-nums' }}>
                        {setValue(set, trackBy)}
                      </span>
                      {set.isPR && <span style={{ fontSize: 11, fontWeight: 800, color: '#FBBF24' }}>PR</span>}
                      <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
                      </svg>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handleAddSet(exId)}
                style={{
                  width: '100%', padding: '11px', cursor: 'pointer',
                  background: 'rgba(var(--accent-rgb),0.06)', border: 'none',
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  color: 'var(--accent)', fontSize: 13, fontWeight: 700,
                }}
              >+ Dodaj serię</button>
            </div>
          );
        })}

        <button
          onClick={() => setShowPicker(v => !v)}
          style={{
            width: '100%', padding: '12px', borderRadius: 14, cursor: 'pointer',
            background: 'none', border: '1px dashed rgba(255,255,255,0.14)',
            color: 'rgba(255,255,255,0.42)', fontSize: 13, fontWeight: 600,
          }}
        >{showPicker ? '↑ Zwiń wybór' : '+ Dodaj ćwiczenie do treningu'}</button>

        {showPicker && (
          <div style={{ marginTop: 12 }}>
            <ExercisePicker onSelect={handleAddExercise} />
          </div>
        )}
      </div>

      {editing && (
        <EditSetModal
          set={editing.set}
          trackBy={editing.trackBy}
          onClose={() => {
            const pending = pendingPRRef.current;
            pendingPRRef.current = null;
            if (pending && pending.id === editing.set.id) checkPR(pending);
            setEditing(null);
          }}
          onSave={patch => {
            updateSet(editing.set.id, patch);
            if (pendingPRRef.current?.id === editing.set.id) {
              pendingPRRef.current = { ...editing.set, ...patch };
            }
          }}
          onDelete={() => {
            if (pendingPRRef.current?.id === editing.set.id) pendingPRRef.current = null;
            deleteSet(editing.set.id);
          }}
        />
      )}
    </div>
  );
}
