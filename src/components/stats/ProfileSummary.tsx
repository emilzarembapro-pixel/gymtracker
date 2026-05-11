import { useMemo } from 'react';
import type { ProfileId } from '../../types';
import { useHistoryStore } from '../../stores/historyStore';
import { useExerciseStore } from '../../stores/exerciseStore';
import { calculateStreak, getTotalVolume } from '../../utils/calculations';

interface ProfileSummaryProps {
  profileId: ProfileId;
}

export function ProfileSummary({ profileId }: ProfileSummaryProps) {
  const getForProfile = useHistoryStore(s => s.getForProfile);
  const getById = useExerciseStore(s => s.getById);

  const workouts = useMemo(() => getForProfile(profileId), [profileId, getForProfile]);

  const stats = useMemo(() => {
    const today = new Date();

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfWeekStr = startOfWeek.toISOString().split('T')[0];

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfMonthStr = startOfMonth.toISOString().split('T')[0];

    const weekWorkouts = workouts.filter(w => w.date >= startOfWeekStr);
    const monthWorkouts = workouts.filter(w => w.date >= startOfMonthStr);
    const monthVolume = monthWorkouts.reduce((sum, w) => sum + getTotalVolume(w), 0);

    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    const recentWorkouts = workouts.filter(w => w.date >= thirtyDaysAgoStr);
    const exerciseCount = new Map<string, number>();
    for (const workout of recentWorkouts) {
      const ids = new Set(workout.sets.map(s => s.exerciseId));
      for (const id of ids) {
        exerciseCount.set(id, (exerciseCount.get(id) ?? 0) + 1);
      }
    }
    const topExercises = [...exerciseCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    const streak = calculateStreak(workouts);

    return { streak, weekCount: weekWorkouts.length, monthCount: monthWorkouts.length, monthVolume, topExercises };
  }, [workouts]);

  return (
    <div className="space-y-3">
      {/* Streak */}
      <div className="glass-card p-5 text-center">
        <div
          className="text-5xl font-black tabular-nums"
          style={{ color: 'var(--accent)', transition: 'color 0.45s ease' }}
        >
          {stats.streak}
        </div>
        <div className="text-white/40 text-sm mt-1 font-medium">dni z rzędu</div>
      </div>

      {/* Weekly / Monthly */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card p-4 text-center">
          <div className="text-3xl font-black text-white tabular-nums">{stats.weekCount}</div>
          <div className="text-white/35 text-xs mt-1 leading-tight">treningi w tym tygodniu</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-3xl font-black text-white tabular-nums">{stats.monthCount}</div>
          <div className="text-white/35 text-xs mt-1 leading-tight">treningi w tym miesiącu</div>
        </div>
      </div>

      {/* Monthly volume */}
      {stats.monthVolume > 0 && (
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-black text-white tabular-nums">
            {stats.monthVolume.toLocaleString('pl-PL')} kg
          </div>
          <div className="text-white/35 text-xs mt-1">całkowita objętość w tym miesiącu</div>
        </div>
      )}

      {/* Top exercises */}
      {stats.topExercises.length > 0 && (
        <div className="glass-card p-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/35 mb-3">
            Top ćwiczenia (30 dni)
          </div>
          <div className="space-y-3">
            {stats.topExercises.map(([exId, count], i) => {
              const exercise = getById(exId);
              return (
                <div key={exId} className="flex items-center gap-3">
                  <span
                    className="w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black flex-shrink-0"
                    style={{ background: 'rgba(var(--accent-rgb), 0.15)', color: 'var(--accent)' }}
                  >
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm text-white/70 font-medium truncate">
                    {exercise?.name ?? exId}
                  </span>
                  <span className="text-xs font-bold text-white/30 tabular-nums">{count}×</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
