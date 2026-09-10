import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { PRType, ProfileId } from '../../types';
import { useHistoryStore } from '../../stores/historyStore';
import { usePRStore } from '../../stores/prStore';
import { epley1RM, calcVolume } from '../../utils/calculations';
import { formatDateShort } from '../../utils/dates';

interface ExerciseChartProps {
  exerciseId: string;
  profileId: ProfileId;
  metric: PRType;
}

function getMetricValue(metric: PRType, weightKg: number, reps: number): number {
  switch (metric) {
    case 'maxWeight': return weightKg;
    case 'maxVolume': return calcVolume(weightKg, reps);
    case '1rm': return epley1RM(weightKg, reps);
    case 'maxReps': return reps;
    case 'maxTime': return reps;
  }
}

interface ChartPoint {
  date: string;
  value: number;
  isPR: boolean;
}

interface CustomDotProps {
  cx?: number;
  cy?: number;
  payload?: ChartPoint;
}

function CustomDot({ cx = 0, cy = 0, payload }: CustomDotProps) {
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#3b82f6';
  if (!payload?.isPR) {
    return <circle cx={cx} cy={cy} r={3} fill={accent} stroke="none" />;
  }
  return (
    <text x={cx} y={cy - 6} textAnchor="middle" fontSize="14" fill="#facc15">
      ★
    </text>
  );
}

export function ExerciseChart({ exerciseId, profileId, metric }: ExerciseChartProps) {
  const workouts = useHistoryStore(s => s.workouts[profileId]);
  const allPRs = usePRStore(s => s.prs[profileId]);

  const data = useMemo((): ChartPoint[] => {
    const prDates = new Set(
      allPRs.filter(p => p.exerciseId === exerciseId).map(p => p.date),
    );

    const byDate = new Map<string, number>();
    for (const workout of workouts) {
      const setsForExercise = workout.sets.filter(
        s => s.exerciseId === exerciseId && !s.isWarmup,
      );
      if (setsForExercise.length === 0) continue;
      const best = Math.max(
        ...setsForExercise.map(s => getMetricValue(metric, s.weightKg, s.reps)),
      );
      const existing = byDate.get(workout.date) ?? 0;
      if (best > existing) byDate.set(workout.date, best);
    }

    return Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({
        date,
        value: Math.round(value * 10) / 10,
        isPR: prDates.has(date),
      }));
  }, [exerciseId, metric, workouts, allPRs]);

  if (data.length === 0) {
    return (
      <div className="h-60 w-full flex items-center justify-center text-slate-500 text-sm">
        Brak danych dla tego ćwiczenia
      </div>
    );
  }

  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#3b82f6';

  const formatXAxis = (dateStr: string) => {
    const [, month, day] = dateStr.split('-');
    return month && day ? `${parseInt(day, 10)}.${parseInt(month, 10)}` : dateStr;
  };

  const yLabel = metric === 'maxVolume' ? 'kg vol.' : 'kg';
  const metricLabel = metric === '1rm' ? 'Szac. 1RM' : metric === 'maxWeight' ? 'Max ciężar' : 'Objętość';

  return (
    <div className="h-60 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 16, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="date"
            tickFormatter={formatXAxis}
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
            formatter={(value: unknown) => [`${value as number} ${yLabel}`, metricLabel]}
            labelFormatter={(label: unknown) => formatDateShort(String(label))}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={accent}
            strokeWidth={2}
            dot={<CustomDot />}
            activeDot={{ r: 5, fill: accent }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
