"use client";

import { useEffect, useMemo, useState } from "react";
import { ExerciseDefinition, Id } from "@/lib/kinethic/domain";
import { useKinEthicData } from "@/lib/kinethic/hooks";
import { repository } from "@/lib/kinethic/repository";

type ExercisePickerProps = {
  profileId: Id;
  onAdd(exerciseIds: Id[]): void;
  onClose(): void;
  onDelete?(exerciseId: Id): void;
};

type ExerciseSectionProps = {
  title: string;
  exercises: ExerciseDefinition[];
  selectedIds: Id[];
  favoriteIds: Id[];
  onSelect(exerciseId: Id): void;
  onFavorite(exerciseId: Id): void;
  onDelete(exercise: ExerciseDefinition): void;
};

function ExerciseSection({
  title,
  exercises,
  selectedIds,
  favoriteIds,
  onSelect,
  onFavorite,
  onDelete,
}: ExerciseSectionProps) {
  if (exercises.length === 0) {
    return null;
  }

  return (
    <section className="mt-7">
      <h2 className="text-sm font-semibold text-slate-300">{title}</h2>
      <div className="mt-3 space-y-2">
        {exercises.map((exercise) => {
          const selectionIndex = selectedIds.indexOf(exercise.id);
          const selected = selectionIndex >= 0;
          const favorite = favoriteIds.includes(exercise.id);

          return (
            <div
              className={`panel flex min-h-18 items-center gap-2 p-2 ${selected ? "theme-accent-surface" : ""}`}
              key={`${title}:${exercise.id}`}
            >
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl p-2 text-left"
                onClick={() => onSelect(exercise.id)}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${selected ? "border-[var(--profile-accent)] bg-[var(--profile-accent)] text-[var(--profile-primary-text)]" : "border-[var(--profile-border)] text-slate-400"}`}
                >
                  {selected ? selectionIndex + 1 : "+"}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold">
                    {exercise.name}
                  </span>
                  <span className="mt-1 block truncate text-xs text-slate-400">
                    {exercise.muscleGroups[0] ?? "Other"} ·{" "}
                    {exercise.equipment[0] ?? "Other"}
                  </span>
                </span>
              </button>
              <button
                type="button"
                aria-label={
                  favorite ? "Remove from favorites" : "Add to favorites"
                }
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl ${favorite ? "theme-accent-text" : "text-slate-500"}`}
                onClick={() => onFavorite(exercise.id)}
              >
                {favorite ? "★" : "☆"}
              </button>
              <button
                type="button"
                aria-label={`Delete ${exercise.name}`}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg text-red-300 transition hover:bg-red-300/10"
                onClick={() => onDelete(exercise)}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function ExercisePicker({
  profileId,
  onAdd,
  onClose,
  onDelete,
}: ExercisePickerProps) {
  const data = useKinEthicData();
  const [query, setQuery] = useState("");
  const [muscleFilter, setMuscleFilter] = useState("All");
  const [equipmentFilter, setEquipmentFilter] = useState("All");
  const [selectedIds, setSelectedIds] = useState<Id[]>([]);
  const [creatingCustom, setCreatingCustom] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customMuscle, setCustomMuscle] = useState("");
  const [customEquipment, setCustomEquipment] = useState("");
  const exercises = useMemo(
    () =>
      Object.values(data.exercises)
        .filter((exercise) => exercise.isCustom)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [data.exercises],
  );
  const preferences = data.exercisePreferences[profileId] ?? {
    favoriteExerciseIds: [],
    recentExerciseIds: [],
  };
  const muscleGroups = useMemo(
    () => [
      "All",
      ...new Set(exercises.flatMap((exercise) => exercise.muscleGroups)),
    ],
    [exercises],
  );
  const equipmentTypes = useMemo(
    () => [
      "All",
      ...new Set(exercises.flatMap((exercise) => exercise.equipment)),
    ],
    [exercises],
  );
  const filteredExercises = exercises.filter((exercise) => {
    const matchesQuery = exercise.name
      .toLocaleLowerCase()
      .includes(query.trim().toLocaleLowerCase());
    const matchesMuscle =
      muscleFilter === "All" || exercise.muscleGroups.includes(muscleFilter);
    const matchesEquipment =
      equipmentFilter === "All" || exercise.equipment.includes(equipmentFilter);

    return matchesQuery && matchesMuscle && matchesEquipment;
  });
  const recentExercises = preferences.recentExerciseIds
    .map((exerciseId) => data.exercises[exerciseId])
    .filter((exercise): exercise is ExerciseDefinition =>
      filteredExercises.some((candidate) => candidate.id === exercise?.id),
    );
  const favoriteExercises = preferences.favoriteExerciseIds
    .map((exerciseId) => data.exercises[exerciseId])
    .filter((exercise): exercise is ExerciseDefinition =>
      filteredExercises.some((candidate) => candidate.id === exercise?.id),
    );

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const toggleSelection = (exerciseId: Id) => {
    setSelectedIds((current) =>
      current.includes(exerciseId)
        ? current.filter((id) => id !== exerciseId)
        : [...current, exerciseId],
    );
  };
  const addSelectedExercises = () => {
    if (selectedIds.length === 0) {
      return;
    }

    repository.recordRecentExercises(profileId, selectedIds);
    onAdd(selectedIds);
  };
  const deleteCustomExercise = (exercise: ExerciseDefinition) => {
    if (
      !window.confirm(
        `Delete ${exercise.name}? It will also be removed from saved workouts, favorites, and recent exercises.`,
      )
    ) {
      return;
    }

    setSelectedIds((current) =>
      current.filter((exerciseId) => exerciseId !== exercise.id),
    );
    repository.deleteExercise(exercise.id);
    onDelete?.(exercise.id);
  };
  const createCustomExercise = () => {
    if (!customName.trim()) {
      return;
    }

    const exercise = repository.saveExercise(
      customName,
      "weight_reps",
      customMuscle.trim() || "Other",
      customEquipment.trim() || "Other",
    );

    setSelectedIds((current) =>
      current.includes(exercise.id) ? current : [...current, exercise.id],
    );
    setCreatingCustom(false);
    setCustomName("");
    setCustomMuscle("");
    setCustomEquipment("");
  };
  const sectionProps = {
    selectedIds,
    favoriteIds: preferences.favoriteExerciseIds,
    onSelect: toggleSelection,
    onFavorite: (exerciseId: Id) =>
      repository.toggleFavoriteExercise(profileId, exerciseId),
    onDelete: deleteCustomExercise,
  };

  return (
    <div
      aria-modal="true"
      role="dialog"
      className="profile-overlay fixed inset-0 z-[100] min-h-dvh overflow-y-auto overscroll-contain bg-[var(--profile-background)] text-white"
    >
      <div className="mx-auto min-h-full max-w-2xl px-4 pb-28">
        <header className="sticky top-0 z-20 -mx-4 border-b border-[var(--profile-border)] bg-[var(--profile-background)] px-4 pb-4 pt-4">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-xl font-semibold">Add exercises</h1>
            <button type="button" className="muted-button" onClick={onClose}>
              Close
            </button>
          </div>
          <label className="field mt-4">
            <span className="sr-only">Search exercises</span>
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search exercises"
            />
          </label>
        </header>

        <button
          type="button"
          className="primary-button mt-5"
          onClick={() => setCreatingCustom(true)}
        >
          Create Custom Exercise
        </button>

        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Muscle group
          </p>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
            {muscleGroups.map((muscle) => (
              <button
                type="button"
                className={
                  muscleFilter === muscle
                    ? "primary-button w-auto whitespace-nowrap"
                    : "muted-button whitespace-nowrap"
                }
                key={muscle}
                onClick={() => setMuscleFilter(muscle)}
              >
                {muscle}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Equipment
          </p>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
            {equipmentTypes.map((equipment) => (
              <button
                type="button"
                className={
                  equipmentFilter === equipment
                    ? "primary-button w-auto whitespace-nowrap"
                    : "muted-button whitespace-nowrap"
                }
                key={equipment}
                onClick={() => setEquipmentFilter(equipment)}
              >
                {equipment}
              </button>
            ))}
          </div>
        </div>

        <ExerciseSection
          title="Recent"
          exercises={recentExercises}
          {...sectionProps}
        />
        <ExerciseSection
          title="Favorites"
          exercises={favoriteExercises}
          {...sectionProps}
        />
        <ExerciseSection
          title="All Exercises"
          exercises={filteredExercises}
          {...sectionProps}
        />

        {filteredExercises.length === 0 && (
          <div className="panel mt-7 p-5 text-sm text-slate-400">
            No exercises match these filters.
          </div>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--profile-border)] bg-[var(--profile-background)] p-4">
        <button
          type="button"
          className="primary-button mx-auto max-w-2xl"
          disabled={selectedIds.length === 0}
          onClick={addSelectedExercises}
        >
          Add {selectedIds.length || ""}{" "}
          {selectedIds.length === 1 ? "Exercise" : "Exercises"}
        </button>
      </div>

      {creatingCustom && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-black/75 p-4">
          <div className="panel w-full max-w-md p-5">
            <h2 className="text-xl font-semibold">Create Custom Exercise</h2>
            <label className="field mt-5">
              <span>Name</span>
              <input
                value={customName}
                onChange={(event) => setCustomName(event.target.value)}
              />
            </label>
            <label className="field mt-4">
              <span>Primary muscle</span>
              <input
                value={customMuscle}
                onChange={(event) => setCustomMuscle(event.target.value)}
                placeholder="Other"
              />
            </label>
            <label className="field mt-4">
              <span>Equipment</span>
              <input
                value={customEquipment}
                onChange={(event) => setCustomEquipment(event.target.value)}
                placeholder="Other"
              />
            </label>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                className="muted-button"
                onClick={() => setCreatingCustom(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-button"
                disabled={!customName.trim()}
                onClick={createCustomExercise}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
