export const weekdays = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export type DayKey = (typeof weekdays)[number];
export type Id = string;
export type TrackingType = "weight_reps" | "reps" | "duration";
export type Sex = "female" | "male";

export const muscleGroupOptions = [
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Quadriceps",
  "Hamstrings",
  "Glutes",
  "Calves",
  "Core",
] as const;

export type MuscleGroup = (typeof muscleGroupOptions)[number];

export const equipmentOptions = [
  "Machine",
  "Cable Machine",
  "Smith Machine",
  "Dumbbells",
  "Bodyweight",
  "Resistance Band",
] as const;

export type Equipment = (typeof equipmentOptions)[number];

export const getExerciseKey = (name: string, equipment: Equipment): string =>
  `${name.trim().toLocaleLowerCase()}::${equipment.toLocaleLowerCase()}`;

export const cleanName = (name: string) => name.trim().replace(/\s+/g, " ");
export const nameKey = (name: string) => cleanName(name).toLocaleLowerCase();

export type Profile = {
  id: Id;
  name: string;
  accent: string;
  birthDate?: string;
  sex?: Sex;
  weightLb?: number;
  heightIn?: number;
  activeSplitId: Id | null;
  createdAt: string;
  updatedAt: string;
};

export type WeeklySchedule = Record<DayKey, Id | null>;

export type WorkoutSplit = {
  id: Id;
  profileId: Id;
  name: string;
  schedule: WeeklySchedule;
  createdAt: string;
  updatedAt: string;
};

export type RepTarget =
  | { kind: "exact"; reps: number }
  | { kind: "range"; min: number; max: number };

export type WorkoutExercise = {
  id: Id;
  exerciseId: Id;
  sets: number;
  reps: RepTarget;
  restSeconds: number;
  weight?: number;
  weightUnit?: "lb" | "kg";
  notes?: string;
  trackingType?: TrackingType;
  durationSeconds?: number;
};

export type Workout = {
  id: Id;
  profileId: Id;
  name: string;
  exercises: WorkoutExercise[];
  createdAt: string;
  updatedAt: string;
};

export type ExerciseDefinition = {
  id: Id;
  name: string;
  primaryMuscleGroup: MuscleGroup;
  secondaryMuscleGroups: MuscleGroup[];
  equipment: Equipment;
  source: "builtin" | "custom";
  trackingType: TrackingType;
};

export type SessionSet = {
  setNumber: number;
  actualWeight?: number;
  actualReps?: number;
  completedAt?: string;
  actualDurationSeconds?: number;
};

export type SessionExercise = {
  id: Id;
  templateExerciseId: Id;
  exerciseId: Id;
  exerciseName: string;
  target: RepTarget;
  restSeconds: number;
  plannedWeight?: number;
  weightUnit: "lb" | "kg";
  notes?: string;
  sets: SessionSet[];
  skippedAt?: string;
  trackingType: TrackingType;
  targetDurationSeconds?: number;
};

export type WorkoutSession = {
  id: Id;
  profileId: Id;
  workoutId: Id;
  workoutName: string;
  startedAt: string;
  pausedAt?: string | null;
  accumulatedPausedSeconds?: number;
  completedAt: string | null;
  currentExerciseIndex: number;
  restEndsAt: string | null;
  exercises: SessionExercise[];
};

export type ExercisePreferences = {
  favoriteExerciseIds: Id[];
  recentExerciseIds: Id[];
};

export type KinEthicData = {
  schemaVersion: 17;
  profiles: Record<Id, Profile>;
  splits: Record<Id, WorkoutSplit>;
  workouts: Record<Id, Workout>;
  exercises: Record<Id, ExerciseDefinition>;
  workoutSessions: Record<Id, WorkoutSession>;
  exercisePreferences: Record<Id, ExercisePreferences>;
};

export const emptySchedule = (): WeeklySchedule => ({
  monday: null,
  tuesday: null,
  wednesday: null,
  thursday: null,
  friday: null,
  saturday: null,
  sunday: null,
});

export const emptyData = (): KinEthicData => ({
  schemaVersion: 17,
  profiles: {},
  splits: {},
  workouts: {},
  exercises: {},
  workoutSessions: {},
  exercisePreferences: {},
});

export const dayLabel = (day: DayKey) => day[0].toUpperCase() + day.slice(1);

export function localDay(date = new Date()): DayKey {
  const index = date.getDay() === 0 ? 6 : date.getDay() - 1;
  return weekdays[index];
}

export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function ageFromBirthDate(birthDate: string, today = new Date()) {
  const [year, month, day] = birthDate.split("-").map(Number);
  if (!year || !month || !day) return null;

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  let age = today.getFullYear() - year;
  if (
    today.getMonth() < month - 1 ||
    (today.getMonth() === month - 1 && today.getDate() < day)
  ) {
    age -= 1;
  }
  return age;
}
