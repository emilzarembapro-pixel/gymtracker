import { AnimatePresence, motion } from 'framer-motion';
import { useWorkoutStore } from '../../stores/workoutStore';
import type { WorkoutSet } from '../../types';

interface SetListProps {
  exerciseId: string;
  sets: WorkoutSet[];
}

function PRBadge() {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -15 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', damping: 14, stiffness: 280 }}
      className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide"
      style={{
        background: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
        color: '#000',
        boxShadow: '0 2px 8px rgba(251,191,36,0.4)',
      }}
    >
      <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor">
        <path d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l7.1-1.01L12 2z" />
      </svg>
      PR
    </motion.div>
  );
}

export function SetList({ exerciseId, sets }: SetListProps) {
  const deleteSet = useWorkoutStore(s => s.deleteSet);
  const setsForExercise = sets.filter(s => s.exerciseId === exerciseId);

  if (setsForExercise.length === 0) return null;

  return (
    <div className="glass-card overflow-hidden">
      <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-glass)' }}>
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">
          Dzisiejsze serie ({setsForExercise.length})
        </span>
      </div>
      <div>
        <AnimatePresence initial={false}>
          {setsForExercise.map((set, idx) => (
            <motion.div
              key={set.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center px-4 py-3.5 gap-3"
              style={{ borderBottom: `1px solid ${idx < setsForExercise.length - 1 ? 'rgba(255,255,255,0.05)' : 'transparent'}` }}
            >
              <span className="text-white/25 text-sm font-semibold w-7 flex-shrink-0">
                S{idx + 1}
              </span>
              <div className="flex-1">
                <span
                  className={`text-sm font-bold tabular-nums ${set.isWarmup ? 'text-white/35' : 'text-white'}`}
                >
                  {set.weightKg} kg × {set.reps}
                  {set.isWarmup && (
                    <span className="text-white/25 font-normal ml-1 text-xs">rozg.</span>
                  )}
                </span>
              </div>
              {set.isPR && <PRBadge />}
              <button
                onClick={() => deleteSet(set.id)}
                className="p-2 text-white/20 hover:text-red-400 active:text-red-500 transition-colors flex-shrink-0"
                aria-label="Usuń serię"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6l-1 14H6L5 6M9 6V4h6v2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
