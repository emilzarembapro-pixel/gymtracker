import type { Workout } from '../../types';
import { useExerciseStore } from '../../stores/exerciseStore';
import { formatDurationMinutes } from '../../utils/dates';
import { getTotalVolume, getWorkoutDuration } from '../../utils/calculations';
import { PROFILES } from '../../constants/profiles';

interface WorkoutCardProps {
  workout: Workout;
  onClick: () => void;
}

function getDayAbbrev(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return new Intl.DateTimeFormat('pl-PL', { weekday: 'short' }).format(d).replace('.', '').toUpperCase().slice(0, 3);
}

function getDayNumber(dateStr: string): number {
  return new Date(dateStr + 'T12:00:00').getDate();
}

export function WorkoutCard({ workout, onClick }: WorkoutCardProps) {
  const getById = useExerciseStore(s => s.getById);

  const exerciseIds = [...new Set(workout.sets.map(s => s.exerciseId))];
  const totalVolume = getTotalVolume(workout);
  const duration = getWorkoutDuration(workout);
  const workingSets = workout.sets.filter(s => !s.isWarmup);
  const profile = PROFILES[workout.profileId];

  // Top 2 exercise names
  const exerciseNames = exerciseIds
    .slice(0, 2)
    .map(id => getById(id)?.name ?? id)
    .join(' · ');

  // Top set by weight
  const topSet = workingSets.reduce<typeof workingSets[0] | null>((best, s) => {
    if (!best || s.weightKg > best.weightKg) return s;
    return best;
  }, null);

  const topSetExerciseName = topSet ? getById(topSet.exerciseId)?.name : null;

  return (
    <button
      onClick={onClick}
      className="active:scale-[0.99] transition-transform"
      style={{
        display: 'flex', alignItems: 'stretch', gap: 12,
        padding: '12px 14px',
        borderRadius: 18,
        background: 'var(--surface)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderLeft: `3px solid ${profile.accent}`,
        width: '100%',
        textAlign: 'left',
        cursor: 'pointer',
      }}
    >
      {/* Left date column */}
      <div style={{ width: 40, textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.42)', textTransform: 'uppercase' }}>
          {getDayAbbrev(workout.date)}
        </div>
        <div style={{ fontSize: 17, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: '#FAFAFA' }}>
          {getDayNumber(workout.date)}
        </div>
      </div>

      {/* Vertical divider */}
      <span style={{ width: 1, background: 'rgba(255,255,255,0.07)', alignSelf: 'stretch' }} />

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Row 1: exercise names */}
        <div style={{ fontSize: 15, fontWeight: 700, color: '#FAFAFA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {exerciseNames}
        </div>
        {/* Row 2: stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'rgba(255,255,255,0.42)' }}>
          <span style={{ fontWeight: 600, color: profile.accent }}>{profile.fullName}</span>
          {duration > 0 && (
            <>
              <span>·</span>
              <span>{formatDurationMinutes(duration)}</span>
            </>
          )}
          {totalVolume > 0 && (
            <>
              <span>·</span>
              <span>{totalVolume.toLocaleString('pl-PL')} kg</span>
            </>
          )}
          <span>·</span>
          <span>{workingSets.length} serii</span>
        </div>
        {/* Row 3: top set */}
        {topSet && topSetExerciseName && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
            <svg viewBox="0 0 24 24" width={11} height={11} fill="none" stroke="rgba(255,255,255,0.42)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 4h8v4a4 4 0 01-8 0V4zM6 5H4v2a3 3 0 003 3M18 5h2v2a3 3 0 01-3 3M10 14h4v3l1 3H9l1-3v-3z"/>
            </svg>
            <span style={{ color: 'rgba(255,255,255,0.62)' }}>
              {topSetExerciseName} {topSet.weightKg}kg × {topSet.reps}
            </span>
          </div>
        )}
      </div>

      {/* Right chevron */}
      <div style={{ display: 'flex', alignItems: 'center', alignSelf: 'center' }}>
        <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="rgba(255,255,255,0.20)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </div>
    </button>
  );
}
