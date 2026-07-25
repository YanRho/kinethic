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
export type TrackingType = "weight_reps" | "reps" | "duration" | "cardio";

export type Profile = {
  id: Id;
  name: string;
  accent: string;
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
  distance?: number;
  speed?: number;
  incline?: number;
  resistance?: number;
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
  muscleGroups: string[];
  equipment: string[];
  isCustom: boolean;
  trackingType: TrackingType;
};

export type SessionSet = {
  setNumber: number;
  actualWeight?: number;
  actualReps?: number;
  completedAt?: string;
  actualDurationSeconds?: number;
  actualDistance?: number;
  actualSpeed?: number;
  actualIncline?: number;
  actualResistance?: number;
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
  skipReason?: string;
  trackingType: TrackingType;
  targetDurationSeconds?: number;
  plannedDistance?: number;
  plannedSpeed?: number;
  plannedIncline?: number;
  plannedResistance?: number;
};

export type WorkoutSession = {
  id: Id;
  profileId: Id;
  workoutId: Id;
  workoutName: string;
  startedAt: string;
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
  schemaVersion: 5;
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
  schemaVersion: 5,
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
