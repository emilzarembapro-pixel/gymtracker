import { useState, useMemo } from 'react';
import { useHistoryStore } from '../stores/historyStore';
import { usePRStore } from '../stores/prStore';
import { useExerciseStore } from '../stores/exerciseStore';
import { StatCard } from '../components/comparison/StatCard';
import { ComparisonChart } from '../components/comparison/ComparisonChart';
import { MetricToggle } from '../components/stats/MetricToggle';
import { Modal } from '../components/ui/Modal';
import { ExercisePicker } from '../components/workout/ExercisePicker';
import { EmptyState } from '../components/ui/EmptyState';
import { PROFILES } from '../constants/profiles';
import type { Exercise, PRType } from '../types';
import { getTotalVolume } from '../utils/calculations';

function TrophyEmptyIcon() {
  return (
    <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/20">
      <path d="M6 9H4a2 2 0 01-2-2V5h4" />
      <path d="M18 9h2a2 2 0 002-2V5h-4" />
      <path d="M6 3h12v6a6 6 0 01-12 0V3z" />
      <path d="M12 15v4M8 19h8" />
    </svg>
  );
}

export function ComparisonScreen() {
  const getForProfile = useHistoryStore(s => s.getForProfile);
  const getAllForProfile = usePRStore(s => s.getAllForProfile);
  const getById = useExerciseStore(s => s.getById);

  const [metric, setMetric] = useState<PRType>('maxWeight');
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const emilWorkouts = useMemo(() => getForProfile('emil'), [getForProfile]);
  const nikolaWorkouts = useMemo(() => getForProfile('nikola'), [getForProfile]);

  const stats = useMemo(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    startOfWeek.setHours(0, 0, 0, 0);
    const weekStr = startOfWeek.toISOString().split('T')[0];

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthStr = startOfMonth.toISOString().split('T')[0];

    const emilWeek = emilWorkouts.filter(w => w.date >= weekStr).length;
    const nikolaWeek = nikolaWorkouts.filter(w => w.date >= weekStr).length;

    const emilMonth = emilWorkouts.filter(w => w.date >= monthStr).length;
    const nikolaMonth = nikolaWorkouts.filter(w => w.date >= monthStr).length;

    const emilMonthVol = emilWorkouts
      .filter(w => w.date >= monthStr)
      .reduce((sum, w) => sum + getTotalVolume(w), 0);
    const nikolaMonthVol = nikolaWorkouts
      .filter(w => w.date >= monthStr)
      .reduce((sum, w) => sum + getTotalVolume(w), 0);

    return { emilWeek, nikolaWeek, emilMonth, nikolaMonth, emilMonthVol, nikolaMonthVol };
  }, [emilWorkouts, nikolaWorkouts]);

  const prComparison = useMemo(() => {
    const emilPRs = getAllForProfile('emil');
    const nikolaPRs = getAllForProfile('nikola');
    const rows: Array<{
      exerciseId: string;
      name: string;
      emilVal: number | null;
      nikolaVal: number | null;
    }> = [];

    const allExerciseIds = new Set([
      ...emilPRs.map(p => p.exerciseId),
      ...nikolaPRs.map(p => p.exerciseId),
    ]);

    for (const exId of allExerciseIds) {
      const emilPR = emilPRs.find(p => p.exerciseId === exId && p.type === 'maxWeight');
      const nikolaPR = nikolaPRs.find(p => p.exerciseId === exId && p.type === 'maxWeight');
      rows.push({
        exerciseId: exId,
        name: getById(exId)?.name ?? exId,
        emilVal: emilPR?.value ?? null,
        nikolaVal: nikolaPR?.value ?? null,
      });
    }

    return rows;
  }, [getAllForProfile, getById]);

  const selectedExercise = selectedExerciseId ? getById(selectedExerciseId) : null;

  const handleExerciseSelect = (exercise: Exercise) => {
    setSelectedExerciseId(exercise.id);
    setPickerOpen(false);
  };

  const battles = [
    stats.emilWeek > stats.nikolaWeek,
    stats.emilMonth > stats.nikolaMonth,
    stats.emilMonthVol > stats.nikolaMonthVol,
  ];
  const eWins = battles.filter(Boolean).length;
  const nWins = battles.length - eWins;

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-black text-white">
          {PROFILES.emil.nickname} vs {PROFILES.nikola.nickname}
        </h1>
        <p className="text-sm text-white/35 mt-1">Kto jest lepszy?</p>
      </div>

      {/* VS Hero */}
      <div style={{
        borderRadius: 24, padding: '18px 18px 16px',
        background: `linear-gradient(135deg, rgba(59,130,246,0.12) 0%, transparent 38%, transparent 62%, rgba(244,63,94,0.12) 100%), var(--surface)`,
        border: '1px solid rgba(255,255,255,0.07)',
        position: 'relative', overflow: 'hidden',
        marginBottom: 16,
      }}>
        <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 12 }}>
          {/* Emil */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 64, height: 64, margin: '0 auto', borderRadius: '50%',
              overflow: 'hidden',
              boxShadow: `0 0 0 3px #0A0A0A, 0 0 0 5px rgba(59,130,246,0.4), 0 14px 28px -10px rgba(59,130,246,0.6)`,
            }}>
              <img src={PROFILES.emil.avatar} alt="Emil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ marginTop: 8, fontSize: 14, fontWeight: 700, color: '#FAFAFA' }}>{PROFILES.emil.fullName}</div>
            <div style={{ marginTop: 4, fontSize: 32, fontWeight: 800, color: '#3B82F6', letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{eWins}</div>
          </div>

          {/* VS center */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.14)',
              display: 'grid', placeItems: 'center',
              fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.42)',
            }}>VS</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.42)', fontWeight: 700, letterSpacing: '0.14em' }}>KAT.</div>
          </div>

          {/* Nikola */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 64, height: 64, margin: '0 auto', borderRadius: '50%',
              overflow: 'hidden',
              boxShadow: `0 0 0 3px #0A0A0A, 0 0 0 5px rgba(244,63,94,0.4), 0 14px 28px -10px rgba(244,63,94,0.6)`,
            }}>
              <img src={PROFILES.nikola.avatar} alt="Nikola" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ marginTop: 8, fontSize: 14, fontWeight: 700, color: '#FAFAFA' }}>{PROFILES.nikola.fullName}</div>
            <div style={{ marginTop: 4, fontSize: 32, fontWeight: 800, color: '#F43F5E', letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{nWins}</div>
          </div>
        </div>

        {/* Leader strip */}
        <div style={{
          marginTop: 14, padding: '10px 12px', borderRadius: 12,
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke={eWins > nWins ? '#3B82F6' : '#F43F5E'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 4h8v4a4 4 0 01-8 0V4zM6 5H4v2a3 3 0 003 3M18 5h2v2a3 3 0 01-3 3M10 14h4v3l1 3H9l1-3v-3z"/>
          </svg>
          <span style={{ fontSize: 12.5, color: '#FAFAFA', fontWeight: 600 }}>
            {eWins > nWins
              ? <><b style={{ color: '#3B82F6' }}>{PROFILES.emil.fullName}</b> prowadzi</>
              : eWins < nWins
              ? <><b style={{ color: '#F43F5E' }}>{PROFILES.nikola.fullName}</b> prowadzi</>
              : 'Remis'} w {Math.max(eWins, nWins)} z {eWins + nWins} kategorii
          </span>
        </div>
      </div>

      {/* Weekly stats */}
      <div>
        <h2 className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/35 mb-3">
          Ten tydzień
        </h2>
        <StatCard
          label="Treningi w tym tygodniu"
          emilValue={stats.emilWeek.toString()}
          nikolaValue={stats.nikolaWeek.toString()}
          winner={stats.emilWeek > stats.nikolaWeek ? 'emil' : stats.nikolaWeek > stats.emilWeek ? 'nikola' : undefined}
        />
      </div>

      {/* Monthly stats */}
      <div className="space-y-3">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/35">
          Ten miesiąc
        </h2>
        <StatCard
          label="Treningi w tym miesiącu"
          emilValue={stats.emilMonth.toString()}
          nikolaValue={stats.nikolaMonth.toString()}
          winner={stats.emilMonth > stats.nikolaMonth ? 'emil' : stats.nikolaMonth > stats.emilMonth ? 'nikola' : undefined}
        />
        <StatCard
          label="Objętość (kg)"
          emilValue={`${stats.emilMonthVol.toLocaleString('pl-PL')} kg`}
          nikolaValue={`${stats.nikolaMonthVol.toLocaleString('pl-PL')} kg`}
          winner={stats.emilMonthVol > stats.nikolaMonthVol ? 'emil' : stats.nikolaMonthVol > stats.emilMonthVol ? 'nikola' : undefined}
        />
      </div>

      {/* Exercise comparison chart */}
      <div>
        <h2 className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/35 mb-3">
          Porównanie ćwiczeń
        </h2>
        <button
          onClick={() => setPickerOpen(true)}
          className="w-full glass-card px-4 py-3.5 flex items-center justify-between mb-3"
        >
          <span className={selectedExercise ? 'text-white text-sm font-semibold' : 'text-white/40 text-sm'}>
            {selectedExercise?.name ?? 'Wybierz ćwiczenie...'}
          </span>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/30">
            <path d="M6 9l6 6 6-6" strokeLinecap="round" />
          </svg>
        </button>

        {selectedExerciseId && (
          <div className="space-y-3">
            <MetricToggle value={metric} onChange={setMetric} />
            <div className="glass-card p-3">
              <ComparisonChart exerciseId={selectedExerciseId} metric={metric} />
            </div>
          </div>
        )}
      </div>

      {/* PR comparison table */}
      {prComparison.length > 0 && (
        <div>
          <h2 className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/35 mb-3">
            Rekordy (Max ciężar)
          </h2>
          <div className="glass-card overflow-hidden">
            <div
              className="grid grid-cols-3 px-4 py-3 border-b"
              style={{ borderColor: 'var(--border-glass)' }}
            >
              <span className="text-[10px] font-bold uppercase tracking-wide text-white/35">Ćwiczenie</span>
              <span className="text-center text-[10px] font-bold uppercase tracking-wide" style={{ color: PROFILES.emil.accent }}>
                {PROFILES.emil.nickname}
              </span>
              <span className="text-center text-[10px] font-bold uppercase tracking-wide" style={{ color: PROFILES.nikola.accent }}>
                {PROFILES.nikola.nickname}
              </span>
            </div>
            {prComparison.map((row, idx) => (
              <div
                key={row.exerciseId}
                className="grid grid-cols-3 px-4 py-3.5 text-sm"
                style={{ borderBottom: idx < prComparison.length - 1 ? `1px solid rgba(255,255,255,0.05)` : 'none' }}
              >
                <span className="text-white/50 text-xs truncate pr-2 self-center">{row.name}</span>
                <span
                  className="text-center font-bold tabular-nums"
                  style={{
                    color: row.emilVal && row.nikolaVal
                      ? row.emilVal >= row.nikolaVal ? PROFILES.emil.accent : 'rgba(255,255,255,0.25)'
                      : row.emilVal ? PROFILES.emil.accent : 'rgba(255,255,255,0.2)',
                  }}
                >
                  {row.emilVal ? `${row.emilVal} kg` : '—'}
                </span>
                <span
                  className="text-center font-bold tabular-nums"
                  style={{
                    color: row.emilVal && row.nikolaVal
                      ? row.nikolaVal >= row.emilVal ? PROFILES.nikola.accent : 'rgba(255,255,255,0.25)'
                      : row.nikolaVal ? PROFILES.nikola.accent : 'rgba(255,255,255,0.2)',
                  }}
                >
                  {row.nikolaVal ? `${row.nikolaVal} kg` : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {prComparison.length === 0 && (
        <EmptyState
          icon={<TrophyEmptyIcon />}
          title="Brak rekordów"
          description="Zacznijcie trenować, żeby zobaczyć porównanie rekordów."
        />
      )}

      <Modal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Wybierz ćwiczenie"
      >
        <ExercisePicker onSelect={handleExerciseSelect} />
      </Modal>
    </div>
  );
}
