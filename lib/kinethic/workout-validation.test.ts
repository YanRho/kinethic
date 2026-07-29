import { describe, expect, it } from "vitest";
import { ExerciseDefinition, MuscleGroup } from "./domain";
import {
  MAX_EXERCISES_PER_WORKOUT,
  validateExerciseAddition,
} from "./workout-validation";

const exercise = (
  id: string,
  primaryMuscleGroup: MuscleGroup,
  secondaryMuscleGroups: MuscleGroup[] = [],
): ExerciseDefinition => ({
  id,
  name: id,
  primaryMuscleGroup,
  secondaryMuscleGroups,
  equipment: "Bodyweight",
  source: "custom",
  trackingType: "reps",
});

describe("validateExerciseAddition", () => {
  it("blocks the same exercise from being added more than once", () => {
    const existing = [exercise("biceps-curl", "Biceps")];

    expect(validateExerciseAddition(existing, existing[0])).toEqual({
      allowed: false,
      code: "duplicate_exercise",
      message: "biceps-curl is already in this workout.",
    });
  });

  it("blocks additions once the workout has 8 exercises", () => {
    const existing = Array.from(
      { length: MAX_EXERCISES_PER_WORKOUT },
      (_, index) => exercise(`exercise-${index}`, "Core"),
    );

    expect(validateExerciseAddition(existing, exercise("next", "Chest"))).toEqual(
      {
        allowed: false,
        code: "workout_limit",
        message:
          "This workout already has 8 exercises. Remove one before adding another.",
      },
    );
  });

  it("blocks a fourth exercise for the same primary muscle group", () => {
    const existing = [
      exercise("glute-1", "Glutes"),
      exercise("glute-2", "Glutes"),
      exercise("glute-3", "Glutes"),
    ];

    expect(
      validateExerciseAddition(existing, exercise("glute-4", "Glutes")),
    ).toEqual({
      allowed: false,
      code: "primary_muscle_limit",
      message:
        "This workout already has 3 glute-focused exercises. Remove one before adding another.",
    });
  });

  it("does not count secondary muscle groups toward the primary limit", () => {
    const existing = [
      exercise("quad-1", "Quadriceps", ["Glutes"]),
      exercise("hamstring-1", "Hamstrings", ["Glutes"]),
      exercise("core-1", "Core", ["Glutes"]),
    ];

    expect(
      validateExerciseAddition(existing, exercise("glute-1", "Glutes")),
    ).toEqual({ allowed: true });
  });

  it("allows additions below both limits", () => {
    const existing = [
      exercise("chest-1", "Chest"),
      exercise("chest-2", "Chest"),
      exercise("back-1", "Back"),
      exercise("shoulder-1", "Shoulders"),
    ];

    expect(
      validateExerciseAddition(existing, exercise("chest-3", "Chest")),
    ).toEqual({ allowed: true });
  });
});
