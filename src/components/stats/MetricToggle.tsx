import type { PRType } from '../../types';
import { cn } from '../../utils/cn';

interface MetricToggleProps {
  value: PRType;
  onChange: (metric: PRType) => void;
}

const METRICS: Array<{ id: PRType; label: string }> = [
  { id: 'maxWeight', label: 'Max ciężar' },
  { id: 'maxVolume', label: 'Objętość' },
  { id: '1rm', label: 'Szac. 1RM' },
];

export function MetricToggle({ value, onChange }: MetricToggleProps) {
  return (
    <div
      className="flex rounded-2xl p-1 gap-1"
      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {METRICS.map(metric => (
        <button
          key={metric.id}
          onClick={() => onChange(metric.id)}
          className={cn(
            'flex-1 py-2.5 px-2 rounded-xl text-xs font-semibold transition-all',
            value === metric.id
              ? 'text-white'
              : 'text-white/35 hover:text-white/60',
          )}
          style={value === metric.id ? {
            background: 'linear-gradient(135deg, var(--accent), var(--accent-muted))',
            transition: 'background 0.45s ease',
          } : undefined}
        >
          {metric.label}
        </button>
      ))}
    </div>
  );
}
