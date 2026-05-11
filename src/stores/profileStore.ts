import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProfileId } from '../types';

interface ProfileState {
  activeProfile: ProfileId;
  onboardingDone: boolean;
  setProfile: (id: ProfileId) => void;
  completeOnboarding: () => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      activeProfile: 'emil',
      onboardingDone: false,
      setProfile: (id) => set({ activeProfile: id }),
      completeOnboarding: () => set({ onboardingDone: true }),
    }),
    {
      name: 'gym_profile',
    },
  ),
);
