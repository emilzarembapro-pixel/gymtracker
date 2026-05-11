import { useState, useMemo } from 'react';
import { useProfileStore } from '../stores/profileStore';
import { useHistoryStore } from '../stores/historyStore';
import { useExerciseStore } from '../stores/exerciseStore';
import { ExercisePicker } from '../components/workout/ExercisePicker';
import { ExerciseChart } from '../components/stats/ExerciseChart';
import { MetricToggle } from '../components/stats/MetricToggle';
import { Modal } from '../components/ui/Modal';
import { ProfileSwitch } from '../components/ui/ProfileSwitch';
import { calculateStreak, getTotalVolume } from '../utils/calculations';
import type { Exercise, PRType } from '../types';

type Period = '1M' | '3M' | '6M' | '1R' | 'Wsz.';

const PERIOD_DAYS: Record<Period, number | null> = {
  '1M': 30,
  '3M': 90,
  '6M': 180,
  '1R': 365,
  'Wsz.': null,
};

export function StatsScreen() {
  const activeProfile = useProfileStore(s => s.activeProfile);
  const getForProfile = useHistoryStore(s => s.getForProfile);
  const getById = useExerciseStore(s => s.getById);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [metric, setMetric] = useState<PRType>('maxWeight');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('3M');

  const selectedExercise = selectedExerciseId ? getById(selectedExerciseId) : null;

  const handleSelect = (exercise: Exercise) => {
    setSelectedExerciseId(exercise.id);
    setPickerOpen(false);
  };

  const allWorkouts = useMemo(() => getForProfile(activeProfile), [activeProfile, getForProfile]);

  const periodWorkouts = useMemo(() => {
    const days = PERIOD_DAYS[selectedPeriod];
    if (days === null) return allWorkouts;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    return allWorkouts.filter(w => w.date >= cutoffStr);
  }, [allWorkouts, selectedPeriod]);

  const stats = useMemo(() => {
    const today = new Date();

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfMonthStr = startOfMonth.toISOString().split('T')[0];
    const monthWorkouts = allWorkouts.filter(w => w.date >= startOfMonthStr);

    const totalSets = periodWorkouts.reduce((sum, w) => sum + w.sets.filter(s => !s.isWarmup).length, 0);
    const totalVolumeKg = periodWorkouts.reduce((sum, w) => sum + getTotalVolume(w), 0);
    const totalTimeMs = periodWorkouts.reduce((sum, w) => {
      if (w.endTime) return sum + (w.endTime - w.startTime);
      return sum;
    }, 0);
    const totalHours = Math.round(totalTimeMs / 3600000 * 10) / 10;
    const streak = calculateStreak(allWorkouts);

    // Top exercises in period
    const exerciseCount = new Map<string, number>();
    for (const workout of periodWorkouts) {
      const ids = new Set(workout.sets.map(s => s.exerciseId));
      for (const id of ids) {
        exerciseCount.set(id, (exerciseCount.get(id) ?? 0) + 1);
      }
    }
    const topExercises = [...exerciseCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    // Volume by muscle group
    const categoryMap: Record<string, { sets: number }> = {};
    for (const workout of periodWorkouts) {
      for (const set of workout.sets) {
        if (set.isWarmup) continue;
        const exercise = getById(set.exerciseId);
        if (!exercise) continue;
        const cat = exercise.category;
        if (!categoryMap[cat]) categoryMap[cat] = { sets: 0 };
        categoryMap[cat].sets++;
      }
    }
    const catNames: Record<string, string> = {
      klatka: 'Klatka', plecy: 'Plecy', nogi: 'Nogi',
      barki: 'Barki', biceps: 'Biceps', triceps: 'Triceps', brzuch: 'Brzuch', cardio: 'Cardio',
    };
    const muscleVolume = Object.entries(categoryMap)
      .map(([cat, data]) => ({ name: catNames[cat] ?? cat, sets: data.sets }))
      .sort((a, b) => b.sets - a.sets)
      .slice(0, 5);

    return { streak, totalSets, totalVolumeKg, totalHours, topExercises, muscleVolume, monthCount: monthWorkouts.length };
  }, [allWorkouts, periodWorkouts, getById]);

  const maxMuscleSets = stats.muscleVolume[0]?.sets ?? 1;

  return (
    <div style={{ padding: '0 16px 16px' }}>
      {/* Top header */}
      <div style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)',
        marginBottom: 16,
      }}>
        <ProfileSwitch />
      </div>

      {/* Title */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.42)', marginBottom: 4 }}>
          POSTĘPY · OSTATNIE {selectedPeriod === 'Wsz.' ? 'WSZYSTKO' : selectedPeriod}
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#FAFAFA', letterSpacing: '-0.02em' }}>
          Statystyki
        </h1>
      </div>

      {/* Period selector */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: 20,
      }}>
        {(['1M', '3M', '6M', '1R', 'Wsz.'] as Period[]).map(period => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            style={{
              padding: '8px 0', borderRadius: 10, textAlign: 'center',
              background: selectedPeriod === period ? 'var(--surface3)' : 'transparent',
              border: `1px solid ${selectedPeriod === period ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.06)'}`,
              color: selectedPeriod === period ? '#FAFAFA' : 'rgba(255,255,255,0.42)',
              fontSize: 13, fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {period}
          </button>
        ))}
      </div>

      {/* Exercise selector */}
      <button
        onClick={() => setPickerOpen(true)}
        style={{
          width: '100%', padding: '14px 16px', borderRadius: 16,
          background: 'var(--surface)',
          border: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          textAlign: 'left', cursor: 'pointer', marginBottom: 16,
        }}
      >
        <div>
          {selectedExercise ? (
            <>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#FAFAFA' }}>{selectedExercise.name}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.42)', marginTop: 2 }}>{selectedExercise.nameEn}</div>
            </>
          ) : (
            <span style={{ color: 'rgba(255,255,255,0.42)', fontSize: 14 }}>Wybierz ćwiczenie...</span>
          )}
        </div>
        <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* Chart area */}
      {selectedExerciseId && (
        <div style={{
          borderRadius: 22, padding: '16px 16px 0',
          background: 'linear-gradient(180deg, var(--soft) 0%, var(--surface) 60%)',
          border: '1px solid rgba(var(--accent-rgb), 0.2)',
          marginBottom: 20,
        }}>
          <MetricToggle value={metric} onChange={setMetric} />
          <div className="h-60 w-full" style={{ marginTop: 8 }}>
            <ExerciseChart
              exerciseId={selectedExerciseId}
              profileId={activeProfile}
              metric={metric}
            />
          </div>
        </div>
      )}

      {/* 2×2 stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Seria', value: stats.totalSets.toString(), sub: 'serie robocze' },
          { label: 'Seria z rzędu', value: stats.streak.toString(), sub: 'dni streak' },
          { label: 'Objętość', value: `${Math.round(stats.totalVolumeKg / 100) / 10}t`, sub: 'łączna masa' },
          { label: 'Czas', value: `${stats.totalHours}h`, sub: 'godzin' },
        ].map(tile => (
          <div
            key={tile.label}
            style={{
              borderRadius: 18, padding: '16px',
              background: 'var(--surface)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.42)', marginBottom: 6 }}>
              {tile.label.toUpperCase()}
            </div>
            <div style={{ fontSize: 30, fontWeight: 900, color: 'var(--accent)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
              {tile.value}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.42)', marginTop: 4 }}>
              {tile.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Volume by muscle group */}
      {stats.muscleVolume.length > 0 && (
        <div style={{
          borderRadius: 18, padding: '14px 16px',
          background: 'var(--surface)',
          border: '1px solid rgba(255,255,255,0.07)',
          marginBottom: 20,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.42)', marginBottom: 14 }}>
            PARTIE MIĘŚNIOWE
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {stats.muscleVolume.map(item => (
              <div key={item.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#FAFAFA' }}>{item.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>{item.sets} serii</span>
                </div>
                <div style={{ height: 4, borderRadius: 4, background: 'var(--surface3)' }}>
                  <div style={{
                    height: '100%', borderRadius: 4,
                    background: 'linear-gradient(90deg, var(--accent), var(--accent2))',
                    width: `${(item.sets / maxMuscleSets) * 100}%`,
                    transition: 'width 0.3s ease',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top exercises */}
      {stats.topExercises.length > 0 && (
        <div style={{
          borderRadius: 18, padding: '14px 16px',
          background: 'var(--surface)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.42)', marginBottom: 14 }}>
            TOP ĆWICZENIA
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {stats.topExercises.map(([exId, count], i) => {
              const exercise = getById(exId);
              return (
                <div key={exId} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: 8,
                    background: 'rgba(var(--accent-rgb), 0.15)',
                    color: 'var(--accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 800, flexShrink: 0,
                  }}>
                    {i + 1}
                  </span>
                  <span style={{ flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {exercise?.name ?? exId}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>{count}×</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Modal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Wybierz ćwiczenie"
      >
        <ExercisePicker onSelect={handleSelect} />
      </Modal>
    </div>
  );
}
