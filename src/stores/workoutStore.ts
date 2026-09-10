import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Workout, WorkoutSet, ProfileId, NewPREvent } from '../types';
import { storageGet, storageSet, storageRemove, STORAGE_KEYS } from '../utils/storage';
import { todayISO } from '../utils/dates';

interface WorkoutState {
  activeWorkout: Workout | null;
  currentExerciseId: string | null;
  lastPREvents: NewPREvent[];
  activePlanId: string | null;

  startWorkout: (profileId: ProfileId, name?: string) => Workout;
  setActivePlan: (planId: string | null) => void;
  selectExercise: (exerciseId: string) => void;
  addSet: (setData: Omit<WorkoutSet, 'id' | 'timestamp' | 'isPR'>) => WorkoutSet;
  markSetAsPR: (setId: string) => void;
  renameWorkout: (name: string) => void;
  updateSet: (setId: string, patch: Partial<WorkoutSet>) => void;
  deleteSet: (setId: string) => void;
  finishWorkout: (notes?: string) => Workout;
  setLastPREvents: (events: NewPREvent[]) => void;
  clearPREvents: () => void;
  cancelWorkout: () => void;
}

interface ActiveSession {
  currentExerciseId: string | null;
  activePlanId: string | null;
}

function persistActive(workout: Workout | null) {
  if (workout) {
    storageSet(STORAGE_KEYS.activeWorkout, workout);
  } else {
    storageRemove(STORAGE_KEYS.activeWorkout);
  }
}

/** Keeps the picked exercise and the running plan across a page refresh. */
function persistSession(session: ActiveSession | null) {
  if (session) {
    storageSet(STORAGE_KEYS.activeSession, session);
  } else {
    storageRemove(STORAGE_KEYS.activeSession);
  }
}

const savedActive = storageGet<Workout | null>(STORAGE_KEYS.activeWorkout, null);
const savedSession = savedActive
  ? storageGet<ActiveSession>(STORAGE_KEYS.activeSession, { currentExerciseId: null, activePlanId: null })
  : { currentExerciseId: null, activePlanId: null };

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  activeWorkout: savedActive,
  currentExerciseId: savedSession.currentExerciseId,
  lastPREvents: [],
  activePlanId: savedSession.activePlanId,

  startWorkout: (profileId, name) => {
    const workout: Workout = {
      id: uuidv4(),
      profileId,
      ...(name ? { name } : {}),
      date: todayISO(),
      startTime: Date.now(),
      sets: [],
    };
    persistActive(workout);
    persistSession({ currentExerciseId: null, activePlanId: null });
    set({ activeWorkout: workout, currentExerciseId: null, activePlanId: null });
    return workout;
  },

  setActivePlan: (planId) => {
    persistSession({ currentExerciseId: get().currentExerciseId, activePlanId: planId });
    set({ activePlanId: planId });
  },

  selectExercise: (exerciseId) => {
    persistSession({ currentExerciseId: exerciseId, activePlanId: get().activePlanId });
    set({ currentExerciseId: exerciseId });
  },

  addSet: (setData) => {
    const { activeWorkout } = get();
    if (!activeWorkout) throw new Error('No active workout');

    const newSet: WorkoutSet = {
      ...setData,
      id: uuidv4(),
      timestamp: Date.now(),
      isPR: false,
    };

    const updated: Workout = {
      ...activeWorkout,
      sets: [...activeWorkout.sets, newSet],
    };
    persistActive(updated);
    set({ activeWorkout: updated });
    return newSet;
  },

  markSetAsPR: (setId) => {
    const { activeWorkout } = get();
    if (!activeWorkout) return;
    const updated: Workout = {
      ...activeWorkout,
      sets: activeWorkout.sets.map(s =>
        s.id === setId ? { ...s, isPR: true } : s,
      ),
    };
    persistActive(updated);
    set({ activeWorkout: updated });
  },

  renameWorkout: (name) => {
    const { activeWorkout } = get();
    if (!activeWorkout) return;
    const trimmed = name.trim();
    const updated: Workout = { ...activeWorkout };
    if (trimmed) updated.name = trimmed;
    else delete updated.name;
    persistActive(updated);
    set({ activeWorkout: updated });
  },

  updateSet: (setId, patch) => {
    const { activeWorkout } = get();
    if (!activeWorkout) return;
    const updated: Workout = {
      ...activeWorkout,
      sets: activeWorkout.sets.map(s =>
        s.id === setId ? { ...s, ...patch } : s,
      ),
    };
    persistActive(updated);
    set({ activeWorkout: updated });
  },

  deleteSet: (setId) => {
    const { activeWorkout } = get();
    if (!activeWorkout) return;
    const updated: Workout = {
      ...activeWorkout,
      sets: activeWorkout.sets.filter(s => s.id !== setId),
    };
    persistActive(updated);
    set({ activeWorkout: updated });
  },

  finishWorkout: (notes) => {
    const { activeWorkout } = get();
    if (!activeWorkout) throw new Error('No active workout');
    const finished: Workout = {
      ...activeWorkout,
      endTime: Date.now(),
      notes,
    };
    storageRemove(STORAGE_KEYS.activeWorkout);
    persistSession(null);
    set({ activeWorkout: null, currentExerciseId: null, activePlanId: null });
    return finished;
  },

  setLastPREvents: (events) => {
    set({ lastPREvents: events });
  },

  clearPREvents: () => {
    set({ lastPREvents: [] });
  },

  cancelWorkout: () => {
    storageRemove(STORAGE_KEYS.activeWorkout);
    persistSession(null);
    set({ activeWorkout: null, currentExerciseId: null, activePlanId: null });
  },
}));
