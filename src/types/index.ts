export type ProfileId = 'emil';

export type ExerciseCategory =
  | 'klatka' | 'plecy' | 'nogi' | 'barki'
  | 'biceps' | 'triceps' | 'brzuch' | 'cardio';

export type ExerciseEquipment = 'sztanga' | 'hantle' | 'maszyna' | 'wolny';

export type ExerciseTrackBy = 'weight-reps' | 'reps-only' | 'time';

export type PRType = '1rm' | 'maxWeight' | 'maxVolume' | 'maxReps' | 'maxTime';

export type TabId = 'workout' | 'history' | 'stats' | 'settings';

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
  description?: string;
  trackBy?: ExerciseTrackBy;
}

export interface WorkoutSet {
  id: string;
  exerciseId: string;
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
