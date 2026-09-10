import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Exercise } from '../types';
import { DEFAULT_EXERCISES, EXERCISE_ALIASES } from '../constants/exercises';
import { storageGet, storageSet, STORAGE_KEYS } from '../utils/storage';

interface ExerciseState {
  exercises: Exercise[];
  addCustomExercise: (ex: Omit<Exercise, 'id' | 'isCustom'>) => Exercise;
  deleteCustomExercise: (id: string) => void;
  getById: (id: string) => Exercise | undefined;
}

function loadExercises(): Exercise[] {
  const custom = storageGet<Exercise[]>(STORAGE_KEYS.customExercises, []);
  return [...DEFAULT_EXERCISES, ...custom];
}

export const useExerciseStore = create<ExerciseState>((set, get) => ({
  exercises: loadExercises(),

  addCustomExercise: (ex) => {
    const newExercise: Exercise = {
      ...ex,
      id: uuidv4(),
      isCustom: true,
    };
    set(state => {
      const updated = [...state.exercises, newExercise];
      const customOnly = updated.filter(e => e.isCustom);
      storageSet(STORAGE_KEYS.customExercises, customOnly);
      return { exercises: updated };
    });
    return newExercise;
  },

  deleteCustomExercise: (id) => {
    set(state => {
      const updated = state.exercises.filter(e => e.id !== id);
      const customOnly = updated.filter(e => e.isCustom);
      storageSet(STORAGE_KEYS.customExercises, customOnly);
      return { exercises: updated };
    });
  },

  getById: (id) => {
    const { exercises } = get();
    const found = exercises.find(e => e.id === id);
    if (found) return found;
    // Sets logged before the exercise was merged into another one
    const alias = EXERCISE_ALIASES[id];
    return alias ? exercises.find(e => e.id === alias) : undefined;
  },
}));
