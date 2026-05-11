import { useState, useMemo } from 'react';
import { useHistoryStore } from '../stores/historyStore';
import { useProfileStore } from '../stores/profileStore';
import { WorkoutCard } from '../components/history/WorkoutCard';
import { WorkoutDetail } from '../components/history/WorkoutDetail';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { ProfileSwitch } from '../components/ui/ProfileSwitch';
import { PROFILES } from '../constants/profiles';
import { calculateStreak } from '../utils/calculations';
import type { Workout } from '../types';

function ClipboardIcon() {
  return (
    <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/20">
      <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M9 12h6M9 16h6" />
    </svg>
  );
}

function getWeekLabel(dateStr: string): string {
  const today = new Date();
  const d = new Date(dateStr + 'T12:00:00');
  const todayMonday = new Date(today);
  todayMonday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  todayMonday.setHours(0, 0, 0, 0);
  const prevMonday = new Date(todayMonday);
  prevMonday.setDate(todayMonday.getDate() - 7);

  if (d >= todayMonday) return 'Ten tydzień';
  if (d >= prevMonday) return 'Zeszły tydzień';
  const wkStart = new Date(d);
  wkStart.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  const day = String(wkStart.getDate()).padStart(2, '0');
  const mon = String(wkStart.getMonth() + 1).padStart(2, '0');
  return `W tygodniu ${day}.${mon}`;
}

export function HistoryScreen() {
  const activeProfile = useProfileStore(s => s.activeProfile);
  const getForProfile = useHistoryStore(s => s.getForProfile);
  const deleteWorkout = useHistoryStore(s => s.deleteWorkout);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [filter, setFilter] = useState<'all' | 'emil' | 'nikola'>('all');

  const emilWorkouts = useMemo(
    () => [...getForProfile('emil')].sort((a, b) => b.startTime - a.startTime),
    [getForProfile],
  );
  const nikolaWorkouts = useMemo(
    () => [...getForProfile('nikola')].sort((a, b) => b.startTime - a.startTime),
    [getForProfile],
  );

  const filteredWorkouts = useMemo(() => {
    if (filter === 'emil') return emilWorkouts;
    if (filter === 'nikola') return nikolaWorkouts;
    return [...emilWorkouts, ...nikolaWorkouts].sort((a, b) => b.startTime - a.startTime);
  }, [filter, emilWorkouts, nikolaWorkouts]);

  const heatmapDays = useMemo(() => {
    const days: Array<{ date: string; hasEmil: boolean; hasNikola: boolean }> = [];
    const today = new Date();
    for (let i = 27; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({
        date: dateStr,
        hasEmil: emilWorkouts.some(w => w.date === dateStr),
        hasNikola: nikolaWorkouts.some(w => w.date === dateStr),
      });
    }
    return days;
  }, [emilWorkouts, nikolaWorkouts]);

  const streak = useMemo(() => {
    const allWorkouts = filter === 'emil' ? emilWorkouts
      : filter === 'nikola' ? nikolaWorkouts
      : [...emilWorkouts, ...nikolaWorkouts].sort((a, b) => b.startTime - a.startTime);
    return calculateStreak(allWorkouts);
  }, [filter, emilWorkouts, nikolaWorkouts]);

  // Group workouts by week
  const weekGroups = useMemo(() => {
    const groups: Map<string, Workout[]> = new Map();
    for (const workout of filteredWorkouts) {
      const label = getWeekLabel(workout.date);
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label)!.push(workout);
    }
    return groups;
  }, [filteredWorkouts]);

  const handleDelete = (workout: Workout) => {
    deleteWorkout(workout.id, workout.profileId);
    setSelectedWorkout(null);
  };

  void activeProfile;

  return (
    <div style={{ padding: '0 16px 16px' }}>
      {/* Top header */}
      <div style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 16,
      }}>
        <ProfileSwitch />
        <button style={{
          padding: '7px 14px', borderRadius: 999,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
          color: 'rgba(255,255,255,0.62)', fontSize: 13, fontWeight: 600,
          cursor: 'pointer',
        }}>
          Filtruj
        </button>
      </div>

      {/* Title */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.42)', marginBottom: 4 }}>
          HISTORIA
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#FAFAFA', letterSpacing: '-0.02em' }}>
          Ostatnie treningi
        </h1>
      </div>

      {/* Heatmap card */}
      <div style={{
        borderRadius: 20, padding: '14px 16px',
        background: 'var(--surface)',
        border: '1px solid rgba(255,255,255,0.07)',
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.42)' }}>
            AKTYWNOŚĆ (28 DNI)
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>
            {streak} dni z rzędu
          </span>
        </div>
        {/* 4 rows × 7 cols grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {heatmapDays.map(day => {
            const bg = day.hasEmil && day.hasNikola
              ? `linear-gradient(135deg, rgba(59,130,246,0.7) 50%, rgba(244,63,94,0.7) 50%)`
              : day.hasEmil
              ? 'rgba(59,130,246,0.65)'
              : day.hasNikola
              ? 'rgba(244,63,94,0.65)'
              : 'var(--surface3)';
            return (
              <div
                key={day.date}
                style={{
                  aspectRatio: '1', borderRadius: 5,
                  background: bg,
                }}
              />
            );
          })}
        </div>
        {/* Legend */}
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: 'rgba(59,130,246,0.65)' }} />
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.42)' }}>{PROFILES.emil.fullName}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: 'rgba(244,63,94,0.65)' }} />
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.42)' }}>{PROFILES.nikola.fullName}</span>
          </div>
        </div>
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['all', 'emil', 'nikola'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '7px 16px', borderRadius: 999,
              background: filter === f ? 'var(--surface3)' : 'transparent',
              border: `1px solid ${filter === f ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.07)'}`,
              color: filter === f ? '#FAFAFA' : 'rgba(255,255,255,0.42)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {f === 'all' ? 'Wszyscy' : PROFILES[f].fullName}
          </button>
        ))}
      </div>

      {filteredWorkouts.length === 0 ? (
        <EmptyState
          icon={<ClipboardIcon />}
          title="Brak treningów"
          description="Zacznij swój pierwszy trening, żeby zobaczyć historię."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {[...weekGroups.entries()].map(([weekLabel, workouts]) => (
            <div key={weekLabel}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 10,
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.62)', letterSpacing: '0.05em' }}>
                  {weekLabel}
                </span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.42)' }}>
                  {workouts.length} {workouts.length === 1 ? 'trening' : 'treningi'}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {workouts.map(workout => (
                  <WorkoutCard
                    key={workout.id}
                    workout={workout}
                    onClick={() => setSelectedWorkout(workout)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={!!selectedWorkout}
        onClose={() => setSelectedWorkout(null)}
        title={selectedWorkout ? `Trening — ${selectedWorkout.date}` : ''}
      >
        {selectedWorkout && (
          <WorkoutDetail
            workout={selectedWorkout}
            onClose={() => setSelectedWorkout(null)}
            onDelete={() => handleDelete(selectedWorkout)}
          />
        )}
      </Modal>
    </div>
  );
}
