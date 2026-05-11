import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { ProfileId, WorkoutPlan } from '../types';
import { storageGet, storageSet, STORAGE_KEYS } from '../utils/storage';

interface PlanState {
  plans: Record<ProfileId, WorkoutPlan[]>;
  getForProfile: (profileId: ProfileId) => WorkoutPlan[];
  getById: (id: string, profileId: ProfileId) => WorkoutPlan | undefined;
  addPlan: (plan: Omit<WorkoutPlan, 'id' | 'createdAt'>) => WorkoutPlan;
  deletePlan: (id: string, profileId: ProfileId) => void;
}

function loadPlans(profileId: ProfileId): WorkoutPlan[] {
  return storageGet<WorkoutPlan[]>(STORAGE_KEYS.plans(profileId), []);
}

function savePlans(profileId: ProfileId, plans: WorkoutPlan[]) {
  storageSet(STORAGE_KEYS.plans(profileId), plans);
}

export const usePlanStore = create<PlanState>((set, get) => ({
  plans: {
    emil: loadPlans('emil'),
    nikola: loadPlans('nikola'),
  },

  getForProfile: (profileId) => get().plans[profileId],

  getById: (id, profileId) => get().plans[profileId].find(p => p.id === id),

  addPlan: (plan) => {
    const newPlan: WorkoutPlan = {
      ...plan,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    set(state => {
      const updated = [...state.plans[plan.profileId], newPlan];
      savePlans(plan.profileId, updated);
      return { plans: { ...state.plans, [plan.profileId]: updated } };
    });
    return newPlan;
  },

  deletePlan: (id, profileId) => {
    set(state => {
      const updated = state.plans[profileId].filter(p => p.id !== id);
      savePlans(profileId, updated);
      return { plans: { ...state.plans, [profileId]: updated } };
    });
  },
}));
