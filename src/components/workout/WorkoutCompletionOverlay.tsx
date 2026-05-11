import { useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import type { Workout } from '../../types';
import { playWhoosh } from '../../utils/whoosh';

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m ${totalSeconds % 60}s`;
}

interface Props {
  workout: Workout | null;
  onClose: () => void;
}

export function WorkoutCompletionOverlay({ workout, onClose }: Props) {
  const prefersReducedMotion = useReducedMotion();

  const stats = useMemo(() => {
    if (!workout) return [];
    const workingSets = workout.sets.filter(s => !s.isWarmup);
    const setsCount = workingSets.length;
    const totalKg = workingSets.reduce((sum, s) => sum + s.weightKg * s.reps, 0);
    const durationMs = (workout.endTime ?? 0) - workout.startTime;
    const maxWeight = workingSets.reduce((max, s) => Math.max(max, s.weightKg), 0);

    return [
      { label: 'SERIE', value: String(setsCount) },
      { label: 'ŁĄCZNY CIĘŻAR', value: `${Math.round(totalKg)} kg` },
      { label: 'CZAS', value: formatDuration(durationMs) },
      { label: 'MAKS. KG', value: maxWeight > 0 ? `${maxWeight} kg` : '—' },
    ];
  }, [workout]);

  useEffect(() => {
    if (!workout || prefersReducedMotion) return;
    const timers = stats.map((_, i) =>
      window.setTimeout(() => playWhoosh(), i * 200),
    );
    return () => timers.forEach(id => window.clearTimeout(id));
  }, [workout, stats, prefersReducedMotion]);

  const STAT_DELAY = 0.2;
  const TITLE_DELAY = stats.length * STAT_DELAY + 0.15;

  return (
    <AnimatePresence>
      {workout && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: '#000',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '0 24px',
            gap: 0,
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          {/* Title — drops from top after stats settle */}
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { y: '-180%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : { delay: TITLE_DELAY, type: 'spring', stiffness: 220, damping: 14 }
            }
            style={{
              fontSize: 32,
              fontWeight: 900,
              letterSpacing: '-0.03em',
              color: 'var(--accent)',
              textAlign: 'center',
              marginBottom: 28,
              lineHeight: 1.1,
              textTransform: 'uppercase',
            }}
          >
            Trening ukończony
          </motion.div>

          {/* Stats — fly in from right, staggered */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={prefersReducedMotion ? { opacity: 1 } : { x: '120%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={
                  prefersReducedMotion
                    ? { duration: 0 }
                    : { delay: i * STAT_DELAY, type: 'spring', stiffness: 160, damping: 18 }
                }
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 20px',
                  borderRadius: 18,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.14em',
                    color: 'rgba(255,255,255,0.45)',
                    textTransform: 'uppercase',
                  }}
                >
                  {stat.label}
                </span>
                <span
                  style={{
                    fontSize: 26,
                    fontWeight: 900,
                    fontVariantNumeric: 'tabular-nums',
                    color: '#FAFAFA',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {stat.value}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Dismiss hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: TITLE_DELAY + 0.6, duration: 0.4 }}
            style={{
              marginTop: 32,
              textAlign: 'center',
              fontSize: 12,
              fontWeight: 500,
              color: 'rgba(255,255,255,0.4)',
              letterSpacing: '0.06em',
            }}
          >
            Stuknij aby kontynuować
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
