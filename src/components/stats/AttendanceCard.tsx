import { useMemo } from 'react';
import { getAttendanceStats } from '../../utils/calculations';
import { formatDateShort, daysAgoISO } from '../../utils/dates';
import type { Workout } from '../../types';

function Tile({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div style={{
      borderRadius: 14, padding: '11px 13px', minWidth: 0,
      background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.05)',
    }}>
      <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.42)' }}>
        {label}
      </div>
      <div style={{
        fontSize: 22, fontWeight: 900, color: 'var(--accent)',
        fontVariantNumeric: 'tabular-nums', lineHeight: 1.2, marginTop: 2,
      }}>
        {value}
        {unit && <span style={{ fontSize: 12, fontWeight: 700, marginLeft: 3, color: 'rgba(255,255,255,0.35)' }}>{unit}</span>}
      </div>
    </div>
  );
}

interface Props {
  /** Already filtered to the selected period by the caller. */
  workouts: Workout[];
  periodLabel: string;
  /** Length of the selected period in days; null means all-time. */
  spanDays: number | null;
}

export function AttendanceCard({ workouts, periodLabel, spanDays }: Props) {
  const stats = useMemo(() => getAttendanceStats(workouts, spanDays), [workouts, spanDays]);

  const allTime = spanDays === null;
  const sinceDate = allTime ? stats.firstDate : daysAgoISO(spanDays);

  if (stats.total === 0) {
    return (
      <div style={{
        borderRadius: 20, padding: '16px', marginBottom: 20,
        background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.07)',
        fontSize: 13, color: 'rgba(255,255,255,0.35)', textAlign: 'center',
      }}>
        Brak treningów w tym okresie
      </div>
    );
  }

  return (
    <div style={{
      borderRadius: 20, padding: '16px 16px 14px', marginBottom: 20,
      background: 'linear-gradient(180deg, var(--soft) 0%, var(--surface) 70%)',
      border: '1px solid rgba(var(--accent-rgb),0.2)',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12, gap: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.42)' }}>
          {allTime ? 'FREKWENCJA · OD POCZĄTKU' : `FREKWENCJA · OSTATNIE ${periodLabel}`}
        </div>
        {sinceDate && (
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap' }}>
            od {formatDateShort(`${sinceDate}T12:00:00`)}
          </div>
        )}
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.42)' }}>
          {allTime ? 'BYŁEM NA SIŁOWNI' : 'TRENINGÓW W TYM OKRESIE'}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 40, fontWeight: 900, color: '#FAFAFA', fontVariantNumeric: 'tabular-nums', lineHeight: 1.1, letterSpacing: '-0.03em' }}>
            {stats.total}
          </span>
          {allTime && (
            <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.35)' }}>
              {stats.total === 1 ? 'raz' : 'razy'}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
        <Tile
          label="ŚR. / TYDZIEŃ"
          value={stats.perWeek === null ? '—' : stats.perWeek.toLocaleString('pl-PL')}
          unit={stats.perWeek === null ? undefined : 'x'}
        />
        <Tile
          label="ŚR. / MIESIĄC"
          value={stats.perMonth === null ? '—' : stats.perMonth.toLocaleString('pl-PL')}
          unit={stats.perMonth === null ? undefined : 'x'}
        />
        <Tile label="ŚR. DŁUGOŚĆ" value={String(stats.avgDurationMin)} unit="min" />
      </div>

      {stats.perMonth === null && (
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', marginTop: 9 }}>
          Średnie pojawią się, gdy historia obejmie {stats.perWeek === null ? 'tydzień' : 'miesiąc'}.
        </div>
      )}

      {stats.timedCount < stats.total && (
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', marginTop: 9 }}>
          Średnia liczona z {stats.timedCount} z {stats.total} treningów — reszta nie ma zapisanego czasu zakończenia.
        </div>
      )}
    </div>
  );
}
