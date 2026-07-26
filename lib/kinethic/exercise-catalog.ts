import {
  Equipment,
  ExerciseDefinition,
  MuscleGroup,
  TrackingType,
} from "./domain";

const builtInExercise = (
  slug: string,
  name: string,
  muscleGroup: MuscleGroup,
  equipment: Equipment,
  trackingType: TrackingType = "weight_reps",
): ExerciseDefinition => ({
  id: `builtin:${slug}`,
  name,
  muscleGroups: [muscleGroup],
  equipment,
  source: "builtin",
  trackingType,
});

const catalog = [
  builtInExercise("machine-chest-press", "Machine Chest Press", "Chest", "Machine"),
  builtInExercise(
    "incline-smith-machine-press",
    "Incline Smith Machine Press",
    "Chest",
    "Smith Machine",
  ),
  builtInExercise("pec-deck", "Pec Deck", "Chest", "Machine"),
  builtInExercise(
    "machine-shoulder-press",
    "Machine Shoulder Press",
    "Shoulders",
    "Machine",
  ),
  builtInExercise("lat-pulldown", "Lat Pulldown", "Back", "Cable Machine"),
  builtInExercise(
    "seated-cable-row",
    "Seated Cable Row",
    "Back",
    "Cable Machine",
  ),
  builtInExercise(
    "reverse-pec-deck",
    "Reverse Pec Deck",
    "Shoulders",
    "Machine",
  ),
  builtInExercise(
    "lateral-raise",
    "Lateral Raise",
    "Shoulders",
    "Dumbbells",
  ),
  builtInExercise("biceps-curl", "Biceps Curl", "Biceps", "Dumbbells"),
  builtInExercise("hammer-curl", "Hammer Curl", "Biceps", "Dumbbells"),
  builtInExercise(
    "rope-triceps-pushdown",
    "Rope Triceps Pushdown",
    "Triceps",
    "Cable Machine",
  ),
  builtInExercise("leg-press", "Leg Press", "Quadriceps", "Machine"),
  builtInExercise(
    "smith-machine-squat",
    "Smith Machine Squat",
    "Quadriceps",
    "Smith Machine",
  ),
  builtInExercise(
    "romanian-deadlift",
    "Romanian Deadlift",
    "Hamstrings",
    "Dumbbells",
  ),
  builtInExercise("leg-extension", "Leg Extension", "Quadriceps", "Machine"),
  builtInExercise(
    "seated-leg-curl",
    "Seated Leg Curl",
    "Hamstrings",
    "Machine",
  ),
  builtInExercise("hip-thrust", "Hip Thrust", "Glutes", "Smith Machine"),
  builtInExercise("glute-bridge", "Glute Bridge", "Glutes", "Bodyweight"),
  builtInExercise(
    "bulgarian-split-squat",
    "Bulgarian Split Squat",
    "Quadriceps",
    "Dumbbells",
  ),
  builtInExercise(
    "reverse-lunge",
    "Reverse Lunge",
    "Quadriceps",
    "Dumbbells",
  ),
  builtInExercise(
    "walking-lunge",
    "Walking Lunge",
    "Quadriceps",
    "Dumbbells",
  ),
  builtInExercise("step-up", "Step-Up", "Quadriceps", "Dumbbells"),
  builtInExercise("hip-abduction", "Hip Abduction", "Glutes", "Machine"),
  builtInExercise("calf-raise", "Calf Raise", "Calves", "Machine"),
  builtInExercise("cable-crunch", "Cable Crunch", "Core", "Cable Machine"),
  builtInExercise("knee-raise", "Knee Raise", "Core", "Bodyweight", "reps"),
  builtInExercise("plank", "Plank", "Core", "Bodyweight", "duration"),
] satisfies ExerciseDefinition[];

export const builtInExercises: Readonly<Record<string, ExerciseDefinition>> =
  Object.fromEntries(catalog.map((exercise) => [exercise.id, exercise]));
