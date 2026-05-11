import { useHistoryStore } from '../../stores/historyStore';
import type { ProfileId } from '../../types';
import { formatRelativeDate } from '../../utils/dates';

interface LastWorkoutPanelProps {
  exerciseId: string;
  profileId: ProfileId;
}

export function LastWorkoutPanel({ exerciseId, profileId }: LastWorkoutPanelProps) {
  const getLastWorkoutForExercise = useHistoryStore(s => s.getLastWorkoutForExercise);
  const lastWorkout = getLastWorkoutForExercise(exerciseId, profileId);

  if (!lastWorkout) {
    return null;
  }

  const setsForExercise = lastWorkout.sets
    .filter(s => s.exerciseId === exerciseId)
    .slice(0, 4);

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
          {formatRelativeDate(lastWorkout.date)}
        </span>
      </div>

      {/* Set cards */}
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        {setsForExercise.map((set, i) => (
          <div
            key={set.id}
            style={{
              flex: 1, padding: '10px 0', textAlign: 'center', borderRadius: 12,
              position: 'relative',
              ...(set.isPR ? {
                background: 'rgba(var(--accent-rgb), 0.14)',
                border: '1px solid rgba(var(--accent-rgb), 0.34)',
              } : {
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.07)',
              }),
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: '#FAFAFA' }}>
              {set.weightKg}×{set.reps}
            </div>
            <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.42)', marginTop: 2 }}>S{i + 1}</div>
            {set.isPR && (
              <div style={{
                position: 'absolute', top: 4, right: 4,
                width: 14, height: 14, borderRadius: '50%',
                background: 'linear-gradient(135deg, #F59E0B, #FBBF24)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg viewBox="0 0 24 24" width={8} height={8} fill="#000">
                  <path d="M8 4h8v4a4 4 0 01-8 0V4zM6 5H4v2a3 3 0 003 3M18 5h2v2a3 3 0 01-3 3M10 14h4v3l1 3H9l1-3v-3z"/>
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
