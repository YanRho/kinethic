import { describe, expect, it } from "vitest";
import { WorkoutSession } from "./domain";
import { getPersonalRecordWeight } from "./workout-history";

const session = (
  weight: number,
  weightUnit: "lb" | "kg" = "lb",
  completed = true,
): WorkoutSession => ({
  id: crypto.randomUUID(),
  profileId: "profile-1",
  workoutId: "workout-1",
  workoutName: "Workout",
  startedAt: "2026-01-01T00:00:00.000Z",
  completedAt: completed ? "2026-01-01T01:00:00.000Z" : null,
  currentExerciseIndex: 1,
  restEndsAt: null,
  exercises: [
    {
      id: crypto.randomUUID(),
      templateExerciseId: "template-1",
      exerciseId: "exercise-1",
      exerciseName: "Exercise",
      target: { kind: "exact", reps: 8 },
      restSeconds: 60,
      weightUnit,
      trackingType: "weight_reps",
      sets: [
        {
          setNumber: 1,
          actualWeight: weight,
          completedAt: "2026-01-01T00:10:00.000Z",
        },
      ],
    },
  ],
});

describe("getPersonalRecordWeight", () => {
  it("uses the highest completed weight and converts it to the target unit", () => {
    const sessions = [session(200), session(100, "kg"), session(300, "lb", false)];

    expect(
      getPersonalRecordWeight(sessions, "profile-1", "exercise-1", "lb"),
    ).toBe(220.5);
    expect(
      getPersonalRecordWeight(sessions, "profile-1", "exercise-1", "kg"),
    ).toBe(100);
  });
});
