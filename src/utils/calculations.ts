import type { Workout, WorkoutSet, PersonalRecord, PRType, ProfileId, NewPREvent } from '../types';

export function epley1RM(weightKg: number, reps: number): number {
  return reps === 1 ? weightKg : weightKg * (1 + reps / 30);
}

export function calcVolume(weightKg: number, reps: number): number {
  return weightKg * reps;
}

export function getTotalVolume(workout: Workout): number {
  return workout.sets
    .filter(s => !s.isWarmup)
    .reduce((sum, s) => sum + calcVolume(s.weightKg, s.reps), 0);
}

export function getWorkoutDuration(workout: Workout): number {
  if (!workout.endTime) return 0;
  return Math.round((workout.endTime - workout.startTime) / 60000);
}

export function checkNewPRs(
  set: WorkoutSet,
  existingPRs: PersonalRecord[],
  _workoutId: string,
  _profileId: ProfileId,
  _date: string,
): NewPREvent[] {
  if (set.isWarmup || set.reps === 0 || set.weightKg === 0) return [];

  const events: NewPREvent[] = [];
  const estimated1RM = epley1RM(set.weightKg, set.reps);
  const volume = calcVolume(set.weightKg, set.reps);

  // Check maxWeight PR
  const maxWeightPR = existingPRs.find(p => p.type === 'maxWeight');
  if (!maxWeightPR || set.weightKg > maxWeightPR.value) {
    events.push({
      exerciseId: set.exerciseId,
      exerciseName: '',
      type: 'maxWeight',
      value: set.weightKg,
      estimated1RM,
      weightKg: set.weightKg,
      reps: set.reps,
    });
  }

  // Check 1RM PR
  const rm1PR = existingPRs.find(p => p.type === '1rm');
  if (!rm1PR || estimated1RM > rm1PR.value) {
    events.push({
      exerciseId: set.exerciseId,
      exerciseName: '',
      type: '1rm',
      value: estimated1RM,
      estimated1RM,
      weightKg: set.weightKg,
      reps: set.reps,
    });
  }

  // Check maxVolume PR
  const maxVolumePR = existingPRs.find(p => p.type === 'maxVolume');
  if (!maxVolumePR || volume > maxVolumePR.value) {
    events.push({
      exerciseId: set.exerciseId,
      exerciseName: '',
      type: 'maxVolume',
      value: volume,
      estimated1RM,
      weightKg: set.weightKg,
      reps: set.reps,
    });
  }

  return events;
}

export function calculateStreak(workouts: Workout[]): number {
  if (workouts.length === 0) return 0;

  // Get unique workout dates sorted descending
  const dates = [...new Set(workouts.map(w => w.date))].sort((a, b) => b.localeCompare(a));

  if (dates.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const todayStr = today.toISOString().split('T')[0];
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // Streak must start from today or yesterday
  if (dates[0] !== todayStr && dates[0] !== yesterdayStr) return 0;

  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    prev.setHours(0, 0, 0, 0);
    const curr = new Date(dates[i]);
    curr.setHours(0, 0, 0, 0);
    const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86400000);
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

export function formatPRValue(type: PRType, value: number): string {
  switch (type) {
    case '1rm':
      return `${value.toFixed(1)} kg (szac.)`;
    case 'maxWeight':
      return `${value} kg`;
    case 'maxVolume':
      return `${value} kg`;
    default:
      return `${value}`;
  }
}
