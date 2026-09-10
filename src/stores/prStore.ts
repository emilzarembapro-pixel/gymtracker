import { create } from 'zustand';
import type { PersonalRecord, ProfileId } from '../types';
import { storageGet, storageSet, STORAGE_KEYS } from '../utils/storage';

interface PRState {
  prs: Record<ProfileId, PersonalRecord[]>;
  upsertPR: (pr: PersonalRecord) => void;
  getForExercise: (exerciseId: string, profileId: ProfileId) => PersonalRecord[];
  getAllForProfile: (profileId: ProfileId) => PersonalRecord[];
}

function loadPRs(): Record<ProfileId, PersonalRecord[]> {
  return {
    emil: storageGet<PersonalRecord[]>(STORAGE_KEYS.prs('emil'), []),
  };
}

export const usePRStore = create<PRState>((set, get) => ({
  prs: loadPRs(),

  upsertPR: (pr) => {
    set(state => {
      const existing = state.prs[pr.profileId] ?? [];
      const idx = existing.findIndex(
        p => p.exerciseId === pr.exerciseId && p.type === pr.type,
      );
      let updated: PersonalRecord[];
      if (idx >= 0) {
        updated = [...existing];
        updated[idx] = pr;
      } else {
        updated = [...existing, pr];
      }
      storageSet(STORAGE_KEYS.prs(pr.profileId), updated);
      return {
        prs: {
          ...state.prs,
          [pr.profileId]: updated,
        },
      };
    });
  },

  getForExercise: (exerciseId, profileId) => {
    return (get().prs[profileId] ?? []).filter(p => p.exerciseId === exerciseId);
  },

  getAllForProfile: (profileId) => {
    return get().prs[profileId] ?? [];
  },
}));
