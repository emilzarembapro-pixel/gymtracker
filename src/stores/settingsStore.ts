import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppSettings, ProfileId } from '../types';
import { DEFAULT_SETTINGS } from '../constants/profiles';

interface SettingsState extends AppSettings {
  setTimerEnabled: (profileId: ProfileId, enabled: boolean) => void;
  setTimerDuration: (profileId: ProfileId, seconds: number) => void;
  setTheme: (theme: AppSettings['theme']) => void;
  togglePinnedExercise: (profileId: ProfileId, exerciseId: string) => void;
  isPinned: (profileId: ProfileId, exerciseId: string) => boolean;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,
      setTimerEnabled: (profileId, enabled) =>
        set(state => ({
          timerEnabled: { ...state.timerEnabled, [profileId]: enabled },
        })),
      setTimerDuration: (profileId, seconds) =>
        set(state => ({
          timerDuration: { ...state.timerDuration, [profileId]: seconds },
        })),
      setTheme: (theme) => set({ theme }),
      togglePinnedExercise: (profileId, exerciseId) =>
        set(state => {
          const current = state.pinnedExercises[profileId] ?? [];
          const isPinned = current.includes(exerciseId);
          return {
            pinnedExercises: {
              ...state.pinnedExercises,
              [profileId]: isPinned
                ? current.filter(id => id !== exerciseId)
                : [...current, exerciseId],
            },
          };
        }),
      isPinned: (profileId, exerciseId) => {
        const state = get();
        return (state.pinnedExercises[profileId] ?? []).includes(exerciseId);
      },
    }),
    {
      name: 'gym_settings',
    },
  ),
);
