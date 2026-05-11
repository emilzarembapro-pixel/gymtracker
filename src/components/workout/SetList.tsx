import { useState } from 'react';
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

function EditModal({ set, onClose, onSave }: { set: WorkoutSet; onClose: () => void; onSave: (w: number, r: number) => void }) {
  const [weight, setWeight] = useState(String(set.weightKg));
  const [reps, setReps] = useState(String(set.reps));
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--surface)', borderRadius: 24, padding: 24, width: '100%', maxWidth: 340,
          border: '1px solid rgba(255,255,255,0.1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontSize: 16, fontWeight: 800, color: '#FAFAFA', marginBottom: 16 }}>Edytuj serię</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--accent)' }}>KG</span>
            <input
              type="number" inputMode="decimal"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              style={{
                width: '100%', padding: '10px', borderRadius: 12, textAlign: 'center',
                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                color: '#FAFAFA', fontSize: 22, fontWeight: 800, outline: 'none',
                caretColor: 'var(--accent)', boxSizing: 'border-box',
              }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--accent)' }}>POWT.</span>
            <input
              type="number" inputMode="numeric"
              value={reps}
              onChange={e => setReps(e.target.value)}
              style={{
                width: '100%', padding: '10px', borderRadius: 12, textAlign: 'center',
                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                color: '#FAFAFA', fontSize: 22, fontWeight: 800, outline: 'none',
                caretColor: 'var(--accent)', boxSizing: 'border-box',
              }}
            />
          </label>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, height: 48, borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)',
              fontSize: 15, fontWeight: 600, cursor: 'pointer',
            }}
          >Anuluj</button>
          <button
            onClick={() => {
              const w = parseFloat(weight);
              const r = parseInt(reps, 10);
              if (!isNaN(w) && !isNaN(r) && r > 0) onSave(Math.max(0, w), Math.max(1, r));
              onClose();
            }}
            style={{
              flex: 2, height: 48, borderRadius: 14, border: 'none',
              background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
              color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
            }}
          >Zapisz</button>
        </div>
      </div>
    </div>
  );
}

function SetRow({
  set,
  label,
  isLast,
  onDelete,
  onEdit,
}: {
  set: WorkoutSet;
  label: string;
  isLast: boolean;
  onDelete: () => void;
  onEdit: () => void;
}) {
  return (
    <motion.div
      key={set.id}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      onClick={onEdit}
      className="flex items-center px-4 py-3.5 gap-3"
      style={{ borderBottom: `1px solid ${!isLast ? 'rgba(255,255,255,0.05)' : 'transparent'}`, cursor: 'pointer' }}
    >
      <span className="text-white/25 text-sm font-semibold w-7 flex-shrink-0">{label}</span>
      <div className="flex-1">
        <span className={`text-sm font-bold tabular-nums ${set.isWarmup ? 'text-white/35' : 'text-white'}`}>
          {set.weightKg} kg × {set.reps}
        </span>
      </div>
      {set.isPR && <PRBadge />}
      <button
        onClick={e => { e.stopPropagation(); onEdit(); }}
        className="p-2 text-white/20 hover:text-blue-400 active:text-blue-500 transition-colors flex-shrink-0"
        aria-label="Edytuj serię"
      >
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </button>
      <button
        onClick={e => { e.stopPropagation(); onDelete(); }}
        className="p-2 text-white/20 hover:text-red-400 active:text-red-500 transition-colors flex-shrink-0"
        aria-label="Usuń serię"
      >
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18M19 6l-1 14H6L5 6M9 6V4h6v2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </motion.div>
  );
}

export function SetList({ exerciseId, sets }: SetListProps) {
  const deleteSet = useWorkoutStore(s => s.deleteSet);
  const updateSet = useWorkoutStore(s => s.updateSet);
  const [editingSet, setEditingSet] = useState<WorkoutSet | null>(null);

  const setsForExercise = sets.filter(s => s.exerciseId === exerciseId);
  const warmupSets = setsForExercise.filter(s => s.isWarmup);
  const workingSets = setsForExercise.filter(s => !s.isWarmup);

  if (setsForExercise.length === 0) return null;

  return (
    <>
      {editingSet && (
        <EditModal
          set={editingSet}
          onClose={() => setEditingSet(null)}
          onSave={(w, r) => updateSet(editingSet.id, { weightKg: w, reps: r })}
        />
      )}
      <div className="glass-card overflow-hidden">
        {warmupSets.length > 0 && (
          <>
            <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-glass)' }}>
              <span className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: 'rgba(249,115,22,0.7)' }}>
                Rozgrzewka ({warmupSets.length})
              </span>
            </div>
            <AnimatePresence initial={false}>
              {warmupSets.map((set, idx) => (
                <SetRow
                  key={set.id}
                  set={set}
                  label={`R${idx + 1}`}
                  isLast={idx === warmupSets.length - 1 && workingSets.length === 0}
                  onDelete={() => deleteSet(set.id)}
                  onEdit={() => setEditingSet(set)}
                />
              ))}
            </AnimatePresence>
          </>
        )}
        {workingSets.length > 0 && (
          <>
            <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-glass)', borderTop: warmupSets.length > 0 ? '1px solid var(--border-glass)' : undefined }}>
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">
                Serie robocze ({workingSets.length})
              </span>
            </div>
            <AnimatePresence initial={false}>
              {workingSets.map((set, idx) => (
                <SetRow
                  key={set.id}
                  set={set}
                  label={`S${idx + 1}`}
                  isLast={idx === workingSets.length - 1}
                  onDelete={() => deleteSet(set.id)}
                  onEdit={() => setEditingSet(set)}
                />
              ))}
            </AnimatePresence>
          </>
        )}
      </div>
    </>
  );
}
