import { Id, WorkoutSession } from "./domain";

export function getPersonalRecordWeight(
  sessions: WorkoutSession[],
  profileId: Id,
  exerciseId: Id,
  targetUnit: "lb" | "kg",
) {
  const completedWeights = sessions
    .filter(
      (session) => session.profileId === profileId && session.completedAt,
    )
    .flatMap((session) => session.exercises)
    .filter(
      (exercise) =>
        exercise.exerciseId === exerciseId &&
        exercise.trackingType === "weight_reps" &&
        !exercise.skippedAt,
    )
    .flatMap((exercise) =>
      exercise.sets
        .filter((set) => set.completedAt && set.actualWeight !== undefined)
        .map((set) =>
          exercise.weightUnit === "kg"
            ? set.actualWeight! * 2.2046226218
            : set.actualWeight!,
        ),
    );

  if (completedWeights.length === 0) return undefined;

  const recordLb = Math.max(...completedWeights);
  const targetWeight = targetUnit === "kg" ? recordLb / 2.2046226218 : recordLb;
  return Math.round(targetWeight * 10) / 10;
}
