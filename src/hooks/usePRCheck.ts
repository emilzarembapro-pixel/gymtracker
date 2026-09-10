import { useWorkoutStore } from '../stores/workoutStore';
import { usePRStore } from '../stores/prStore';
import { useExerciseStore } from '../stores/exerciseStore';
import { checkNewPRs } from '../utils/calculations';
import { todayISO } from '../utils/dates';
import type { WorkoutSet, NewPREvent } from '../types';

export function usePRCheck() {
  const activeWorkout = useWorkoutStore(s => s.activeWorkout);
  const getForExercise = usePRStore(s => s.getForExercise);
  const exercises = useExerciseStore(s => s.exercises);
  const markSetAsPR = useWorkoutStore(s => s.markSetAsPR);
  const setLastPREvents = useWorkoutStore(s => s.setLastPREvents);
  const upsertPR = usePRStore(s => s.upsertPR);

  return (set: WorkoutSet): NewPREvent[] => {
    if (!activeWorkout || set.isWarmup) return [];
    const { profileId, id: workoutId } = activeWorkout;
    const existingPRs = getForExercise(set.exerciseId, profileId);
    const exercise = exercises.find(e => e.id === set.exerciseId);
    const exerciseName = exercise?.name ?? '';
    const trackBy = exercise?.trackBy ?? 'weight-reps';
    const events = checkNewPRs(set, existingPRs, workoutId, profileId, todayISO(), trackBy);
    const namedEvents = events.map(e => ({ ...e, exerciseName }));
    if (namedEvents.length > 0) {
      markSetAsPR(set.id);
      namedEvents.forEach(e => upsertPR({
        exerciseId: e.exerciseId,
        profileId,
        type: e.type,
        value: e.value,
        date: todayISO(),
        workoutId,
        setId: set.id,
      }));
      setLastPREvents(namedEvents);
    }
    return namedEvents;
  };
}
