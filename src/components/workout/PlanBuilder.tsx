import { useState } from 'react';
import { useExerciseStore } from '../../stores/exerciseStore';
import type { Exercise, ExerciseCategory, PlannedExercise } from '../../types';

const CATEGORIES: Array<{ id: ExerciseCategory | 'all'; label: string }> = [
  { id: 'all', label: 'Wszystkie' },
  { id: 'klatka', label: 'Klatka' },
  { id: 'plecy', label: 'Plecy' },
  { id: 'nogi', label: 'Nogi' },
  { id: 'barki', label: 'Barki' },
  { id: 'biceps', label: 'Biceps' },
  { id: 'triceps', label: 'Triceps' },
  { id: 'brzuch', label: 'Brzuch' },
  { id: 'cardio', label: 'Cardio' },
];

interface PlanBuilderProps {
  onClose: () => void;
  onSave: (name: string, exercises: PlannedExercise[]) => void;
}

function ExerciseBrowser({
  onAdd,
  addedIds,
}: {
  onAdd: (e: Exercise) => void;
  addedIds: Set<string>;
}) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ExerciseCategory | 'all'>('all');
  const exercises = useExerciseStore(s => s.exercises);

  const filtered = exercises
    .filter(e => {
      const matchCat = category === 'all' || e.category === category;
      const q = query.toLowerCase();
      return matchCat && (!q || e.nameEn.toLowerCase().includes(q) || e.name.toLowerCase().includes(q));
    })
    .sort((a, b) => a.nameEn.localeCompare(b.nameEn, 'en'));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <input
        type="search"
        placeholder="Szukaj ćwiczenia..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        style={{
          width: '100%', padding: '10px 14px', borderRadius: 14,
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: '#FAFAFA', fontSize: 14, outline: 'none',
          caretColor: 'var(--accent)',
        }}
      />

      {/* Category chips */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
        {CATEGORIES.map(cat => {
          const active = category === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id as ExerciseCategory | 'all')}
              style={{
                flexShrink: 0, padding: '5px 12px', borderRadius: 999,
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: active ? 'linear-gradient(135deg, var(--accent), var(--accent-muted))' : 'rgba(255,255,255,0.05)',
                border: active ? 'none' : '1px solid rgba(255,255,255,0.1)',
                color: active ? '#fff' : 'rgba(255,255,255,0.45)',
                transition: 'background 0.2s ease',
              }}
            >{cat.label}</button>
          );
        })}
      </div>

      {/* Exercise list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {filtered.map(ex => {
          const added = addedIds.has(ex.id);
          return (
            <div
              key={ex.id}
              style={{
                borderRadius: 14,
                background: added ? 'rgba(var(--accent-rgb),0.1)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${added ? 'rgba(var(--accent-rgb),0.3)' : 'rgba(255,255,255,0.07)'}`,
                overflow: 'hidden',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#FAFAFA' }}>{ex.nameEn}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', marginTop: 1 }}>{ex.name}</div>
                </div>
                {added ? (
                  <div style={{ padding: '5px 12px', borderRadius: 10, background: 'rgba(var(--accent-rgb),0.2)', color: 'var(--accent)', fontSize: 12, fontWeight: 700 }}>✓</div>
                ) : (
                  <button
                    onClick={() => onAdd(ex)}
                    style={{
                      padding: '5px 12px', borderRadius: 10, border: 'none',
                      background: 'var(--accent)', color: '#fff',
                      fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
                    }}
                  >+ Dodaj</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PlanBuilder({ onClose, onSave }: PlanBuilderProps) {
  const [planName, setPlanName] = useState('');
  const [exercises, setExercises] = useState<PlannedExercise[]>([]);
  const [showBrowser, setShowBrowser] = useState(false);
  const getById = useExerciseStore(s => s.getById);

  const addedIds = new Set(exercises.map(e => e.exerciseId));

  const handleAdd = (ex: Exercise) => {
    if (addedIds.has(ex.id)) return;
    setExercises(prev => [...prev, { exerciseId: ex.id }]);
  };

  const handleRemove = (id: string) => {
    setExercises(prev => prev.filter(e => e.exerciseId !== id));
  };

  const updateField = (id: string, field: 'targetSets' | 'targetReps' | 'targetWeightKg', value: number | undefined) => {
    setExercises(prev => prev.map(e => e.exerciseId === id ? { ...e, [field]: value } : e));
  };

  const handleSave = () => {
    if (!planName.trim() || exercises.length === 0) return;
    onSave(planName.trim(), exercises);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
    }}>
      <div style={{
        background: 'var(--surface)',
        borderRadius: '28px 28px 0 0',
        padding: '0 20px calc(env(safe-area-inset-bottom, 0px) + 24px)',
        maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Handle bar */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0 16px' }}>
          {showBrowser
            ? <button onClick={() => setShowBrowser(false)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 500, cursor: 'pointer', padding: 0 }}>
                <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
                Wróć do planu
              </button>
            : <span style={{ fontSize: 18, fontWeight: 800, color: '#FAFAFA' }}>Nowy plan</span>
          }
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {showBrowser ? (
            <ExerciseBrowser onAdd={handleAdd} addedIds={addedIds} />
          ) : (
            <>
              {/* Plan name */}
              <input
                type="text"
                placeholder="Nazwa planu (np. Push Day A)"
                value={planName}
                onChange={e => setPlanName(e.target.value)}
                style={{
                  width: '100%', padding: '13px 16px', borderRadius: 16,
                  background: 'rgba(255,255,255,0.06)',
                  border: `1px solid ${planName ? 'rgba(var(--accent-rgb),0.4)' : 'rgba(255,255,255,0.1)'}`,
                  color: '#FAFAFA', fontSize: 15, fontWeight: 600, outline: 'none',
                  caretColor: 'var(--accent)', boxSizing: 'border-box',
                }}
              />

              {/* Exercise list */}
              {exercises.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.38)' }}>ĆWICZENIA</div>
                  {exercises.map((pe, i) => {
                    const ex = getById(pe.exerciseId);
                    if (!ex) return null;
                    return (
                      <div key={pe.exerciseId} style={{
                        padding: '12px 14px', borderRadius: 16,
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#FAFAFA' }}>{i + 1}. {ex.nameEn}</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>{ex.name}</div>
                          </div>
                          <button onClick={() => handleRemove(pe.exerciseId)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 18, cursor: 'pointer', padding: '2px 6px' }}>×</button>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {(['targetSets', 'targetReps'] as const).map(field => (
                            <label key={field} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.38)' }}>
                                {field === 'targetSets' ? 'SERIE' : 'POWT.'}
                              </span>
                              <input
                                type="number"
                                inputMode="numeric"
                                min={1}
                                placeholder="—"
                                value={pe[field] ?? ''}
                                onChange={e => {
                                  const raw = e.target.value;
                                  const v = parseInt(raw, 10);
                                  updateField(pe.exerciseId, field, raw === '' ? undefined : (isNaN(v) ? undefined : Math.max(1, v)));
                                }}
                                style={{
                                  width: '100%', padding: '8px 10px', borderRadius: 10,
                                  background: 'rgba(255,255,255,0.07)',
                                  border: '1px solid rgba(255,255,255,0.1)',
                                  color: '#FAFAFA', fontSize: 16, fontWeight: 700,
                                  textAlign: 'center', outline: 'none',
                                }}
                              />
                            </label>
                          ))}
                          <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.38)' }}>KG (cel)</span>
                            <input
                              type="number"
                              inputMode="decimal"
                              min={0}
                              placeholder="—"
                              value={pe.targetWeightKg ?? ''}
                              onChange={e => {
                                const v = parseFloat(e.target.value);
                                updateField(pe.exerciseId, 'targetWeightKg', isNaN(v) ? undefined : Math.max(0, v));
                              }}
                              style={{
                                width: '100%', padding: '8px 10px', borderRadius: 10,
                                background: 'rgba(255,255,255,0.07)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: '#FAFAFA', fontSize: 16, fontWeight: 700,
                                textAlign: 'center', outline: 'none',
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add exercise button */}
              <button
                onClick={() => setShowBrowser(true)}
                style={{
                  width: '100%', padding: '13px', borderRadius: 16,
                  background: 'rgba(255,255,255,0.04)',
                  border: '2px dashed rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.45)', fontSize: 14, fontWeight: 600,
                  cursor: 'pointer',
                }}
              >+ Dodaj ćwiczenie</button>
            </>
          )}
        </div>

        {/* Save button (only when not browsing) */}
        {!showBrowser && (
          <button
            onClick={handleSave}
            disabled={!planName.trim() || exercises.length === 0}
            style={{
              marginTop: 16, width: '100%', height: 56, borderRadius: 18, border: 'none',
              background: planName.trim() && exercises.length > 0
                ? 'linear-gradient(135deg, var(--accent), var(--accent2))'
                : 'rgba(255,255,255,0.08)',
              color: planName.trim() && exercises.length > 0 ? '#fff' : 'rgba(255,255,255,0.25)',
              fontSize: 16, fontWeight: 700, cursor: planName.trim() && exercises.length > 0 ? 'pointer' : 'default',
              boxShadow: planName.trim() && exercises.length > 0
                ? '0 12px 28px -8px rgba(var(--accent-rgb),0.5)' : 'none',
            }}
          >
            Zapisz plan
          </button>
        )}
      </div>
    </div>
  );
}
