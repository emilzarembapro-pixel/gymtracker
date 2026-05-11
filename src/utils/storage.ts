import type { ProfileId } from '../types';

export const STORAGE_KEYS = {
  activeProfile: 'gym_profile',
  onboardingDone: 'gym_onboarding',
  activeWorkout: 'gym_active_workout',
  workouts: (id: ProfileId) => `gym_workouts_${id}`,
  prs: (id: ProfileId) => `gym_prs_${id}`,
  customExercises: 'gym_custom_exercises',
  settings: 'gym_settings',
  plans: (id: ProfileId) => `gym_plans_${id}`,
} as const;

export function storageGet<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return fallback;
    return JSON.parse(item) as T;
  } catch {
    return fallback;
  }
}

export function storageSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      throw e;
    }
    // Ignore other errors
  }
}

export function storageRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore
  }
}
