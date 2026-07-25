import {
  SessionExercise,
  TrackingType,
  WorkoutSession,
} from "@/lib/kinethic/domain";

export type OverloadRecommendation = {
  kind: "increase" | "improve" | "repeat";
  message: string;
};

type ProgressionStrategy = {
  recommend(exercise: SessionExercise): OverloadRecommendation | null;
  formatPerformance(exercise: SessionExercise): string;
};

function repTargets(exercise: SessionExercise) {
  return exercise.target.kind === "range"
    ? { minimum: exercise.target.min, maximum: exercise.target.max }
    : { minimum: exercise.target.reps, maximum: exercise.target.reps };
}

const weightRepsStrategy: ProgressionStrategy = {
  recommend(exercise) {
    const reps = exercise.sets.map((set) => set.actualReps);

    if (reps.some((value) => value === undefined)) {
      return null;
    }

    const targets = repTargets(exercise);
    const weight = exercise.sets[0]?.actualWeight;
    const weightText =
      weight === undefined
        ? "the same weight"
        : `${weight} ${exercise.weightUnit}`;

    if (reps.every((value) => value! >= targets.maximum)) {
      return {
        kind: "increase",
        message: `You reached the top target on every set. Consider increasing above ${weightText}.`,
      };
    }

    if (reps.every((value) => value! >= targets.minimum)) {
      return {
        kind: "improve",
        message: `Keep ${weightText} and add reps before increasing the load.`,
      };
    }

    return {
      kind: "repeat",
      message: `Repeat ${weightText} and reach the minimum rep target on every set.`,
    };
  },
  formatPerformance(exercise) {
    const reps = exercise.sets.map((set) => set.actualReps ?? "–").join(" / ");
    const weight = exercise.sets[0]?.actualWeight;

    return `${reps} reps${weight === undefined ? "" : ` at ${weight} ${exercise.weightUnit}`}`;
  },
};

const repsStrategy: ProgressionStrategy = {
  recommend(exercise) {
    const reps = exercise.sets.map((set) => set.actualReps);

    if (reps.some((value) => value === undefined)) {
      return null;
    }

    const targets = repTargets(exercise);

    return reps.every((value) => value! >= targets.maximum)
      ? {
          kind: "increase",
          message:
            "You reached the top target on every set. Increase the rep target next time.",
        }
      : {
          kind: "improve",
          message:
            "Keep the current target and aim to add reps across the remaining sets.",
        };
  },
  formatPerformance(exercise) {
    return `${exercise.sets.map((set) => set.actualReps ?? "–").join(" / ")} reps`;
  },
};

const durationStrategy: ProgressionStrategy = {
  recommend(exercise) {
    const durations = exercise.sets.map((set) => set.actualDurationSeconds);

    if (durations.some((value) => value === undefined)) {
      return null;
    }

    const target = exercise.targetDurationSeconds ?? 0;

    return durations.every((value) => value! >= target)
      ? {
          kind: "increase",
          message:
            "You completed every timed set. Increase the duration slightly next time.",
        }
      : {
          kind: "improve",
          message:
            "Keep the duration target and work toward completing it on every set.",
        };
  },
  formatPerformance(exercise) {
    return exercise.sets
      .map((set) => `${set.actualDurationSeconds ?? "–"}s`)
      .join(" / ");
  },
};

const cardioStrategy: ProgressionStrategy = {
  recommend(exercise) {
    const performance = exercise.sets[0];

    if (!performance?.actualDurationSeconds) {
      return null;
    }

    if (
      exercise.plannedSpeed !== undefined &&
      performance.actualSpeed !== undefined &&
      performance.actualSpeed >= exercise.plannedSpeed
    ) {
      return {
        kind: "increase",
        message:
          "You met the planned speed. Increase speed or incline slightly next time.",
      };
    }

    if (
      exercise.plannedIncline !== undefined &&
      performance.actualIncline !== undefined &&
      performance.actualIncline >= exercise.plannedIncline
    ) {
      return {
        kind: "increase",
        message:
          "You met the planned incline. Increase incline, speed, or duration next time.",
      };
    }

    if (
      performance.actualDurationSeconds >= (exercise.targetDurationSeconds ?? 0)
    ) {
      return {
        kind: "increase",
        message:
          "You completed the planned duration. Increase duration, speed, or incline next time.",
      };
    }

    return {
      kind: "improve",
      message:
        "Repeat the current cardio targets and build toward the planned duration.",
    };
  },
  formatPerformance(exercise) {
    const set = exercise.sets[0];
    const details = [`${set?.actualDurationSeconds ?? "–"}s`];

    if (set?.actualDistance !== undefined) {
      details.push(`${set.actualDistance} distance`);
    }

    if (set?.actualSpeed !== undefined) {
      details.push(`${set.actualSpeed} speed`);
    }

    if (set?.actualIncline !== undefined) {
      details.push(`${set.actualIncline}% incline`);
    }

    if (set?.actualResistance !== undefined) {
      details.push(`${set.actualResistance} resistance`);
    }

    return details.join(" · ");
  },
};

const strategies: Record<TrackingType, ProgressionStrategy> = {
  weight_reps: weightRepsStrategy,
  reps: repsStrategy,
  duration: durationStrategy,
  cardio: cardioStrategy,
};

export function getPreviousExercise(
  currentExercise: SessionExercise,
  previousSessions: WorkoutSession[],
): SessionExercise | null {
  const exercises = previousSessions
    .filter((session) => session.completedAt)
    .sort((a, b) => b.completedAt!.localeCompare(a.completedAt!))
    .flatMap((session) => session.exercises)
    .filter((exercise) => !exercise.skippedAt);

  return (
    exercises.find(
      (exercise) =>
        exercise.templateExerciseId === currentExercise.templateExerciseId,
    ) ??
    exercises.find(
      (exercise) => exercise.exerciseId === currentExercise.exerciseId,
    ) ??
    null
  );
}

export function getExerciseRecommendation(
  currentExercise: SessionExercise,
  previousSessions: WorkoutSession[],
): OverloadRecommendation | null {
  const previousExercise = getPreviousExercise(
    currentExercise,
    previousSessions,
  );

  return previousExercise
    ? strategies[previousExercise.trackingType ?? "weight_reps"].recommend(
        previousExercise,
      )
    : null;
}

export function formatPreviousPerformance(exercise: SessionExercise) {
  return strategies[exercise.trackingType ?? "weight_reps"].formatPerformance(
    exercise,
  );
}
