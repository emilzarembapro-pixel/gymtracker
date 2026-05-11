import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { PRType } from '../../types';
import { useHistoryStore } from '../../stores/historyStore';
import { PROFILES } from '../../constants/profiles';
import { epley1RM, calcVolume } from '../../utils/calculations';
import { formatDateShort } from '../../utils/dates';

interface ComparisonChartProps {
  exerciseId: string;
  metric: PRType;
}

function getMetricValue(metric: PRType, weightKg: number, reps: number): number {
  switch (metric) {
    case 'maxWeight': return weightKg;
    case 'maxVolume': return calcVolume(weightKg, reps);
    case '1rm': return epley1RM(weightKg, reps);
  }
}

export function ComparisonChart({ exerciseId, metric }: ComparisonChartProps) {
  const getForProfile = useHistoryStore(s => s.getForProfile);

  const data = useMemo(() => {
    const emilWorkouts = getForProfile('emil');
    const nikolaWorkouts = getForProfile('nikola');

    const byDate = new Map<string, { emil?: number; nikola?: number }>();

    for (const workout of emilWorkouts) {
      const sets = workout.sets.filter(s => s.exerciseId === exerciseId && !s.isWarmup);
      if (!sets.length) continue;
      const best = Math.max(...sets.map(s => getMetricValue(metric, s.weightKg, s.reps)));
      const existing = byDate.get(workout.date) ?? {};
      byDate.set(workout.date, { ...existing, emil: Math.max(best, existing.emil ?? 0) });
    }

    for (const workout of nikolaWorkouts) {
      const sets = workout.sets.filter(s => s.exerciseId === exerciseId && !s.isWarmup);
      if (!sets.length) continue;
      const best = Math.max(...sets.map(s => getMetricValue(metric, s.weightKg, s.reps)));
      const existing = byDate.get(workout.date) ?? {};
      byDate.set(workout.date, { ...existing, nikola: Math.max(best, existing.nikola ?? 0) });
    }

    return Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, values]) => ({
        date,
        [PROFILES.emil.nickname]: values.emil ? Math.round(values.emil * 10) / 10 : undefined,
        [PROFILES.nikola.nickname]: values.nikola ? Math.round(values.nikola * 10) / 10 : undefined,
      }));
  }, [exerciseId, metric, getForProfile]);

  if (data.length === 0) {
    return (
      <div className="h-60 flex items-center justify-center text-slate-500 text-sm">
        Brak danych do porównania
      </div>
    );
  }

  const formatX = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return `${d.getDate()}.${d.getMonth() + 1}`;
    } catch {
      return dateStr;
    }
  };

  const yLabel = metric === 'maxVolume' ? 'kg' : 'kg';

  return (
    <div className="h-60 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 16, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="date"
            tickFormatter={formatX}
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            unit={` ${yLabel}`}
            width={60}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '12px',
              color: '#f1f5f9',
              fontSize: '12px',
            }}
            labelFormatter={(label: unknown) => formatDateShort(String(label))}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px', color: '#94a3b8', paddingTop: '8px' }}
          />
          <Line
            type="monotone"
            dataKey={PROFILES.emil.nickname}
            stroke={PROFILES.emil.accent}
            strokeWidth={2}
            dot={{ r: 3, fill: PROFILES.emil.accent, stroke: 'none' }}
            activeDot={{ r: 5 }}
            connectNulls
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey={PROFILES.nikola.nickname}
            stroke={PROFILES.nikola.accent}
            strokeWidth={2}
            dot={{ r: 3, fill: PROFILES.nikola.accent, stroke: 'none' }}
            activeDot={{ r: 5 }}
            connectNulls
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
