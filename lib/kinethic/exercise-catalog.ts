import { ExerciseDefinition } from "./domain";

const exercise = (
  id: string,
  name: string,
  muscleGroup: string,
  equipment: string,
  trackingType: ExerciseDefinition["trackingType"] = "weight_reps",
): ExerciseDefinition => ({
  id: `builtin:${id}`,
  name,
  muscleGroups: [muscleGroup],
  equipment: [equipment],
  isCustom: false,
  trackingType,
});

const catalog = [
  exercise("barbell-bench-press", "Barbell Bench Press", "Chest", "Barbell"),
  exercise("lat-pulldown", "Lat Pulldown", "Back", "Cable"),
  exercise(
    "dumbbell-shoulder-press",
    "Dumbbell Shoulder Press",
    "Shoulders",
    "Dumbbell",
  ),
  exercise("leg-extension", "Leg Extension", "Quadriceps", "Machine"),
  exercise("plank", "Plank", "Core", "Bodyweight", "duration"),
  exercise("kettlebell-swing", "Kettlebell Swing", "Full Body", "Kettlebell"),
  exercise("treadmill-run", "Treadmill Run", "Cardio", "Treadmill", "cardio"),
  exercise(
    "band-lateral-walk",
    "Band Lateral Walk",
    "Hip Abductors",
    "Resistance Band",
    "reps",
  ),
] as const;

export const builtInExercises: Record<string, ExerciseDefinition> =
  Object.fromEntries(catalog.map((item) => [item.id, item]));
