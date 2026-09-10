import { useMemo } from 'react';
import { useHistoryStore } from '../../stores/historyStore';
import { formatSecondsToTime } from '../../utils/calculations';
import type { ExerciseTrackBy, ProfileId, WorkoutSet } from '../../types';
import { formatRelativeDate } from '../../utils/dates';

interface LastWorkoutPanelProps {
  exerciseId: string;
  profileId: ProfileId;
  trackBy?: ExerciseTrackBy;
}

function setValue(set: WorkoutSet, trackBy: ExerciseTrackBy): string {
  if (trackBy === 'time') return formatSecondsToTime(set.reps);
  if (trackBy === 'reps-only') return `×${set.reps}`;
  return `${set.weightKg}×${set.reps}`;
}

export function LastWorkoutPanel({ exerciseId, profileId, trackBy = 'weight-reps' }: LastWorkoutPanelProps) {
  const workouts = useHistoryStore(s => s.workouts[profileId]);
  const lastWorkout = useMemo(
    () => [...workouts]
      .sort((a, b) => b.startTime - a.startTime)
      .find(w => w.sets.some(s => s.exerciseId === exerciseId)) ?? null,
    [workouts, exerciseId],
  );

  if (!lastWorkout) {
    return null;
  }

  const setsForExercise = lastWorkout.sets.filter(s => s.exerciseId === exerciseId);
  if (setsForExercise.length === 0) return null;

  let warmupNo = 0;
  let workingNo = 0;

  return (
    <div style={{
      borderRadius: 18,
      background: 'var(--surface)',
      border: '1px solid rgba(255,255,255,0.07)',
      padding: '12px 14px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="rgba(255,255,255,0.42)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>
          </svg>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.42)' }}>
            POPRZEDNIO
          </span>
        </div>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.42)' }}>
          {formatRelativeDate(lastWorkout.date)} · {setsForExercise.length} serii
        </span>
      </div>

      {/* Set cards — all sets, wrapped */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(66px, 1fr))',
        gap: 6,
        marginTop: 10,
      }}>
        {setsForExercise.map(set => {
          const label = set.isWarmup ? `R${++warmupNo}` : `S${++workingNo}`;
          return (
            <div
              key={set.id}
              style={{
                padding: '8px 2px', textAlign: 'center', borderRadius: 12,
                position: 'relative', minWidth: 0,
                ...(set.isPR ? {
                  background: 'rgba(var(--accent-rgb), 0.14)',
                  border: '1px solid rgba(var(--accent-rgb), 0.34)',
                } : set.isWarmup ? {
                  background: 'rgba(249,115,22,0.06)',
                  border: '1px solid rgba(249,115,22,0.18)',
                } : {
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }),
              }}
            >
              <div style={{
                fontSize: 14, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: '#FAFAFA',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {setValue(set, trackBy)}
              </div>
              <div style={{ fontSize: 9.5, color: set.isWarmup ? 'rgba(251,146,60,0.7)' : 'rgba(255,255,255,0.42)', marginTop: 2 }}>{label}</div>
              {set.isPR && (
                <div style={{
                  position: 'absolute', top: 3, right: 3,
                  width: 12, height: 12, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #F59E0B, #FBBF24)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg viewBox="0 0 24 24" width={7} height={7} fill="#000">
                    <path d="M8 4h8v4a4 4 0 01-8 0V4zM6 5H4v2a3 3 0 003 3M18 5h2v2a3 3 0 01-3 3M10 14h4v3l1 3H9l1-3v-3z"/>
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
