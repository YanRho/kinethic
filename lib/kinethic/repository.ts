import {
  DayKey,
  ExerciseDefinition,
  Id,
  KinEthicData,
  Profile,
  RepTarget,
  TrackingType,
  Workout,
  WorkoutExercise,
  WorkoutSession,
  WorkoutSplit,
  emptyData,
  emptySchedule,
  weekdays,
} from "./domain";

export interface KinEthicRepository {
  getSnapshot(): string;
  getServerSnapshot(): string;
  subscribe(listener: () => void): () => void;
  read(): KinEthicData;
  createProfile(input: { name: string; accent: string }): Profile;
  deleteProfile(profileId: Id): void;
  saveSplit(input: {
    id?: Id;
    profileId: Id;
    name: string;
    schedule: Record<DayKey, Id | null>;
  }): WorkoutSplit;
  setActiveSplit(profileId: Id, splitId: Id | null): void;
  deleteSplit(splitId: Id): void;
  saveWorkout(input: {
    id?: Id;
    profileId: Id;
    name: string;
    exercises: WorkoutExercise[];
  }): Workout;
  deleteWorkout(workoutId: Id): void;
  saveExercise(
    name: string,
    trackingType?: TrackingType,
    muscleGroup?: string,
    equipment?: string,
  ): ExerciseDefinition;
  deleteExercise(exerciseId: Id): void;
  toggleFavoriteExercise(profileId: Id, exerciseId: Id): void;
  recordRecentExercises(profileId: Id, exerciseIds: Id[]): void;
  startWorkoutSession(profileId: Id, workoutId: Id): WorkoutSession | null;
  saveWorkoutSession(session: WorkoutSession): void;
  finishWorkoutSession(sessionId: Id): WorkoutSession | null;
}

const STORAGE_KEY = "kinethic:data";
const LEGACY_KEY = "kinethic:profiles";
const CHANGE_EVENT = "kinethic:data-changed";
const SERVER_SNAPSHOT = JSON.stringify(emptyData());

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const id = () => crypto.randomUUID();
const now = () => new Date().toISOString();

function migrateLegacy(raw: string | null): KinEthicData {
  const data = emptyData();
  if (!raw) {
    return data;
  }
  try {
    const profiles: unknown = JSON.parse(raw);
    if (!Array.isArray(profiles)) {
      return data;
    }
    for (const candidate of profiles) {
      if (
        !isRecord(candidate) ||
        typeof candidate.id !== "string" ||
        typeof candidate.name !== "string"
      )
        continue;
      const profileId = candidate.id;
      const stamp = now();
      const splitId = id();
      const schedule = emptySchedule();
      const legacySchedule = isRecord(candidate.schedule)
        ? candidate.schedule
        : {};
      for (const day of weekdays) {
        const entry = legacySchedule[day];
        if (!isRecord(entry) || entry.type === "rest") {
          continue;
        }
        const workoutId = id();
        data.workouts[workoutId] = {
          id: workoutId,
          profileId,
          name:
            typeof entry.title === "string" && entry.title.trim()
              ? entry.title.trim()
              : `${day[0].toUpperCase()}${day.slice(1)} Workout`,
          exercises: [],
          createdAt: stamp,
          updatedAt: stamp,
        };
        schedule[day] = workoutId;
      }
      data.splits[splitId] = {
        id: splitId,
        profileId,
        name: "My Split",
        schedule,
        createdAt: stamp,
        updatedAt: stamp,
      };
      data.profiles[profileId] = {
        id: profileId,
        name: candidate.name,
        accent:
          typeof candidate.accent === "string"
            ? candidate.accent
            : "from-cyan-300 via-blue-400 to-indigo-500",
        activeSplitId: splitId,
        createdAt: stamp,
        updatedAt: stamp,
      };
    }
  } catch {
    return data;
  }
  return data;
}

function sanitize(value: unknown): KinEthicData {
  if (
    !isRecord(value) ||
    ![1, 2, 3, 4, 5].includes(Number(value.schemaVersion))
  ) {
    return emptyData();
  }
  const data = emptyData();
  for (const key of [
    "profiles",
    "splits",
    "workouts",
    "exercises",
    "workoutSessions",
    "exercisePreferences",
  ] as const) {
    if (isRecord(value[key])) {
      data[key] = value[key] as never;
    }
  }

  const removedBuiltInIds = new Set(
    Object.values(data.exercises)
      .filter((exercise) => !exercise.isCustom)
      .map((exercise) => exercise.id),
  );

  if (removedBuiltInIds.size > 0) {
    for (const workout of Object.values(data.workouts)) {
      workout.exercises = workout.exercises.filter(
        (item) => !removedBuiltInIds.has(item.exerciseId),
      );
    }
    for (const preferences of Object.values(data.exercisePreferences)) {
      preferences.favoriteExerciseIds =
        preferences.favoriteExerciseIds.filter(
          (exerciseId) => !removedBuiltInIds.has(exerciseId),
        );
      preferences.recentExerciseIds = preferences.recentExerciseIds.filter(
        (exerciseId) => !removedBuiltInIds.has(exerciseId),
      );
    }
  }

  data.exercises = Object.fromEntries(
    Object.entries(data.exercises).filter(
      ([exerciseId]) => !removedBuiltInIds.has(exerciseId),
    ),
  );

  return data;
}

class LocalStorageRepository implements KinEthicRepository {
  private ensure(): string {
    if (typeof window === "undefined") {
      return SERVER_SNAPSHOT;
    }
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      raw = JSON.stringify(migrateLegacy(localStorage.getItem(LEGACY_KEY)));
      localStorage.setItem(STORAGE_KEY, raw);
    }
    try {
      const sanitized = JSON.stringify(sanitize(JSON.parse(raw)));
      if (sanitized !== raw) {
        localStorage.setItem(STORAGE_KEY, sanitized);
      }
      return sanitized;
    } catch {
      return SERVER_SNAPSHOT;
    }
  }
  getSnapshot = () => this.ensure();
  getServerSnapshot = () => SERVER_SNAPSHOT;
  read = () => JSON.parse(this.ensure()) as KinEthicData;
  subscribe = (listener: () => void) => {
    if (typeof window === "undefined") {
      return () => undefined;
    }
    const storage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        listener();
      }
    };
    window.addEventListener("storage", storage);
    window.addEventListener(CHANGE_EVENT, listener);
    return () => {
      window.removeEventListener("storage", storage);
      window.removeEventListener(CHANGE_EVENT, listener);
    };
  };
  private write(data: KinEthicData) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }
  createProfile(input: { name: string; accent: string }) {
    const data = this.read();
    const stamp = now();
    const profileId = id();
    const profile: Profile = {
      id: profileId,
      name: input.name.trim(),
      accent: input.accent,
      activeSplitId: null,
      createdAt: stamp,
      updatedAt: stamp,
    };
    data.profiles[profileId] = profile;
    this.write(data);
    return profile;
  }
  deleteProfile(profileId: Id) {
    const data = this.read();
    delete data.profiles[profileId];
    Object.values(data.splits)
      .filter((x) => x.profileId === profileId)
      .forEach((x) => delete data.splits[x.id]);
    Object.values(data.workouts)
      .filter((x) => x.profileId === profileId)
      .forEach((x) => delete data.workouts[x.id]);
    Object.values(data.workoutSessions)
      .filter((session) => session.profileId === profileId)
      .forEach((session) => delete data.workoutSessions[session.id]);
    delete data.exercisePreferences[profileId];
    this.write(data);
  }
  saveSplit(input: {
    id?: Id;
    profileId: Id;
    name: string;
    schedule: Record<DayKey, Id | null>;
  }) {
    const data = this.read();
    const existing = input.id ? data.splits[input.id] : undefined;
    const stamp = now();
    const split: WorkoutSplit = {
      id: existing?.id ?? id(),
      profileId: input.profileId,
      name: input.name.trim(),
      schedule: input.schedule,
      createdAt: existing?.createdAt ?? stamp,
      updatedAt: stamp,
    };
    data.splits[split.id] = split;
    this.write(data);
    return split;
  }
  setActiveSplit(profileId: Id, splitId: Id | null) {
    const data = this.read();
    const profile = data.profiles[profileId];
    if (
      !profile ||
      (splitId && data.splits[splitId]?.profileId !== profileId)
    ) {
      return;
    }
    data.profiles[profileId] = {
      ...profile,
      activeSplitId: splitId,
      updatedAt: now(),
    };
    this.write(data);
  }
  deleteSplit(splitId: Id) {
    const data = this.read();
    const split = data.splits[splitId];
    if (!split) {
      return;
    }
    delete data.splits[splitId];
    const profile = data.profiles[split.profileId];
    if (profile?.activeSplitId === splitId) {
      data.profiles[profile.id] = {
        ...profile,
        activeSplitId: null,
        updatedAt: now(),
      };
    }
    this.write(data);
  }
  saveWorkout(input: {
    id?: Id;
    profileId: Id;
    name: string;
    exercises: WorkoutExercise[];
  }) {
    const data = this.read();
    const existing = input.id ? data.workouts[input.id] : undefined;
    const stamp = now();
    const workout: Workout = {
      id: existing?.id ?? id(),
      profileId: input.profileId,
      name: input.name.trim(),
      exercises: input.exercises,
      createdAt: existing?.createdAt ?? stamp,
      updatedAt: stamp,
    };
    data.workouts[workout.id] = workout;
    this.write(data);
    return workout;
  }
  deleteWorkout(workoutId: Id) {
    const data = this.read();
    delete data.workouts[workoutId];
    for (const split of Object.values(data.splits))
      for (const day of weekdays)
        if (split.schedule[day] === workoutId) {
          split.schedule[day] = null;
        }
    this.write(data);
  }
  saveExercise(
    name: string,
    trackingType: TrackingType = "weight_reps",
    muscleGroup = "Other",
    equipment = "Other",
  ) {
    const data = this.read();
    const normalized = name.trim().toLocaleLowerCase();
    const found = Object.values(data.exercises).find(
      (exercise) => exercise.name.toLocaleLowerCase() === normalized,
    );
    if (found) {
      return found;
    }
    const exercise: ExerciseDefinition = {
      id: id(),
      name: name.trim(),
      muscleGroups: [muscleGroup],
      equipment: [equipment],
      isCustom: true,
      trackingType,
    };
    data.exercises[exercise.id] = exercise;
    this.write(data);
    return exercise;
  }
  deleteExercise(exerciseId: Id) {
    const data = this.read();
    const exercise = data.exercises[exerciseId];

    if (!exercise?.isCustom) {
      return;
    }

    delete data.exercises[exerciseId];

    for (const workout of Object.values(data.workouts)) {
      workout.exercises = workout.exercises.filter(
        (item) => item.exerciseId !== exerciseId,
      );
    }

    for (const preferences of Object.values(data.exercisePreferences)) {
      preferences.favoriteExerciseIds =
        preferences.favoriteExerciseIds.filter((id) => id !== exerciseId);
      preferences.recentExerciseIds = preferences.recentExerciseIds.filter(
        (id) => id !== exerciseId,
      );
    }

    this.write(data);
  }
  toggleFavoriteExercise(profileId: Id, exerciseId: Id) {
    const data = this.read();
    const preferences = data.exercisePreferences[profileId] ?? {
      favoriteExerciseIds: [],
      recentExerciseIds: [],
    };
    const isFavorite = preferences.favoriteExerciseIds.includes(exerciseId);

    data.exercisePreferences[profileId] = {
      ...preferences,
      favoriteExerciseIds: isFavorite
        ? preferences.favoriteExerciseIds.filter((id) => id !== exerciseId)
        : [...preferences.favoriteExerciseIds, exerciseId],
    };
    this.write(data);
  }
  recordRecentExercises(profileId: Id, exerciseIds: Id[]) {
    const data = this.read();
    const preferences = data.exercisePreferences[profileId] ?? {
      favoriteExerciseIds: [],
      recentExerciseIds: [],
    };
    const recentExerciseIds = [
      ...exerciseIds,
      ...preferences.recentExerciseIds.filter(
        (exerciseId) => !exerciseIds.includes(exerciseId),
      ),
    ].slice(0, 8);

    data.exercisePreferences[profileId] = {
      ...preferences,
      recentExerciseIds,
    };
    this.write(data);
  }
  startWorkoutSession(profileId: Id, workoutId: Id) {
    const data = this.read();
    const workout = data.workouts[workoutId];

    if (!workout || workout.profileId !== profileId) {
      return null;
    }

    const session: WorkoutSession = {
      id: id(),
      profileId,
      workoutId,
      workoutName: workout.name,
      startedAt: now(),
      completedAt: null,
      currentExerciseIndex: 0,
      restEndsAt: null,
      exercises: workout.exercises.map((item) => ({
        id: id(),
        templateExerciseId: item.id,
        exerciseId: item.exerciseId,
        exerciseName:
          data.exercises[item.exerciseId]?.name ?? "Unavailable exercise",
        target: item.reps,
        restSeconds: item.restSeconds,
        plannedWeight: item.weight,
        weightUnit: item.weightUnit ?? "lb",
        notes: item.notes,
        trackingType:
          item.trackingType ??
          data.exercises[item.exerciseId]?.trackingType ??
          "weight_reps",
        targetDurationSeconds: item.durationSeconds,
        plannedDistance: item.distance,
        plannedSpeed: item.speed,
        plannedIncline: item.incline,
        plannedResistance: item.resistance,
        sets: Array.from({ length: item.sets }, (_, index) => ({
          setNumber: index + 1,
          actualWeight: item.weight,
        })),
      })),
    };

    data.workoutSessions[session.id] = session;
    this.write(data);
    return session;
  }
  saveWorkoutSession(session: WorkoutSession) {
    const data = this.read();
    const storedSession = data.workoutSessions[session.id];

    if (!storedSession || storedSession.completedAt) {
      return;
    }

    data.workoutSessions[session.id] = session;
    this.write(data);
  }
  finishWorkoutSession(sessionId: Id) {
    const data = this.read();
    const session = data.workoutSessions[sessionId];

    if (!session || session.completedAt) {
      return null;
    }

    const completedSession = {
      ...session,
      completedAt: now(),
    };

    data.workoutSessions[sessionId] = completedSession;
    this.write(data);
    return completedSession;
  }
}

export const repository: KinEthicRepository = new LocalStorageRepository();

export const newWorkoutExercise = (
  exerciseId: Id,
  trackingType?: TrackingType,
): WorkoutExercise => ({
  id: id(),
  exerciseId,
  sets: 3,
  reps: { kind: "range", min: 8, max: 12 } as RepTarget,
  restSeconds: 90,
  trackingType,
  ...(trackingType === "duration" ? { durationSeconds: 60 } : {}),
  ...(trackingType === "cardio" ? { sets: 1, durationSeconds: 1200 } : {}),
});
