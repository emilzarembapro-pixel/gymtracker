import { useState, useCallback } from 'react';
import { useWorkoutStore } from '../../stores/workoutStore';
import { useHistoryStore } from '../../stores/historyStore';
import { useExerciseStore } from '../../stores/exerciseStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { PROFILE_ID } from '../../constants/profiles';
import { usePRCheck } from '../../hooks/usePRCheck';
import { useLongPress } from '../../hooks/useLongPress';
import { LastWorkoutPanel } from './LastWorkoutPanel';
import { ProgressRing } from '../ui/ProgressRing';
import { HAPTIC } from '../../utils/haptics';
import { parseTimeToSeconds, formatSecondsToTime } from '../../utils/calculations';
import type { WorkoutSet, ExerciseTrackBy } from '../../types';

/** Pre-filled rep count for a fresh set. */
const DEFAULT_REPS = '7';

interface SetLoggerProps {
  exerciseId: string;
  onTimerStart?: (duration: number) => void;
  onSetSaved?: (set: WorkoutSet) => void;
  targetReps?: number;
  targetWeightKg?: number;
  targetSets?: number;
}

function FlameIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
      <path d="M12.5 2c.2 2.8-.8 4-1 6.2.8.6 1.5 2 1.5 3.3a3 3 0 01-6 0c0-2 1.3-3.3 2-4.5-.2 1.5 0 2.5.5 3 .3-2.5 1.8-5 3-8z" />
      <path d="M8 14a4 4 0 008 0c0-1.5-.7-2.8-1.5-3.8 0 1.2-.5 2.3-1.5 2.8-.2-1.5-1-3-1-4.5C10 10 8 12 8 14z" />
    </svg>
  );
}

function computeFontSize(str: string): number {
  const len = str.length;
  if (len <= 2) return 52;
  if (len === 3) return 46;
  if (len === 4) return 40;
  if (len === 5) return 34;
  if (len === 6) return 29;
  return 24;
}

export function SetLogger({ exerciseId, onTimerStart, onSetSaved, targetReps, targetWeightKg, targetSets }: SetLoggerProps) {
  const activeWorkout = useWorkoutStore(s => s.activeWorkout);
  const addSet = useWorkoutStore(s => s.addSet);
  const updateSet = useWorkoutStore(s => s.updateSet);
  const exercises = useExerciseStore(s => s.exercises);
  const timerEnabled = useSettingsStore(s => s.timerEnabled[PROFILE_ID]);
  const timerDuration = useSettingsStore(s => s.timerDuration[PROFILE_ID]);
  const checkPR = usePRCheck();

  const getLastWorkoutForExercise = useHistoryStore(s => s.getLastWorkoutForExercise);

  const exercise = exercises.find(e => e.id === exerciseId);
  const trackBy: ExerciseTrackBy = exercise?.trackBy ?? 'weight-reps';

  // Weight used in the 2nd (fallback: last) working set of the previous session
  const suggestedWeight = (() => {
    if (trackBy !== 'weight-reps') return '';
    const last = getLastWorkoutForExercise(exerciseId, PROFILE_ID);
    if (!last) return '';
    const working = last.sets.filter(s => s.exerciseId === exerciseId && !s.isWarmup);
    if (working.length === 0) return '';
    const ref = working[1] ?? working[working.length - 1];
    return ref.weightKg > 0 ? String(ref.weightKg) : '';
  })();

  const setsForExercise = activeWorkout?.sets.filter(s => s.exerciseId === exerciseId) ?? [];
  const workingSets = setsForExercise.filter(s => !s.isWarmup);
  const workingSetsCount = workingSets.length;

  const [weightStr, setWeightStr] = useState(suggestedWeight);
  const [repsStr, setRepsStr] = useState(DEFAULT_REPS);
  const [timeStr, setTimeStr] = useState('');
  const [isWarmup, setIsWarmup] = useState(false);
  const [error, setError] = useState('');
  const [editSet, setEditSet] = useState<WorkoutSet | null>(null);
  const [editWeight, setEditWeight] = useState('');
  const [editReps, setEditReps] = useState('');
  const [editTime, setEditTime] = useState('');
  const [prevExerciseId, setPrevExerciseId] = useState(exerciseId);

  if (exerciseId !== prevExerciseId) {
    setPrevExerciseId(exerciseId);
    setWeightStr(suggestedWeight);
    setRepsStr(DEFAULT_REPS);
    setTimeStr('');
    setIsWarmup(false);
    setError('');
  }

  const weightKg = parseFloat(weightStr) || 0;
  const reps = parseInt(repsStr, 10) || 0;
  const timeSec = parseTimeToSeconds(timeStr);

  const incrementWeight = useCallback((amount: number) => {
    setWeightStr(prev => {
      const current = parseFloat(prev) || 0;
      const next = Math.max(0, Math.round((current + amount) * 4) / 4);
      return String(next);
    });
  }, []);

  const incrementReps = useCallback((amount: number) => {
    setRepsStr(prev => {
      const current = parseInt(prev, 10) || 0;
      const next = Math.max(0, current + amount);
      return next === 0 ? '' : String(next);
    });
  }, []);

  const incrementTime = useCallback((amount: number) => {
    setTimeStr(prev => {
      const current = parseTimeToSeconds(prev);
      const next = Math.max(0, current + amount);
      return next === 0 ? '' : formatSecondsToTime(next);
    });
  }, []);

  const weightLongPress = useLongPress(() => incrementWeight(10));
  const weightMinusLongPress = useLongPress(() => incrementWeight(-10));
  const repsLongPress = useLongPress(() => incrementReps(4));
  const repsMinusLongPress = useLongPress(() => incrementReps(-4));

  const handleSave = () => {
    if (trackBy === 'time') {
      if (timeSec <= 0) {
        setError('Wpisz czas trwania');
        return;
      }
    } else if (reps <= 0) {
      setError(trackBy === 'reps-only' ? 'Wpisz liczbę powtórzeń' : 'Wpisz liczbę powtórzeń');
      return;
    }
    setError('');

    const newSet = trackBy === 'time'
      ? addSet({ exerciseId, weightKg: 0, reps: timeSec, isWarmup })
      : trackBy === 'reps-only'
        ? addSet({ exerciseId, weightKg: 0, reps, isWarmup })
        : addSet({ exerciseId, weightKg, reps, isWarmup });

    checkPR(newSet);
    HAPTIC.medium();
    onSetSaved?.(newSet);

    if (!isWarmup && timerEnabled && onTimerStart) {
      onTimerStart(timerDuration);
    }

    // Keep the weight for the next set — reps go back to the default, time clears
    setRepsStr(DEFAULT_REPS);
    setTimeStr('');
    setIsWarmup(false);
  };

  if (!exercise) return null;

  const totalDots = Math.max(workingSetsCount + 1, setsForExercise.length + 1);
  const dotsToShow = Math.min(totalDots, 4);

  const startEdit = (set: WorkoutSet) => {
    setEditSet(set);
    setEditWeight(String(set.weightKg));
    setEditReps(String(set.reps));
    setEditTime(formatSecondsToTime(set.reps));
  };

  const tileStyle = {
    borderRadius: 22, padding: 14, minWidth: 0, overflow: 'hidden' as const,
    background: 'linear-gradient(180deg, var(--soft) 0%, var(--surface) 100%)',
    border: '1px solid rgba(var(--accent-rgb), 0.25)',
    boxShadow: '0 0 0 4px var(--soft)',
    display: 'flex', flexDirection: 'column' as const,
  };

  const numberInputStyle = {
    width: '100%', minWidth: 0, maxWidth: '100%', boxSizing: 'border-box' as const,
    textAlign: 'center' as const,
    fontWeight: 900,
    background: 'transparent', border: 'none', outline: 'none',
    color: '#FAFAFA', lineHeight: 1,
    padding: '8px 0 6px',
    fontVariantNumeric: 'tabular-nums' as const,
    caretColor: 'var(--accent)',
  };

  const minusButtonStyle = {
    flex: 1, height: 52, borderRadius: 16,
    background: 'var(--surface3)', border: 'none',
    color: '#FAFAFA', fontSize: 24, fontWeight: 700,
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  };

  const plusButtonStyle = {
    flex: 1, height: 52, borderRadius: 16,
    background: 'var(--accent)', border: 'none',
    color: '#fff', fontSize: 24, fontWeight: 700,
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  };

  const labelRowStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 } as const;
  const labelStyle = { fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--accent)' } as const;

  const saveButton = (
    <button
      onClick={handleSave}
      style={{
        height: 60, borderRadius: 20, width: '100%', border: 'none',
        background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
        boxShadow: '0 12px 30px -8px rgba(var(--accent-rgb), 0.6)',
        color: '#fff', fontSize: 17, fontWeight: 700,
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}
    >
      <span>Zapisz serię</span>
      <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12l5 5 9-9"/>
      </svg>
    </button>
  );

  const errorBlock = error ? (
    <p style={{ color: '#f87171', fontSize: 14, textAlign: 'center', fontWeight: 500 }}>{error}</p>
  ) : null;

  const warmupToggle = (
    <button
      onClick={() => setIsWarmup(!isWarmup)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        padding: '12px 16px', borderRadius: 16,
        background: isWarmup ? 'rgba(249,115,22,0.12)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${isWarmup ? 'rgba(249,115,22,0.35)' : 'rgba(255,255,255,0.08)'}`,
        color: isWarmup ? '#fb923c' : 'rgba(255,255,255,0.38)',
        fontSize: 14, fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
    >
      <FlameIcon />
      <span>Rozgrzewka</span>
    </button>
  );

  const renderKgTile = () => (
    <div style={tileStyle}>
      <div style={labelRowStyle}>
        <span style={labelStyle}>KG</span>
        <span style={{ fontSize: 10, color: targetWeightKg ? 'var(--accent)' : 'rgba(255,255,255,0.42)' }}>
          {targetWeightKg ? `cel: ${targetWeightKg} kg` : '— kg'}
        </span>
      </div>
      <input
        type="number"
        inputMode="decimal"
        step={2.5}
        value={weightStr}
        placeholder="0"
        onChange={e => setWeightStr(e.target.value)}
        style={{ ...numberInputStyle, fontSize: computeFontSize(weightStr) }}
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button onClick={() => incrementWeight(-2.5)} {...weightMinusLongPress} style={minusButtonStyle}>−</button>
        <button onClick={() => incrementWeight(2.5)} {...weightLongPress} style={plusButtonStyle}>+</button>
      </div>
    </div>
  );

  const renderRepsTile = () => (
    <div style={tileStyle}>
      <div style={labelRowStyle}>
        <span style={labelStyle}>POWT.</span>
        <span style={{ fontSize: 10, color: targetReps ? 'var(--accent)' : 'rgba(255,255,255,0.42)' }}>
          {targetReps ? `cel: ${targetReps}` : 'cel: —'}
        </span>
      </div>
      <input
        type="number"
        inputMode="numeric"
        step={1}
        value={repsStr}
        placeholder="0"
        onChange={e => setRepsStr(e.target.value)}
        style={{ ...numberInputStyle, fontSize: computeFontSize(repsStr) }}
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button onClick={() => incrementReps(-1)} {...repsMinusLongPress} style={minusButtonStyle}>−</button>
        <button onClick={() => incrementReps(1)} {...repsLongPress} style={plusButtonStyle}>+</button>
      </div>
    </div>
  );

  const renderTimeTile = () => (
    <div style={tileStyle}>
      <div style={labelRowStyle}>
        <span style={labelStyle}>CZAS</span>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.42)' }}>mm:ss</span>
      </div>
      <input
        type="text"
        inputMode="numeric"
        value={timeStr}
        placeholder="0:00"
        onChange={e => setTimeStr(e.target.value)}
        style={{ ...numberInputStyle, fontSize: computeFontSize(timeStr || '0:00') }}
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button onClick={() => incrementTime(-10)} style={minusButtonStyle}>−10s</button>
        <button onClick={() => incrementTime(10)} style={plusButtonStyle}>+10s</button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {targetSets && targetSets > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 4 }}>
          <ProgressRing
            value={workingSetsCount / targetSets}
            size={56}
            stroke={4}
            label={
              <span style={{ fontSize: 13, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: 'var(--accent)' }}>
                {workingSetsCount}/{targetSets}
              </span>
            }
          />
        </div>
      )}

      {/* Series dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, paddingTop: 4 }}>
        {Array.from({ length: dotsToShow }).map((_, i) => {
          const isDone = i < workingSetsCount;
          const isCurrent = i === workingSetsCount;
          const doneSet = isDone ? workingSets[i] : null;
          return (
            <div
              key={i}
              onClick={doneSet ? () => startEdit(doneSet) : undefined}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 32, height: 28, borderRadius: 10,
                fontSize: 11, fontWeight: 700,
                cursor: doneSet ? 'pointer' : 'default',
                ...(isDone ? {
                  background: 'rgba(34,197,94,0.15)',
                  border: '1px solid rgba(34,197,94,0.35)',
                  color: '#22c55e',
                } : isCurrent ? {
                  background: 'var(--soft)',
                  border: '1px solid rgba(var(--accent-rgb), 0.4)',
                  color: 'var(--accent)',
                } : {
                  background: 'var(--surface)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  color: 'rgba(255,255,255,0.42)',
                }),
              }}
            >
              {isDone ? (
                <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12l5 5 9-9"/>
                </svg>
              ) : (
                `${isCurrent && isWarmup ? 'R' : 'S'}${i + 1}`
              )}
            </div>
          );
        })}
      </div>

      <LastWorkoutPanel exerciseId={exerciseId} profileId={PROFILE_ID} trackBy={trackBy} />

      {/* Inputs */}
      {trackBy === 'weight-reps' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 10 }}>
          {renderKgTile()}
          {renderRepsTile()}
        </div>
      )}
      {trackBy === 'reps-only' && renderRepsTile()}
      {trackBy === 'time' && renderTimeTile()}

      {errorBlock}
      {saveButton}

      {/* 1RM estimate — only for weight-reps */}
      {trackBy === 'weight-reps' && weightKg > 0 && reps > 1 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '8px 14px', borderRadius: 12,
          background: 'var(--surface)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.38)' }}>EST. 1RM</span>
          <span style={{ fontSize: 15, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: 'var(--accent)' }}>
            {Math.round(weightKg * (1 + reps / 30) * 2) / 2} kg
          </span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>(Epley)</span>
        </div>
      )}

      {/* Quick chips */}
      {trackBy === 'weight-reps' && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
          {([-2.5, +1.25, +2.5, +5, +10] as const).map(amount => (
            <button
              key={amount}
              onClick={() => incrementWeight(amount)}
              style={{
                padding: '8px 12px', borderRadius: 12, flexShrink: 0,
                background: 'var(--surface2)',
                border: '1px solid rgba(255,255,255,0.07)',
                fontSize: 13, fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
                cursor: 'pointer',
                color: amount === 2.5 ? 'var(--accent)' : 'rgba(255,255,255,0.62)',
              }}
            >
              {amount > 0 ? `+${amount}` : amount}
            </button>
          ))}
        </div>
      )}
      {trackBy === 'time' && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
          {([15, 30, 60, 120] as const).map(amount => (
            <button
              key={amount}
              onClick={() => incrementTime(amount)}
              style={{
                padding: '8px 12px', borderRadius: 12, flexShrink: 0,
                background: 'var(--surface2)',
                border: '1px solid rgba(255,255,255,0.07)',
                fontSize: 13, fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
                cursor: 'pointer',
                color: amount === 30 ? 'var(--accent)' : 'rgba(255,255,255,0.62)',
              }}
            >
              +{amount}s
            </button>
          ))}
        </div>
      )}

      {warmupToggle}

      {/* Edit set modal */}
      {editSet && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }} onClick={() => setEditSet(null)}>
          <div style={{
            background: 'var(--surface)', borderRadius: 24, padding: 24, width: '100%', maxWidth: 340,
            border: '1px solid rgba(255,255,255,0.1)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#FAFAFA', marginBottom: 16 }}>Edytuj serię</div>
            {trackBy === 'weight-reps' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                  <span style={labelStyle}>KG</span>
                  <input
                    type="number" inputMode="decimal"
                    value={editWeight}
                    onChange={e => setEditWeight(e.target.value)}
                    style={{
                      width: '100%', padding: '10px', borderRadius: 12, textAlign: 'center',
                      background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                      color: '#FAFAFA', fontSize: 22, fontWeight: 800, outline: 'none',
                      caretColor: 'var(--accent)', boxSizing: 'border-box',
                    }}
                  />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                  <span style={labelStyle}>POWT.</span>
                  <input
                    type="number" inputMode="numeric"
                    value={editReps}
                    onChange={e => setEditReps(e.target.value)}
                    style={{
                      width: '100%', padding: '10px', borderRadius: 12, textAlign: 'center',
                      background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                      color: '#FAFAFA', fontSize: 22, fontWeight: 800, outline: 'none',
                      caretColor: 'var(--accent)', boxSizing: 'border-box',
                    }}
                  />
                </label>
              </div>
            )}
            {trackBy === 'reps-only' && (
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0, marginBottom: 16 }}>
                <span style={labelStyle}>POWT.</span>
                <input
                  type="number" inputMode="numeric"
                  value={editReps}
                  onChange={e => setEditReps(e.target.value)}
                  style={{
                    width: '100%', padding: '10px', borderRadius: 12, textAlign: 'center',
                    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                    color: '#FAFAFA', fontSize: 22, fontWeight: 800, outline: 'none',
                    caretColor: 'var(--accent)', boxSizing: 'border-box',
                  }}
                />
              </label>
            )}
            {trackBy === 'time' && (
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0, marginBottom: 16 }}>
                <span style={labelStyle}>CZAS (mm:ss)</span>
                <input
                  type="text" inputMode="numeric"
                  value={editTime}
                  onChange={e => setEditTime(e.target.value)}
                  style={{
                    width: '100%', padding: '10px', borderRadius: 12, textAlign: 'center',
                    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                    color: '#FAFAFA', fontSize: 22, fontWeight: 800, outline: 'none',
                    caretColor: 'var(--accent)', boxSizing: 'border-box',
                  }}
                />
              </label>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setEditSet(null)}
                style={{
                  flex: 1, height: 48, borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)',
                  fontSize: 15, fontWeight: 600, cursor: 'pointer',
                }}
              >Anuluj</button>
              <button
                onClick={() => {
                  if (trackBy === 'time') {
                    const sec = parseTimeToSeconds(editTime);
                    if (sec > 0) updateSet(editSet.id, { weightKg: 0, reps: sec });
                  } else if (trackBy === 'reps-only') {
                    const r = parseInt(editReps, 10);
                    if (!isNaN(r) && r > 0) updateSet(editSet.id, { weightKg: 0, reps: r });
                  } else {
                    const w = parseFloat(editWeight);
                    const r = parseInt(editReps, 10);
                    if (!isNaN(w) && !isNaN(r) && r > 0) {
                      updateSet(editSet.id, { weightKg: Math.max(0, w), reps: Math.max(1, r) });
                    }
                  }
                  setEditSet(null);
                }}
                style={{
                  flex: 2, height: 48, borderRadius: 14, border: 'none',
                  background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                  color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                }}
              >Zapisz</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
