import { create } from 'zustand';
import type { Workout, ProfileId } from '../types';
import { storageGet, storageSet, STORAGE_KEYS } from '../utils/storage';
import { getWorkoutDuration } from '../utils/calculations';
import { RUNAWAY_MINUTES, RUNAWAY_REPLACEMENT_MINUTES } from '../constants/workout';

/**
 * One-time repair: a workout the user never ended keeps ticking, so a handful
 * of sessions sit in history at 50+ hours and wreck every duration stat.
 * Clamps those to a plausible length, once, then records that it ran.
 */
function repairRunawayDurations(workouts: Workout[]): Workout[] {
  if (storageGet<boolean>(STORAGE_KEYS.runawayFix, false)) return workouts;

  let changed = 0;
  const repaired = workouts.map(w => {
    if (!w.endTime || getWorkoutDuration(w) <= RUNAWAY_MINUTES) return w;
    changed++;
    return { ...w, endTime: w.startTime + RUNAWAY_REPLACEMENT_MINUTES * 60_000 };
  });

  storageSet(STORAGE_KEYS.runawayFix, true);
  if (changed === 0) return workouts;

  storageSet(STORAGE_KEYS.workouts('emil'), repaired);
  return repaired;
}

interface HistoryState {
  workouts: Record<ProfileId, Workout[]>;
  addWorkout: (workout: Workout) => void;
  updateWorkout: (workoutId: string, profileId: ProfileId, patch: Partial<Workout>) => void;
  deleteWorkout: (workoutId: string, profileId: ProfileId) => void;
  getForProfile: (profileId: ProfileId) => Workout[];
  getLastWorkoutForExercise: (exerciseId: string, profileId: ProfileId) => Workout | null;
}

function loadWorkouts(): Record<ProfileId, Workout[]> {
  return {
    emil: repairRunawayDurations(storageGet<Workout[]>(STORAGE_KEYS.workouts('emil'), [])),
  };
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  workouts: loadWorkouts(),

  addWorkout: (workout) => {
    set(state => {
      const profileWorkouts = [...(state.workouts[workout.profileId] ?? []), workout];
      storageSet(STORAGE_KEYS.workouts(workout.profileId), profileWorkouts);
      return {
        workouts: {
          ...state.workouts,
          [workout.profileId]: profileWorkouts,
        },
      };
    });
  },

  updateWorkout: (workoutId, profileId, patch) => {
    set(state => {
      const profileWorkouts = (state.workouts[profileId] ?? []).map(w =>
        w.id === workoutId ? { ...w, ...patch } : w,
      );
      storageSet(STORAGE_KEYS.workouts(profileId), profileWorkouts);
      return {
        workouts: {
          ...state.workouts,
          [profileId]: profileWorkouts,
        },
      };
    });
  },

  deleteWorkout: (workoutId, profileId) => {
    set(state => {
      const profileWorkouts = (state.workouts[profileId] ?? []).filter(w => w.id !== workoutId);
      storageSet(STORAGE_KEYS.workouts(profileId), profileWorkouts);
      return {
        workouts: {
          ...state.workouts,
          [profileId]: profileWorkouts,
        },
      };
    });
  },

  getForProfile: (profileId) => {
    return get().workouts[profileId] ?? [];
  },

  getLastWorkoutForExercise: (exerciseId, profileId) => {
    const workouts = get().workouts[profileId] ?? [];
    const sorted = [...workouts].sort((a, b) => b.startTime - a.startTime);
    return sorted.find(w => w.sets.some(s => s.exerciseId === exerciseId)) ?? null;
  },
}));
