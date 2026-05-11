export type ProfileId = 'emil' | 'nikola';

export type ExerciseCategory =
  | 'klatka' | 'plecy' | 'nogi' | 'barki'
  | 'biceps' | 'triceps' | 'brzuch' | 'cardio';

export type ExerciseEquipment = 'sztanga' | 'hantle' | 'maszyna' | 'wolny';

export type PRType = '1rm' | 'maxWeight' | 'maxVolume';

export type TabId = 'workout' | 'history' | 'stats' | 'comparison' | 'settings';

export interface PlannedExercise {
  exerciseId: string;
  targetSets?: number;
  targetReps?: number;
  targetWeightKg?: number;
}

export interface WorkoutPlan {
  id: string;
  name: string;
  profileId: ProfileId;
  exercises: PlannedExercise[];
  createdAt: string;
}

export interface Exercise {
  id: string;
  name: string;
  nameEn: string;
  category: ExerciseCategory;
  equipment: ExerciseEquipment;
  isCustom: boolean;
  ownerId?: ProfileId;
  isPinned?: boolean;
  description?: string;
}

export interface WorkoutSet {
  id: string;
  exerciseId: string;
  setNumber: number;
  weightKg: number;
  reps: number;
  isWarmup: boolean;
  isPR: boolean;
  timestamp: number;
}

export interface Workout {
  id: string;
  name?: string;
  profileId: ProfileId;
  date: string;
  startTime: number;
  endTime?: number;
  notes?: string;
  sets: WorkoutSet[];
}

export interface PersonalRecord {
  exerciseId: string;
  profileId: ProfileId;
  type: PRType;
  value: number;
  date: string;
  workoutId: string;
  setId: string;
}

export interface AppSettings {
  timerEnabled: Record<ProfileId, boolean>;
  timerDuration: Record<ProfileId, number>;
  theme: 'dark' | 'light' | 'auto';
  pinnedExercises: Record<ProfileId, string[]>;
}

export interface NewPREvent {
  exerciseId: string;
  exerciseName: string;
  type: PRType;
  value: number;
  estimated1RM: number;
  weightKg: number;
  reps: number;
}
