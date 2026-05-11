import { useState, useCallback } from 'react';
import { useWorkoutStore } from '../../stores/workoutStore';
import { useExerciseStore } from '../../stores/exerciseStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useProfileStore } from '../../stores/profileStore';
import { usePRCheck } from '../../hooks/usePRCheck';
import { useLongPress } from '../../hooks/useLongPress';
import { LastWorkoutPanel } from './LastWorkoutPanel';
import { ProgressRing } from '../ui/ProgressRing';
import { HAPTIC } from '../../utils/haptics';
import type { WorkoutSet } from '../../types';

interface SetLoggerProps {
  exerciseId: string;
  onTimerStart?: (duration: number) => void;
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

export function SetLogger({ exerciseId, onTimerStart, targetReps, targetWeightKg, targetSets }: SetLoggerProps) {
  const activeWorkout = useWorkoutStore(s => s.activeWorkout);
  const addSet = useWorkoutStore(s => s.addSet);
  const updateSet = useWorkoutStore(s => s.updateSet);
  const exercises = useExerciseStore(s => s.exercises);
  const activeProfile = useProfileStore(s => s.activeProfile);
  const timerEnabled = useSettingsStore(s => s.timerEnabled[activeProfile]);
  const timerDuration = useSettingsStore(s => s.timerDuration[activeProfile]);
  const checkPR = usePRCheck();

  const exercise = exercises.find(e => e.id === exerciseId);

  const setsForExercise = activeWorkout?.sets.filter(s => s.exerciseId === exerciseId) ?? [];
  const workingSets = setsForExercise.filter(s => !s.isWarmup);
  const workingSetsCount = workingSets.length;

  const [weightKg, setWeightKg] = useState(20);
  const [weightStr, setWeightStr] = useState('20');
  const [reps, setReps] = useState(10);
  const [repsStr, setRepsStr] = useState('10');
  const [isWarmup, setIsWarmup] = useState(false);
  const [error, setError] = useState('');
  const [editSet, setEditSet] = useState<WorkoutSet | null>(null);
  const [editWeight, setEditWeight] = useState('');
  const [editReps, setEditReps] = useState('');

  const incrementWeight = useCallback((amount: number) => {
    setWeightKg(w => {
      const next = Math.max(0, Math.round((w + amount) * 4) / 4);
      setWeightStr(String(next));
      return next;
    });
  }, []);

  const weightLongPress = useLongPress(() => incrementWeight(10));
  const weightMinusLongPress = useLongPress(() => incrementWeight(-10));

  const incrementReps = useCallback((amount: number) => {
    setReps(r => {
      const next = Math.max(1, r + amount);
      setRepsStr(String(next));
      return next;
    });
  }, []);

  const repsLongPress = useLongPress(() => incrementReps(4));
  const repsMinusLongPress = useLongPress(() => incrementReps(-4));

  const handleSave = () => {
    if (weightKg <= 0 && !isWarmup) {
      setError('Wpisz ciężar większy niż 0');
      return;
    }
    if (reps <= 0) {
      setError('Wpisz liczbę powtórzeń');
      return;
    }
    setError('');

    const setNumber = setsForExercise.length + 1;
    const newSet = addSet({ exerciseId, setNumber, weightKg, reps, isWarmup });

    checkPR(newSet);
    HAPTIC.medium();

    if (!isWarmup && timerEnabled && onTimerStart) {
      onTimerStart(timerDuration);
    }

    setReps(10);
    setRepsStr('10');
    setIsWarmup(false);
  };

  if (!exercise) return null;

  // Series dots
  const totalDots = Math.max(workingSetsCount + 1, setsForExercise.length + 1);
  const dotsToShow = Math.min(totalDots, 4);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Small progress ring — only with a plan (targetSets known) */}
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
              onClick={doneSet ? () => { setEditSet(doneSet); setEditWeight(String(doneSet.weightKg)); setEditReps(String(doneSet.reps)); } : undefined}
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

      {/* Last workout panel */}
      <LastWorkoutPanel exerciseId={exerciseId} profileId={activeProfile} />

      {/* Two-tile grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {/* KG tile */}
        <div style={{
          borderRadius: 22, padding: 14,
          background: 'linear-gradient(180deg, var(--soft) 0%, var(--surface) 100%)',
          border: '1px solid rgba(var(--accent-rgb), 0.25)',
          boxShadow: '0 0 0 4px var(--soft)',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--accent)' }}>KG</span>
            <span style={{ fontSize: 10, color: targetWeightKg ? 'var(--accent)' : 'rgba(255,255,255,0.42)' }}>
              {targetWeightKg ? `cel: ${targetWeightKg} kg` : '— kg'}
            </span>
          </div>
          <input
            type="number"
            inputMode="decimal"
            step={2.5}
            value={weightStr}
            onChange={e => {
              setWeightStr(e.target.value);
              const parsed = parseFloat(e.target.value);
              if (!isNaN(parsed)) setWeightKg(Math.max(0, parsed));
            }}
            onBlur={() => {
              const parsed = parseFloat(weightStr);
              const val = isNaN(parsed) ? 0 : Math.max(0, parsed);
              setWeightKg(val);
              setWeightStr(String(val));
            }}
            style={{
              width: '100%', textAlign: 'center',
              fontSize: 52, fontWeight: 900,
              background: 'transparent', border: 'none', outline: 'none',
              color: '#FAFAFA', lineHeight: 1,
              padding: '8px 0 6px',
              fontVariantNumeric: 'tabular-nums',
              caretColor: 'var(--accent)',
            }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button
              onClick={() => incrementWeight(-2.5)}
              {...weightMinusLongPress}
              style={{
                flex: 1, height: 52, borderRadius: 16,
                background: 'var(--surface3)', border: 'none',
                color: '#FAFAFA', fontSize: 24, fontWeight: 700,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >−</button>
            <button
              onClick={() => incrementWeight(2.5)}
              {...weightLongPress}
              style={{
                flex: 1, height: 52, borderRadius: 16,
                background: 'var(--accent)', border: 'none',
                color: '#fff', fontSize: 24, fontWeight: 700,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >+</button>
          </div>
        </div>

        {/* POWT tile */}
        <div style={{
          borderRadius: 22, padding: 14,
          background: 'linear-gradient(180deg, var(--soft) 0%, var(--surface) 100%)',
          border: '1px solid rgba(var(--accent-rgb), 0.25)',
          boxShadow: '0 0 0 4px var(--soft)',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--accent)' }}>POWT.</span>
            <span style={{ fontSize: 10, color: targetReps ? 'var(--accent)' : 'rgba(255,255,255,0.42)' }}>
              {targetReps ? `cel: ${targetReps}` : 'cel: —'}
            </span>
          </div>
          <input
            type="number"
            inputMode="numeric"
            step={1}
            value={repsStr}
            onChange={e => {
              setRepsStr(e.target.value);
              const parsed = parseInt(e.target.value, 10);
              if (!isNaN(parsed) && parsed > 0) setReps(parsed);
            }}
            onBlur={() => {
              const parsed = parseInt(repsStr, 10);
              const val = isNaN(parsed) || parsed < 1 ? 1 : parsed;
              setReps(val);
              setRepsStr(String(val));
            }}
            style={{
              width: '100%', textAlign: 'center',
              fontSize: 52, fontWeight: 900,
              background: 'transparent', border: 'none', outline: 'none',
              color: '#FAFAFA', lineHeight: 1,
              padding: '8px 0 6px',
              fontVariantNumeric: 'tabular-nums',
              caretColor: 'var(--accent)',
            }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button
              onClick={() => incrementReps(-1)}
              {...repsMinusLongPress}
              style={{
                flex: 1, height: 52, borderRadius: 16,
                background: 'var(--surface3)', border: 'none',
                color: '#FAFAFA', fontSize: 24, fontWeight: 700,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >−</button>
            <button
              onClick={() => incrementReps(1)}
              {...repsLongPress}
              style={{
                flex: 1, height: 52, borderRadius: 16,
                background: 'var(--accent)', border: 'none',
                color: '#fff', fontSize: 24, fontWeight: 700,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >+</button>
          </div>
        </div>
      </div>

      {/* 1RM estimate */}
      {weightKg > 0 && reps > 1 && (
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

      {/* Quick chips row */}
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

      {/* Warmup toggle */}
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

      {error && (
        <p style={{ color: '#f87171', fontSize: 14, textAlign: 'center', fontWeight: 500 }}>{error}</p>
      )}

      {/* Save button */}
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--accent)' }}>KG</span>
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
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--accent)' }}>POWT.</span>
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
                  const w = parseFloat(editWeight);
                  const r = parseInt(editReps, 10);
                  if (!isNaN(w) && !isNaN(r) && r > 0) {
                    updateSet(editSet.id, { weightKg: Math.max(0, w), reps: Math.max(1, r) });
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
