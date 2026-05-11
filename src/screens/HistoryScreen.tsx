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

const WEEKDAYS = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];
const MONTHS_PL = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień',
];

function ClipboardIcon() {
  return (
    <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/20">
      <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M9 12h6M9 16h6" />
    </svg>
  );
}

function toDateStr(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function HistoryScreen() {
  const activeProfile = useProfileStore(s => s.activeProfile);
  const getForProfile = useHistoryStore(s => s.getForProfile);
  const deleteWorkout = useHistoryStore(s => s.deleteWorkout);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [filter, setFilter] = useState<'all' | 'emil' | 'nikola'>('all');

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

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

  const streak = useMemo(() => {
    const allWorkouts = filter === 'emil' ? emilWorkouts
      : filter === 'nikola' ? nikolaWorkouts
      : [...emilWorkouts, ...nikolaWorkouts].sort((a, b) => b.startTime - a.startTime);
    return calculateStreak(allWorkouts);
  }, [filter, emilWorkouts, nikolaWorkouts]);

  // Build calendar for viewYear/viewMonth
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    // Day of week for first day (0=Sun → convert to Mon-based 0=Mon)
    const startDow = (firstDay.getDay() + 6) % 7;
    const days: Array<{ date: string | null; hasEmil: boolean; hasNikola: boolean }> = [];
    // Leading empty cells
    for (let i = 0; i < startDow; i++) days.push({ date: null, hasEmil: false, hasNikola: false });
    // Actual days
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        date: dateStr,
        hasEmil: emilWorkouts.some(w => w.date === dateStr),
        hasNikola: nikolaWorkouts.some(w => w.date === dateStr),
      });
    }
    return days;
  }, [viewYear, viewMonth, emilWorkouts, nikolaWorkouts]);

  // Workouts for selected month
  const monthWorkouts = useMemo(() => {
    const prefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
    return filteredWorkouts.filter(w => w.date.startsWith(prefix));
  }, [filteredWorkouts, viewYear, viewMonth]);

  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const dayWorkouts = useMemo(() => {
    if (!selectedDay) return [];
    return filteredWorkouts.filter(w => w.date === selectedDay);
  }, [selectedDay, filteredWorkouts]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
    setSelectedDay(null);
  };

  const handleDelete = (workout: Workout) => {
    deleteWorkout(workout.id, workout.profileId);
    setSelectedWorkout(null);
  };

  void activeProfile;

  const todayStr = toDateStr(today);
  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();
  const isFutureMonth = new Date(viewYear, viewMonth, 1) > new Date(today.getFullYear(), today.getMonth(), 1);

  return (
    <div style={{ padding: '0 16px 16px' }}>
      {/* Top header */}
      <div style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 16,
      }}>
        <ProfileSwitch />
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>
          {streak > 0 ? `${streak} dni z rzędu` : ''}
        </span>
      </div>

      {/* Title */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.42)', marginBottom: 4 }}>
          HISTORIA
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#FAFAFA', letterSpacing: '-0.02em' }}>
          Treningi
        </h1>
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
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

      {/* Monthly calendar card */}
      <div style={{
        borderRadius: 20, padding: '14px 16px 16px',
        background: 'var(--surface)',
        border: '1px solid rgba(255,255,255,0.07)',
        marginBottom: 20,
      }}>
        {/* Month nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <button
            onClick={prevMonth}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.55)', cursor: 'pointer', padding: '4px 8px', borderRadius: 8, fontSize: 18, lineHeight: 1 }}
          >‹</button>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#FAFAFA' }}>
            {MONTHS_PL[viewMonth]} {viewYear}
          </span>
          <button
            onClick={nextMonth}
            disabled={isFutureMonth}
            style={{ background: 'none', border: 'none', color: isFutureMonth ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.55)', cursor: isFutureMonth ? 'default' : 'pointer', padding: '4px 8px', borderRadius: 8, fontSize: 18, lineHeight: 1 }}
          >›</button>
        </div>

        {/* Weekday headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
          {WEEKDAYS.map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.05em' }}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {calendarDays.map((day, i) => {
            if (!day.date) {
              return <div key={`empty-${i}`} />;
            }
            const isToday = day.date === todayStr;
            const isSelected = day.date === selectedDay;
            const hasAny = (filter === 'all' && (day.hasEmil || day.hasNikola))
              || (filter === 'emil' && day.hasEmil)
              || (filter === 'nikola' && day.hasNikola);
            const showEmil = (filter === 'all' || filter === 'emil') && day.hasEmil;
            const showNikola = (filter === 'all' || filter === 'nikola') && day.hasNikola;
            const dayNum = parseInt(day.date.split('-')[2], 10);

            return (
              <button
                key={day.date}
                onClick={() => setSelectedDay(prev => prev === day.date ? null : day.date)}
                style={{
                  aspectRatio: '1', borderRadius: 10, border: 'none',
                  background: isSelected
                    ? 'rgba(var(--accent-rgb), 0.25)'
                    : isToday
                    ? 'rgba(var(--accent-rgb), 0.1)'
                    : 'transparent',
                  outline: isSelected ? '1px solid rgba(var(--accent-rgb), 0.6)' : isToday ? '1px solid rgba(var(--accent-rgb), 0.35)' : 'none',
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                  padding: 2,
                }}
              >
                <span style={{
                  fontSize: 12, fontWeight: isToday || isSelected ? 800 : 500,
                  color: isSelected ? 'var(--accent)' : isToday ? 'var(--accent)' : 'rgba(255,255,255,0.75)',
                  lineHeight: 1,
                }}>{dayNum}</span>
                {hasAny && (
                  <div style={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                    {showEmil && (
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(59,130,246,0.85)' }} />
                    )}
                    {showNikola && (
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(244,63,94,0.85)' }} />
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 12, marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {(filter === 'all' || filter === 'emil') && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(59,130,246,0.85)' }} />
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.42)' }}>{PROFILES.emil.fullName}</span>
            </div>
          )}
          {(filter === 'all' || filter === 'nikola') && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(244,63,94,0.85)' }} />
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.42)' }}>{PROFILES.nikola.fullName}</span>
            </div>
          )}
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginLeft: 'auto' }}>
            {monthWorkouts.length} {monthWorkouts.length === 1 ? 'trening' : monthWorkouts.length < 5 ? 'treningi' : 'treningów'} w miesiącu
          </span>
        </div>
      </div>

      {/* Selected day workouts or full month list */}
      {selectedDay ? (
        dayWorkouts.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 13, padding: '20px 0' }}>
            Brak treningów w tym dniu
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.42)', marginBottom: 4 }}>
              {new Date(selectedDay + 'T12:00:00').toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}
            </div>
            {dayWorkouts.map(workout => (
              <WorkoutCard key={workout.id} workout={workout} onClick={() => setSelectedWorkout(workout)} />
            ))}
          </div>
        )
      ) : monthWorkouts.length === 0 ? (
        isCurrentMonth ? (
          <EmptyState
            icon={<ClipboardIcon />}
            title="Brak treningów"
            description="Zacznij swój pierwszy trening, żeby zobaczyć historię."
          />
        ) : (
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13, padding: '20px 0' }}>
            Brak treningów w tym miesiącu
          </p>
        )
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {monthWorkouts.map(workout => (
            <WorkoutCard key={workout.id} workout={workout} onClick={() => setSelectedWorkout(workout)} />
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
