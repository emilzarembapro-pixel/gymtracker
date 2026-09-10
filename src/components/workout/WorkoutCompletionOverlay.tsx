import { useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import type { Workout } from '../../types';
import { useExerciseStore } from '../../stores/exerciseStore';
import { formatSecondsToTime } from '../../utils/calculations';
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
  const getById = useExerciseStore(s => s.getById);

  const stats = useMemo(() => {
    if (!workout) return [];
    const workingSets = workout.sets.filter(s => !s.isWarmup);
    const totalKg = workingSets.reduce((sum, s) => sum + s.weightKg * s.reps, 0);
    const durationMs = (workout.endTime ?? 0) - workout.startTime;
    const exerciseCount = new Set(workout.sets.map(s => s.exerciseId)).size;

    return [
      { label: 'CZAS', value: formatDuration(durationMs) },
      { label: 'ĆWICZENIA', value: String(exerciseCount) },
      { label: 'SERIE ROBOCZE', value: String(workingSets.length) },
      { label: 'ŁĄCZNY CIĘŻAR', value: `${Math.round(totalKg)} kg` },
    ];
  }, [workout]);

  // Sets that set a record — one row per set: exercise, weight, reps
  const newPRs = useMemo(() => {
    if (!workout) return [];
    return workout.sets.filter(s => s.isPR).map(set => {
      const exercise = getById(set.exerciseId);
      const trackBy = exercise?.trackBy ?? 'weight-reps';
      const value = trackBy === 'time'
        ? formatSecondsToTime(set.reps)
        : trackBy === 'reps-only' || set.weightKg === 0
          ? `${set.reps} powt.`
          : `${set.weightKg} kg × ${set.reps}`;
      return { key: set.id, exerciseName: exercise?.name ?? set.exerciseId, value };
    });
  }, [workout, getById]);

  useEffect(() => {
    if (!workout || prefersReducedMotion) return;
    const timers = stats.map((_, i) =>
      window.setTimeout(() => playWhoosh(), i * 200),
    );
    return () => timers.forEach(id => window.clearTimeout(id));
  }, [workout, stats, prefersReducedMotion]);

  const STAT_DELAY = 0.2;
  const TITLE_DELAY = stats.length * STAT_DELAY + 0.15;
  const PR_DELAY = TITLE_DELAY + 0.25;

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

          {/* New records */}
          {newPRs.length > 0 && (
            <motion.div
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : { delay: PR_DELAY, duration: 0.4 }}
              style={{ marginTop: 20 }}
            >
              <div style={{
                fontSize: 11, fontWeight: 800, letterSpacing: '0.16em',
                color: '#FBBF24', textAlign: 'center', marginBottom: 10,
              }}>
                {newPRs.length === 1 ? 'NOWY REKORD' : 'NOWE REKORDY'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {newPRs.map(pr => (
                  <div
                    key={pr.key}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      gap: 12, padding: '10px 16px', borderRadius: 16,
                      background: 'rgba(251,191,36,0.08)',
                      border: '1px solid rgba(251,191,36,0.3)',
                    }}
                  >
                    <div style={{
                      minWidth: 0, fontSize: 13, fontWeight: 700, color: '#FAFAFA',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{pr.exerciseName}</div>
                    <span style={{
                      flexShrink: 0, fontSize: 15, fontWeight: 900,
                      fontVariantNumeric: 'tabular-nums', color: '#FBBF24',
                    }}>{pr.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

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
