import { create } from 'zustand';
import type { Workout, ProfileId } from '../types';
import { storageGet, storageSet, STORAGE_KEYS } from '../utils/storage';

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
    emil: storageGet<Workout[]>(STORAGE_KEYS.workouts('emil'), []),
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
