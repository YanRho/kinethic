import { ExerciseDefinition, MuscleGroup } from "./domain";

export const MAX_EXERCISES_PER_WORKOUT = 8;
export const MAX_EXERCISES_PER_PRIMARY_MUSCLE = 3;

const muscleFocusLabel: Record<MuscleGroup, string> = {
  Chest: "chest",
  Back: "back",
  Shoulders: "shoulder",
  Biceps: "biceps",
  Triceps: "triceps",
  Quadriceps: "quad",
  Hamstrings: "hamstring",
  Glutes: "glute",
  Calves: "calf",
  Core: "core",
};

export type ExerciseAdditionValidation =
  | { allowed: true }
  | {
      allowed: false;
      code: "duplicate_exercise" | "workout_limit" | "primary_muscle_limit";
      message: string;
    };

export function countPrimaryMuscles(exercises: ExerciseDefinition[]) {
  return exercises.reduce<Partial<Record<MuscleGroup, number>>>(
    (counts, exercise) => {
      counts[exercise.primaryMuscleGroup] =
        (counts[exercise.primaryMuscleGroup] ?? 0) + 1;
      return counts;
    },
    {},
  );
}

export function validateExerciseAddition(
  currentExercises: ExerciseDefinition[],
  candidate: ExerciseDefinition,
): ExerciseAdditionValidation {
  if (currentExercises.some((exercise) => exercise.id === candidate.id)) {
    return {
      allowed: false,
      code: "duplicate_exercise",
      message: `${candidate.name} is already in this workout.`,
    };
  }

  if (currentExercises.length >= MAX_EXERCISES_PER_WORKOUT) {
    return {
      allowed: false,
      code: "workout_limit",
      message:
        "This workout already has 8 exercises. Remove one before adding another.",
    };
  }

  const primaryCount =
    countPrimaryMuscles(currentExercises)[candidate.primaryMuscleGroup] ?? 0;
  if (primaryCount >= MAX_EXERCISES_PER_PRIMARY_MUSCLE) {
    return {
      allowed: false,
      code: "primary_muscle_limit",
      message: `This workout already has 3 ${muscleFocusLabel[candidate.primaryMuscleGroup]}-focused exercises. Remove one before adding another.`,
    };
  }

  return { allowed: true };
}
