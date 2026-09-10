import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useWorkoutStore } from '../../stores/workoutStore';
import type { NewPREvent, PRType } from '../../types';
import { HAPTIC } from '../../utils/haptics';
import { formatSecondsToTime } from '../../utils/calculations';

function getPriorityPR(events: NewPREvent[]): NewPREvent | null {
  if (events.length === 0) return null;
  const order: PRType[] = ['1rm', 'maxWeight', 'maxVolume', 'maxTime', 'maxReps'];
  for (const type of order) {
    const found = events.find(e => e.type === type);
    if (found) return found;
  }
  return events[0];
}

function formatPRMessage(event: NewPREvent): string {
  switch (event.type) {
    case '1rm':
      return `${event.exerciseName}: ~${event.value.toFixed(1)} kg (szac. 1RM)`;
    case 'maxWeight':
      return `${event.exerciseName}: ${event.value} kg`;
    case 'maxVolume':
      return `${event.exerciseName}: ${event.value} kg objętości`;
    case 'maxReps':
      return `${event.exerciseName}: ${event.value} powt.`;
    case 'maxTime':
      return `${event.exerciseName}: ${formatSecondsToTime(event.value)}`;
    default:
      return event.exerciseName;
  }
}

function TrophyIcon() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4a2 2 0 01-2-2V5h4" />
      <path d="M18 9h2a2 2 0 002-2V5h-4" />
      <path d="M6 3h12v6a6 6 0 01-12 0V3z" />
      <path d="M12 15v4" />
      <path d="M8 19h8" />
    </svg>
  );
}

export function PRToast() {
  const lastPREvents = useWorkoutStore(s => s.lastPREvents);
  const clearPREvents = useWorkoutStore(s => s.clearPREvents);

  const prEvent = getPriorityPR(lastPREvents);

  useEffect(() => {
    if (prEvent) {
      HAPTIC.prCelebration();
      const timer = setTimeout(() => {
        clearPREvents();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [prEvent, clearPREvents]);

  return (
    <AnimatePresence>
      {prEvent && (
        <motion.div
          className="fixed z-[100] left-4 right-4"
          style={{ top: 'calc(var(--safe-area-top) + 12px)' }}
          initial={{ y: -90, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -90, opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', damping: 22, stiffness: 300 }}
        >
          <div
            className="rounded-2xl p-4 flex items-center gap-3"
            style={{
              background: 'linear-gradient(135deg, rgba(251,191,36,0.18) 0%, rgba(245,158,11,0.1) 100%)',
              border: '1px solid rgba(251,191,36,0.45)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              animation: 'pr-pulse 1.8s ease-in-out infinite',
            }}
          >
            <TrophyIcon />
            <div className="flex-1 min-w-0">
              <div className="font-black text-sm uppercase tracking-wide text-yellow-400">
                Nowy Rekord!
              </div>
              <div className="text-white/80 text-sm truncate mt-0.5">
                {formatPRMessage(prEvent)}
              </div>
            </div>
            <button
              onClick={clearPREvents}
              className="p-1.5 text-white/30 hover:text-white/60 flex-shrink-0 transition-colors"
              aria-label="Zamknij"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
