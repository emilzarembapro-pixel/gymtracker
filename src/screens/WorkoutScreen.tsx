import { useState, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useWorkoutStore } from '../stores/workoutStore';
import { useHistoryStore } from '../stores/historyStore';
import { useProfileStore } from '../stores/profileStore';
import { usePlanStore } from '../stores/planStore';
import { useExerciseStore } from '../stores/exerciseStore';
import { useRestTimer } from '../hooks/useRestTimer';
import { ExercisePicker } from '../components/workout/ExercisePicker';
import { SetLogger } from '../components/workout/SetLogger';
import { SetList } from '../components/workout/SetList';
import { PlanBuilder } from '../components/workout/PlanBuilder';
import { ProgressRing } from '../components/ui/ProgressRing';
import { WorkoutCompletionOverlay } from '../components/workout/WorkoutCompletionOverlay';
import { Button } from '../components/ui/Button';
import { ProfileSwitch } from '../components/ui/ProfileSwitch';
import type { Exercise, PlannedExercise, Workout, WorkoutPlan } from '../types';
import { PROFILES } from '../constants/profiles';

const RING_R = 38;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_R;

function getTodayLabel() {
  const now = new Date();
  const weekday = new Intl.DateTimeFormat('pl-PL', { weekday: 'long' }).format(now).toUpperCase();
  const day = now.getDate();
  const month = new Intl.DateTimeFormat('pl-PL', { month: 'long' }).format(now).toUpperCase();
  return `${weekday} · ${day} ${month}`;
}

function RestTimerRing({
  secondsLeft,
  totalSeconds,
  onSkip,
  onAdd15,
}: {
  secondsLeft: number;
  totalSeconds: number;
  onSkip: () => void;
  onAdd15: () => void;
}) {
  const progress = totalSeconds > 0 ? Math.max(0, secondsLeft / totalSeconds) : 0;
  const dashOffset = RING_CIRCUMFERENCE * (1 - progress);
  const isLow = secondsLeft > 0 && secondsLeft < 10;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <div className="glass-card p-5 flex flex-col items-center gap-4">
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">
        Odpoczynek
      </div>
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle
            cx="50" cy="50" r={RING_R}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth="5"
          />
          <circle
            cx="50" cy="50" r={RING_R}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 0.25s ease, stroke 0.45s ease' }}
            className={isLow ? 'animate-[ring-pulse_1s_ease-in-out_infinite]' : ''}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-[2.2rem] font-black tabular-nums leading-none"
            style={{ color: 'var(--accent)', transition: 'color 0.45s ease' }}
          >
            {minutes}:{String(seconds).padStart(2, '0')}
          </span>
        </div>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onAdd15}
          className="px-4 py-2.5 rounded-xl bg-white/8 border border-white/10 text-white/60 text-sm font-semibold active:bg-white/15 transition-colors"
        >
          +15s
        </button>
        <button
          onClick={onSkip}
          className="px-4 py-2.5 rounded-xl bg-white/8 border border-white/10 text-white/60 text-sm font-semibold active:bg-white/15 transition-colors"
        >
          Pomiń
        </button>
      </div>
    </div>
  );
}

export function WorkoutScreen() {
  const activeWorkout = useWorkoutStore(s => s.activeWorkout);
  const currentExerciseId = useWorkoutStore(s => s.currentExerciseId);
  const activePlanId = useWorkoutStore(s => s.activePlanId);
  const startWorkout = useWorkoutStore(s => s.startWorkout);
  const selectExercise = useWorkoutStore(s => s.selectExercise);
  const finishWorkout = useWorkoutStore(s => s.finishWorkout);
  const cancelWorkout = useWorkoutStore(s => s.cancelWorkout);
  const setActivePlan = useWorkoutStore(s => s.setActivePlan);
  const addWorkout = useHistoryStore(s => s.addWorkout);
  const activeProfile = useProfileStore(s => s.activeProfile);
  const plans = usePlanStore(s => s.getForProfile(activeProfile));
  const addPlan = usePlanStore(s => s.addPlan);
  const deletePlan = usePlanStore(s => s.deletePlan);
  const getById = useExerciseStore(s => s.getById);

  const [confirmFinish, setConfirmFinish] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [showPlanBuilder, setShowPlanBuilder] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [curtainActive, setCurtainActive] = useState(false);
  const [completedWorkout, setCompletedWorkout] = useState<Workout | null>(null);
  const [showExerciseDesc, setShowExerciseDesc] = useState(false);

  const prefersReducedMotion = useReducedMotion();

  const { secondsLeft, isRunning, start: startTimer, stop: stopTimer, addSeconds } = useRestTimer();
  const [timerTotal, setTimerTotal] = useState(0);

  const profile = PROFILES[activeProfile];

  const handleStartWorkout = () => {
    if (!prefersReducedMotion) {
      setCurtainActive(true);
      window.setTimeout(() => setCurtainActive(false), 650);
    }
    setActivePlan(null);
    startWorkout(activeProfile);
  };

  const handleStartFromPlan = (plan: WorkoutPlan) => {
    if (!prefersReducedMotion) {
      setCurtainActive(true);
      window.setTimeout(() => setCurtainActive(false), 650);
    }
    startWorkout(activeProfile);
    setActivePlan(plan.id);
  };

  const handleSavePlan = (name: string, exercises: PlannedExercise[]) => {
    addPlan({ name, exercises, profileId: activeProfile });
    setShowPlanBuilder(false);
  };

  const handleExerciseSelect = (exercise: Exercise) => {
    selectExercise(exercise.id);
    setShowPicker(false);
  };

  const handleFinishWorkout = () => {
    const finished = finishWorkout();
    addWorkout(finished);
    stopTimer();
    setConfirmFinish(false);
    setCompletedWorkout(finished);
  };

  const handleCancelWorkout = () => {
    cancelWorkout();
    stopTimer();
    setConfirmCancel(false);
  };

  const handleTimerStart = useCallback((duration: number) => {
    setTimerTotal(duration);
    startTimer(duration);
  }, [startTimer]);

  const exerciseCount = activeWorkout
    ? new Set(activeWorkout.sets.map(s => s.exerciseId)).size
    : 0;
  const setCount = activeWorkout?.sets.filter(s => !s.isWarmup).length ?? 0;

  const activePlan = activePlanId ? plans.find(p => p.id === activePlanId) : null;

  // Overall plan progress for the big ring
  const planProgress = activePlan
    ? (() => {
        const totalTarget = activePlan.exercises.reduce((s, e) => s + e.targetSets, 0);
        const totalDone = activeWorkout?.sets.filter(s => !s.isWarmup).length ?? 0;
        return totalTarget > 0 ? Math.min(totalDone / totalTarget, 1) : 0;
      })()
    : null;

  // targetSets for the current exercise in SetLogger
  const currentExercisePlan = activePlan?.exercises.find(e => e.exerciseId === currentExerciseId);

  const handleNextExercise = useCallback(() => {
    setShowExerciseDesc(false);
    if (activePlan) {
      const currentIdx = activePlan.exercises.findIndex(e => e.exerciseId === currentExerciseId);
      const next = activePlan.exercises[currentIdx + 1];
      selectExercise(next ? next.exerciseId : '');
    } else {
      selectExercise('');
    }
  }, [activePlan, currentExerciseId, selectExercise]);

  return (
    <>
      {/* ── Curtain split entrance ── */}
      <AnimatePresence>
        {curtainActive && (
          <>
            <motion.div
              key="curtain-top"
              initial={{ y: 0 }}
              animate={{ y: '-100%' }}
              exit={{ y: '-100%' }}
              transition={{ duration: 0.6, ease: [0.65, 0, 0.35, 1] }}
              style={{
                position: 'fixed', top: 0, left: 0, right: 0, height: '50vh',
                background: '#0A0A0A',
                borderBottom: '1px solid var(--accent)',
                zIndex: 9999,
                pointerEvents: 'none',
              }}
            />
            <motion.div
              key="curtain-bottom"
              initial={{ y: 0 }}
              animate={{ y: '100%' }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.6, ease: [0.65, 0, 0.35, 1] }}
              style={{
                position: 'fixed', bottom: 0, left: 0, right: 0, height: '50vh',
                background: '#0A0A0A',
                borderTop: '1px solid var(--accent)',
                zIndex: 9999,
                pointerEvents: 'none',
              }}
            />
          </>
        )}
      </AnimatePresence>

      {/* ── FIFA completion overlay ── */}
      <WorkoutCompletionOverlay
        workout={completedWorkout}
        onClose={() => setCompletedWorkout(null)}
      />

      {/* ── No active workout ── */}
      {!activeWorkout && (
        <>
          {showPlanBuilder && (
            <PlanBuilder onClose={() => setShowPlanBuilder(false)} onSave={handleSavePlan} />
          )}
          <div style={{ padding: '0 20px', paddingBottom: 32, overflowY: 'auto', height: '100%' }}>
            <div style={{
              paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 8,
            }}>
              <ProfileSwitch />
            </div>

            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.42)', fontWeight: 600, marginBottom: 4, letterSpacing: '0.03em' }}>
              {getTodayLabel()}
            </div>

            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#FAFAFA', letterSpacing: '-0.02em', marginBottom: 24 }}>
              Cześć, {profile.nickname}!
            </h1>

            <div style={{
              borderRadius: 26, padding: '20px 20px 20px',
              background: `linear-gradient(135deg, var(--accent) 0%, var(--accent2) 60%, #0F172A 130%)`,
              boxShadow: `0 18px 40px -18px rgba(var(--accent-rgb),0.53), 0 0 0 1px rgba(255,255,255,0.06) inset`,
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: -80, right: -60, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.18), transparent)' }} />
              <div style={{ position: 'relative' }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.16em', color: 'rgba(255,255,255,0.78)' }}>GOTOWY?</div>
                <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', color: '#fff', marginTop: 6, lineHeight: 1 }}>Pusty trening</div>
                <button
                  onClick={handleStartWorkout}
                  style={{
                    marginTop: 20, width: '100%', height: 56, borderRadius: 16, border: 'none',
                    background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
                    color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >Rozpocznij trening</button>
              </div>
            </div>

            <div style={{ marginTop: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="rgba(255,255,255,0.42)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.42)' }}>PLANY TRENINGÓW</span>
                </div>
                <button
                  onClick={() => setShowPlanBuilder(true)}
                  style={{ padding: '5px 12px', borderRadius: 10, background: 'rgba(var(--accent-rgb),0.12)', border: '1px solid rgba(var(--accent-rgb),0.3)', color: 'var(--accent)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >+ Nowy plan</button>
              </div>

              {plans.length === 0 ? (
                <div style={{ padding: '20px', borderRadius: 18, background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)', textAlign: 'center' }}>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>Brak planów — utwórz pierwszy plan treningowy</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {plans.map(plan => {
                    const exNames = plan.exercises.slice(0, 3).map(pe => getById(pe.exerciseId)?.nameEn ?? pe.exerciseId);
                    const extra = plan.exercises.length - 3;
                    return (
                      <div key={plan.id} style={{ borderRadius: 20, padding: '14px 16px', background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: '#FAFAFA' }}>{plan.name}</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', marginTop: 2 }}>
                              {plan.exercises.length} ćw. · {exNames.join(', ')}{extra > 0 ? ` +${extra}` : ''}
                            </div>
                          </div>
                          <button
                            onClick={() => deletePlan(plan.id, activeProfile)}
                            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', fontSize: 16, cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}
                          >×</button>
                        </div>
                        <button
                          onClick={() => handleStartFromPlan(plan)}
                          style={{
                            width: '100%', height: 44, borderRadius: 13, border: 'none',
                            background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                            color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                          }}
                        >Rozpocznij ten plan</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Active workout, no exercise selected ── */}
      {activeWorkout && !currentExerciseId && (
        <div className="px-4 py-4 space-y-4">
          <div style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}>
            <ProfileSwitch />
          </div>

          {/* Active workout header */}
          <div className="glass-card p-4" style={{ borderLeft: '3px solid var(--accent)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {/* Big progress ring — only with a plan */}
              {planProgress !== null && (
                <ProgressRing
                  value={planProgress}
                  size={88}
                  stroke={6}
                  label={
                    <div style={{ textAlign: 'center', lineHeight: 1 }}>
                      <div style={{ fontSize: 20, fontWeight: 900, fontVariantNumeric: 'tabular-nums', color: 'var(--accent)' }}>
                        {Math.round(planProgress * 100)}%
                      </div>
                      <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                        POSTĘP
                      </div>
                    </div>
                  }
                />
              )}
              <div style={{ flex: 1 }}>
                <span className="text-sm font-bold uppercase tracking-wide" style={{ color: 'var(--accent)' }}>
                  {activePlan ? activePlan.name : 'Trening w toku'}
                </span>
                <div className="flex gap-3 mt-2">
                  <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-white/8 text-white/60">{exerciseCount} ćwiczeń</span>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-white/8 text-white/60">{setCount} serii</span>
                </div>
              </div>
            </div>
          </div>

          {/* Plan exercise list */}
          {activePlan && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.42)' }}>PLAN TRENINGU</div>
              {activePlan.exercises.map((pe, i) => {
                const ex = getById(pe.exerciseId);
                const doneSets = activeWorkout.sets.filter(s => s.exerciseId === pe.exerciseId && !s.isWarmup).length;
                const done = doneSets >= pe.targetSets;
                return (
                  <button
                    key={pe.exerciseId}
                    onClick={() => selectExercise(pe.exerciseId)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 14px', borderRadius: 16, width: '100%', textAlign: 'left',
                      background: done ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${done ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.08)'}`,
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: done ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.07)',
                      fontSize: 12, fontWeight: 700,
                      color: done ? '#22c55e' : 'rgba(255,255,255,0.4)',
                    }}>
                      {done
                        ? <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-9"/></svg>
                        : i + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: done ? 'rgba(255,255,255,0.5)' : '#FAFAFA' }}>{ex?.nameEn ?? pe.exerciseId}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>
                        cel: {pe.targetSets}×{pe.targetReps}{pe.targetWeightKg ? ` @ ${pe.targetWeightKg}kg` : ''} · wykonano: {doneSets} serii
                      </div>
                    </div>
                    <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeLinecap="round"><path d="M9 6l6 6-6 6"/></svg>
                  </button>
                );
              })}
              <button
                onClick={() => setShowPicker(v => !v)}
                style={{ padding: '10px', borderRadius: 14, background: 'none', border: '1px dashed rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.35)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >{showPicker ? '↑ Zwiń wybór' : '+ Dodaj inne ćwiczenie'}</button>
              {showPicker && <ExercisePicker onSelect={handleExerciseSelect} />}
            </div>
          )}

          {!activePlan && (
            <div>
              <h2 className="text-base font-bold text-white/60 mb-3 uppercase tracking-wide text-xs">Wybierz ćwiczenie</h2>
              <ExercisePicker onSelect={handleExerciseSelect} />
            </div>
          )}

          <div className="space-y-2 pt-4">
            {confirmFinish ? (
              <div className="glass-card p-4 space-y-3" style={{ borderColor: 'rgba(var(--accent-rgb), 0.3)' }}>
                <p className="text-white font-semibold">Zakończyć trening?</p>
                <div className="flex gap-2">
                  <Button variant="primary" fullWidth onClick={handleFinishWorkout}>Tak, zakończ</Button>
                  <Button variant="ghost" fullWidth onClick={() => setConfirmFinish(false)}>Nie</Button>
                </div>
              </div>
            ) : (
              <Button variant="primary" size="lg" fullWidth onClick={() => setConfirmFinish(true)}>Zakończ trening</Button>
            )}
            {!confirmFinish && (
              confirmCancel ? (
                <div className="glass-card p-4 space-y-3" style={{ borderColor: 'rgba(220,38,38,0.4)', background: 'rgba(220,38,38,0.08)' }}>
                  <p className="text-red-300 font-semibold">Anulować trening? Dane zostaną utracone.</p>
                  <div className="flex gap-2">
                    <Button variant="danger" fullWidth onClick={handleCancelWorkout}>Tak, anuluj</Button>
                    <Button variant="ghost" fullWidth onClick={() => setConfirmCancel(false)}>Nie</Button>
                  </div>
                </div>
              ) : (
                <Button variant="ghost" size="sm" fullWidth onClick={() => setConfirmCancel(true)}>Anuluj trening</Button>
              )
            )}
          </div>
        </div>
      )}

      {/* ── Active workout + exercise selected ── */}
      {activeWorkout && currentExerciseId && (
        <div className="px-4 py-4 space-y-4">
          <div style={{
            paddingTop: 'calc(env(safe-area-inset-top, 0px) + 4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 0,
          }}>
            <button
              onClick={() => selectExercise('')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                color: 'rgba(255,255,255,0.42)', fontSize: 14, fontWeight: 500,
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              }}
            >
              <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              Zmień ćwiczenie
            </button>
            <button style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              fontSize: 16, color: 'rgba(255,255,255,0.42)',
            }}>⋯</button>
          </div>

          <ProfileSwitch compact />

          {/* Exercise name + info */}
          {(() => {
            const ex = getById(currentExerciseId);
            if (!ex) return null;
            return (
              <div style={{ borderRadius: 16, overflow: 'hidden', background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <button
                  onClick={() => setShowExerciseDesc(v => !v)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#FAFAFA' }}>{ex.nameEn}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', marginTop: 2 }}>{ex.name}</div>
                  </div>
                  <svg
                    viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round"
                    style={{ transform: showExerciseDesc ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease', flexShrink: 0 }}
                  >
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </button>
                {showExerciseDesc && ex.description && (
                  <div style={{ padding: '0 16px 14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <p style={{ fontSize: 12.5, lineHeight: 1.65, color: 'rgba(255,255,255,0.52)', paddingTop: 10 }}>
                      {ex.description}
                    </p>
                  </div>
                )}
              </div>
            );
          })()}

          {isRunning && (
            <RestTimerRing
              secondsLeft={secondsLeft}
              totalSeconds={timerTotal}
              onSkip={stopTimer}
              onAdd15={() => addSeconds(15)}
            />
          )}

          <SetLogger
            exerciseId={currentExerciseId}
            onTimerStart={handleTimerStart}
            targetReps={currentExercisePlan?.targetReps}
            targetWeightKg={currentExercisePlan?.targetWeightKg}
            targetSets={currentExercisePlan?.targetSets}
          />
          <SetList exerciseId={currentExerciseId} sets={activeWorkout.sets} />

          {/* Next exercise button */}
          <button
            onClick={handleNextExercise}
            style={{
              width: '100%', height: 52, borderRadius: 16, border: '1px solid rgba(var(--accent-rgb),0.3)',
              background: 'rgba(var(--accent-rgb),0.08)',
              color: 'var(--accent)', fontSize: 15, fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <span>Następne ćwiczenie</span>
            <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M9 6l6 6-6 6"/>
            </svg>
          </button>

          <div className="pt-2 space-y-2">
            {confirmFinish ? (
              <div className="glass-card p-4 space-y-3" style={{ borderColor: 'rgba(var(--accent-rgb), 0.3)' }}>
                <p className="text-white font-semibold">Zakończyć trening?</p>
                <div className="flex gap-2">
                  <Button variant="primary" fullWidth onClick={handleFinishWorkout}>Tak, zakończ</Button>
                  <Button variant="ghost" fullWidth onClick={() => setConfirmFinish(false)}>Nie</Button>
                </div>
              </div>
            ) : (
              <Button variant="primary" size="lg" fullWidth onClick={() => setConfirmFinish(true)}>
                Zakończ trening
              </Button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
