import type { Workout, WorkoutSet, PersonalRecord, ProfileId, NewPREvent, ExerciseTrackBy } from '../types';
import { todayISO, daysAgoISO } from './dates';

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

export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function formatSecondsToTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const minutes = Math.floor(s / 60);
  const seconds = s % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function parseTimeToSeconds(str: string): number {
  const trimmed = str.trim();
  if (!trimmed) return 0;
  if (trimmed.includes(':')) {
    const [m, s = '0'] = trimmed.split(':');
    const minutes = parseInt(m, 10);
    const seconds = parseInt(s, 10);
    if (isNaN(minutes) || isNaN(seconds)) return 0;
    return Math.max(0, minutes * 60 + seconds);
  }
  const n = parseInt(trimmed, 10);
  return isNaN(n) ? 0 : Math.max(0, n);
}

export function checkNewPRs(
  set: WorkoutSet,
  existingPRs: PersonalRecord[],
  _workoutId: string,
  _profileId: ProfileId,
  _date: string,
  trackBy: ExerciseTrackBy = 'weight-reps',
): NewPREvent[] {
  if (set.isWarmup) return [];

  const events: NewPREvent[] = [];

  if (trackBy === 'reps-only') {
    if (set.reps <= 0) return [];
    const pr = existingPRs.find(p => p.type === 'maxReps');
    if (!pr || set.reps > pr.value) {
      events.push({
        exerciseId: set.exerciseId,
        exerciseName: '',
        type: 'maxReps',
        value: set.reps,
        estimated1RM: 0,
        weightKg: 0,
        reps: set.reps,
      });
    }
    return events;
  }

  if (trackBy === 'time') {
    if (set.reps <= 0) return [];
    const pr = existingPRs.find(p => p.type === 'maxTime');
    if (!pr || set.reps > pr.value) {
      events.push({
        exerciseId: set.exerciseId,
        exerciseName: '',
        type: 'maxTime',
        value: set.reps,
        estimated1RM: 0,
        weightKg: 0,
        reps: set.reps,
      });
    }
    return events;
  }

  if (set.reps === 0 || set.weightKg === 0) return [];

  const estimated1RM = epley1RM(set.weightKg, set.reps);
  const volume = calcVolume(set.weightKg, set.reps);

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

  // Streak must start from today or yesterday (local dates — workouts store local ones)
  if (dates[0] !== todayISO() && dates[0] !== daysAgoISO(1)) return 0;

  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(`${dates[i - 1]}T12:00:00`);
    const curr = new Date(`${dates[i]}T12:00:00`);
    const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86400000);
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

export interface AttendanceStats {
  /** Every workout ever logged. */
  total: number;
  /**
   * Averages over the span from the first workout to today, not per calendar
   * unit. `null` until the span covers at least one whole unit — extrapolating
   * a month from three days produces a headline number that means nothing.
   */
  perWeek: number | null;
  perMonth: number | null;
  spanDays: number;
  /**
   * Mean length in minutes. Trustworthy because runaway sessions are clamped —
   * once on load for old history, and at finish time for everything since.
   */
  avgDurationMin: number;
  /** How many workouts that mean is based on — the rest have no end time. */
  timedCount: number;
  firstDate: string | null;
}

const MS_PER_DAY = 86_400_000;

/**
 * `spanDaysOverride` fixes the window the averages are divided by — pass the
 * selected period's length so "last 30 days" divides by 30 rather than by the
 * gap between the first and last workout inside that window.
 */
export function getAttendanceStats(
  workouts: Workout[],
  spanDaysOverride?: number | null,
): AttendanceStats {
  if (workouts.length === 0) {
    return { total: 0, perWeek: null, perMonth: null, spanDays: 0, avgDurationMin: 0, timedCount: 0, firstDate: null };
  }

  const firstDate = workouts.reduce((min, w) => (w.date < min ? w.date : min), workouts[0].date);

  // Noon anchors dodge DST shifts that would otherwise round the span off by a day.
  const spanDays = spanDaysOverride ?? Math.max(
    1,
    Math.round(
      (new Date(`${todayISO()}T12:00:00`).getTime() - new Date(`${firstDate}T12:00:00`).getTime()) / MS_PER_DAY,
    ) + 1,
  );

  const timed = workouts.filter(w => w.endTime && w.endTime > w.startTime);
  const avgDurationMin = timed.length
    ? Math.round(timed.reduce((sum, w) => sum + getWorkoutDuration(w), 0) / timed.length)
    : 0;

  const round1 = (n: number) => Math.round(n * 10) / 10;

  return {
    total: workouts.length,
    perWeek: spanDays >= 7 ? round1(workouts.length / (spanDays / 7)) : null,
    perMonth: spanDays >= 30 ? round1(workouts.length / (spanDays / 30.44)) : null,
    spanDays,
    avgDurationMin,
    timedCount: timed.length,
    firstDate,
  };
}
