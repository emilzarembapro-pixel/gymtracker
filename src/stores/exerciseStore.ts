import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Exercise, ExerciseCategory } from '../types';
import { DEFAULT_EXERCISES } from '../constants/exercises';
import { storageGet, storageSet, STORAGE_KEYS } from '../utils/storage';

interface ExerciseState {
  exercises: Exercise[];
  addCustomExercise: (ex: Omit<Exercise, 'id' | 'isCustom'>) => Exercise;
  deleteCustomExercise: (id: string) => void;
  getById: (id: string) => Exercise | undefined;
  search: (query: string, category?: ExerciseCategory) => Exercise[];
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
    return get().exercises.find(e => e.id === id);
  },

  search: (query, category) => {
    const { exercises } = get();
    const q = query.toLowerCase().trim();
    return exercises.filter(e => {
      const matchesCategory = !category || e.category === category;
      const matchesQuery =
        !q ||
        e.name.toLowerCase().includes(q) ||
        e.nameEn.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  },
}));
