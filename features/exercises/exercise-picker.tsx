"use client";

import { useMemo, useState } from "react";
import { ListFilter, XIcon } from "lucide-react";
import {
  Equipment,
  ExerciseDefinition,
  Id,
  MuscleGroup,
  equipmentOptions,
  muscleGroupOptions,
} from "@/lib/kinethic/domain";
import { useKinEthicData } from "@/lib/kinethic/hooks";
import { repository } from "@/lib/kinethic/repository";
import { getProfileThemeStyle } from "@/app/_components/ui";
import { ConfirmAction } from "@/components/confirm-action";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ActionButton, AppInput, Surface } from "@/components/kinethic-ui";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Command, CommandInput } from "@/components/ui/command";

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
            <Surface
              className={`flex min-h-18 flex-row items-center gap-2 p-2 ${selected ? "theme-accent-surface" : ""}`}
              key={`${title}:${exercise.id}`}
            >
              <ActionButton
                tone="ghost"
                type="button"
                className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl p-2 text-left"
                onClick={() => onSelect(exercise.id)}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${selected ? "border-(--profile-accent) bg-(--profile-accent) text-(--profile-primary-text)" : "border-(--profile-border) text-slate-400"}`}
                >
                  {selected ? selectionIndex + 1 : "+"}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold">
                    {exercise.name}
                  </span>
                  <span className="mt-1 block truncate text-xs text-slate-400">
                    {exercise.primaryMuscleGroup}
                    {exercise.secondaryMuscleGroups.length > 0
                      ? ` + ${exercise.secondaryMuscleGroups.join(", ")}`
                      : ""}{" "}
                    · {exercise.equipment}
                  </span>
                </span>
              </ActionButton>
              <ActionButton
                tone="ghost"
                type="button"
                aria-label={
                  favorite ? "Remove from favorites" : "Add to favorites"
                }
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl ${favorite ? "theme-accent-text" : "text-slate-500"}`}
                onClick={() => onFavorite(exercise.id)}
              >
                {favorite ? "★" : "☆"}
              </ActionButton>
              {exercise.source === "custom" && (
                <ConfirmAction
                  trigger={
                    <ActionButton
                      tone="ghost"
                      type="button"
                      aria-label={`Delete ${exercise.name}`}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg text-red-300 transition hover:bg-red-300/10"
                    >
                      ×
                    </ActionButton>
                  }
                  title={`Delete ${exercise.name}?`}
                  description="It will also be removed from saved workouts, favorites, and recent exercises."
                  actionLabel="Delete exercise"
                  destructive
                  onConfirm={() => onDelete(exercise)}
                />
              )}
            </Surface>
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
  const profile = data.profiles[profileId];
  const [query, setQuery] = useState("");
  const [muscleFilter, setMuscleFilter] = useState<"All" | MuscleGroup>("All");
  const [equipmentFilter, setEquipmentFilter] = useState<"All" | Equipment>(
    "All",
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Id[]>([]);
  const [creatingCustom, setCreatingCustom] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customPrimaryMuscle, setCustomPrimaryMuscle] = useState<MuscleGroup>(
    muscleGroupOptions[0],
  );
  const [customSecondaryMuscles, setCustomSecondaryMuscles] = useState<
    MuscleGroup[]
  >([]);
  const [customEquipment, setCustomEquipment] = useState<Equipment>(
    equipmentOptions[0],
  );
  const exercises = useMemo(
    () =>
      Object.values(data.exercises).sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    [data.exercises],
  );
  const preferences = data.exercisePreferences[profileId] ?? {
    favoriteExerciseIds: [],
    recentExerciseIds: [],
  };
  const muscleGroups = ["All", ...muscleGroupOptions] as const;
  const equipmentTypes = ["All", ...equipmentOptions] as const;
  const filteredExercises = exercises.filter((exercise) => {
    const matchesQuery = exercise.name
      .toLocaleLowerCase()
      .includes(query.trim().toLocaleLowerCase());
    const matchesMuscle =
      muscleFilter === "All" ||
      exercise.primaryMuscleGroup === muscleFilter ||
      exercise.secondaryMuscleGroups.includes(muscleFilter);
    const matchesEquipment =
      equipmentFilter === "All" || exercise.equipment === equipmentFilter;

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
    setSelectedIds((current) =>
      current.filter((exerciseId) => exerciseId !== exercise.id),
    );
    repository.deleteExercise(exercise.id);
    onDelete?.(exercise.id);
  };
  const toggleCustomSecondaryMuscle = (muscleGroup: MuscleGroup) => {
    setCustomSecondaryMuscles((current) =>
      current.includes(muscleGroup)
        ? current.filter((item) => item !== muscleGroup)
        : [...current, muscleGroup],
    );
  };
  const createCustomExercise = () => {
    if (!customName.trim()) {
      return;
    }

    const exercise = repository.saveExercise(
      customName,
      "weight_reps",
      customPrimaryMuscle,
      customSecondaryMuscles,
      customEquipment,
    );

    setSelectedIds((current) =>
      current.includes(exercise.id) ? current : [...current, exercise.id],
    );
    setCreatingCustom(false);
    setCustomName("");
    setCustomPrimaryMuscle(muscleGroupOptions[0]);
    setCustomSecondaryMuscles([]);
    setCustomEquipment(equipmentOptions[0]);
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
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        style={profile ? getProfileThemeStyle(profile.accent) : undefined}
        className="profile-theme profile-overlay h-dvh w-[calc(100%-1rem)] max-w-none gap-0 overflow-hidden border-(--profile-border) bg-(--profile-background) p-0 text-white sm:w-[min(90vw,32rem)] sm:max-w-lg"
      >
        <SheetHeader className="shrink-0 border-b border-(--profile-border) bg-(--profile-background) px-4 py-4 text-left sm:px-6">
          <div className="flex min-h-11 items-center justify-between gap-3">
            <SheetTitle className="text-xl font-semibold text-white">
              Add exercises
            </SheetTitle>
            <SheetClose asChild>
              <ActionButton
                type="button"
                size="icon-lg"
                aria-label="Close add exercises"
                className="rounded-full border border-(--profile-border)"
              >
                <XIcon aria-hidden="true" />
              </ActionButton>
            </SheetClose>
          </div>
          <Command shouldFilter={false} className="mt-4 bg-transparent">
            <CommandInput
              autoFocus
              value={query}
              onValueChange={setQuery}
              placeholder="Search exercises"
              aria-label="Search exercises"
            />
          </Command>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6 sm:px-6">
          <ActionButton
            tone="primary"
            type="button"
            className="mt-5"
            onClick={() => setCreatingCustom(true)}
          >
            Create Exercise
          </ActionButton>

        <div className="mt-5">
          <ActionButton
            type="button"
            className="w-auto gap-2"
            aria-expanded={filtersOpen}
            aria-controls="exercise-filters"
            onClick={() => setFiltersOpen((open) => !open)}
          >
            <ListFilter aria-hidden="true" className="h-5 w-5" />
            Filters
            {(muscleFilter !== "All" || equipmentFilter !== "All") && (
              <span className="theme-accent-text text-xs">Active</span>
            )}
          </ActionButton>
          {filtersOpen && (
            <Surface
              id="exercise-filters"
              className="panel mt-3 grid gap-3 p-4 sm:grid-cols-2"
            >
              <label className="field">
                <span>Muscle group</span>
                <Select
                  value={muscleFilter}
                  onValueChange={(value) =>
                    setMuscleFilter(value as "All" | MuscleGroup)
                  }
                >
                  <SelectTrigger className="mt-2 min-h-12 w-full rounded-2xl border-(--profile-border) bg-(--profile-background)">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {muscleGroups.map((muscle) => (
                      <SelectItem key={muscle} value={muscle}>
                        {muscle}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <label className="field">
                <span>Equipment</span>
                <Select
                  value={equipmentFilter}
                  onValueChange={(value) =>
                    setEquipmentFilter(value as "All" | Equipment)
                  }
                >
                  <SelectTrigger className="mt-2 min-h-12 w-full rounded-2xl border-(--profile-border) bg-(--profile-background)">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {equipmentTypes.map((equipment) => (
                      <SelectItem key={equipment} value={equipment}>
                        {equipment}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              {(muscleFilter !== "All" || equipmentFilter !== "All") && (
                <ActionButton
                  type="button"
                  className="sm:col-span-2"
                  onClick={() => {
                    setMuscleFilter("All");
                    setEquipmentFilter("All");
                  }}
                >
                  Clear filters
                </ActionButton>
              )}
            </Surface>
          )}
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
            <Surface className="mt-7 p-5 text-sm text-slate-400">
              No exercises match these filters.
            </Surface>
          )}
        </div>

        <SheetFooter className="shrink-0 border-t border-(--profile-border) bg-(--profile-background) p-4 sm:px-6">
          <ActionButton
            tone="primary"
            type="button"
            disabled={selectedIds.length === 0}
            onClick={addSelectedExercises}
          >
            Add {selectedIds.length || ""}{" "}
            {selectedIds.length === 1 ? "Exercise" : "Exercises"}
          </ActionButton>
        </SheetFooter>

        <Dialog open={creatingCustom} onOpenChange={setCreatingCustom}>
          <DialogContent
            style={profile ? getProfileThemeStyle(profile.accent) : undefined}
            className="profile-theme max-h-[calc(100dvh-2rem)] overflow-y-auto border-(--profile-border) bg-(--profile-panel) text-white sm:max-w-md"
          >
            <DialogHeader>
              <DialogTitle>Create Custom Exercise</DialogTitle>
              <DialogDescription>
                Add a reusable exercise to your local library.
              </DialogDescription>
            </DialogHeader>
            <label className="field mt-5">
              <span>Name</span>
              <AppInput
                value={customName}
                onChange={(event) => setCustomName(event.target.value)}
              />
            </label>
            <label className="field mt-4">
              <span>Primary muscle group</span>
              <Select
                value={customPrimaryMuscle}
                onValueChange={(value) => {
                  const muscleGroup = value as MuscleGroup;
                  setCustomPrimaryMuscle(muscleGroup);
                  setCustomSecondaryMuscles((current) =>
                    current.filter((item) => item !== muscleGroup),
                  );
                }}
              >
                <SelectTrigger className="mt-2 min-h-12 w-full rounded-2xl border-(--profile-border) bg-(--profile-background)">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {muscleGroupOptions.map((muscleGroup) => (
                    <SelectItem key={muscleGroup} value={muscleGroup}>
                      {muscleGroup}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <fieldset className="mt-4">
              <legend className="text-sm font-medium text-slate-300">
                Secondary muscle groups (optional)
              </legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {muscleGroupOptions
                  .filter((muscleGroup) => muscleGroup !== customPrimaryMuscle)
                  .map((muscleGroup) => {
                    const selected =
                      customSecondaryMuscles.includes(muscleGroup);

                    return (
                      <ActionButton
                        tone="ghost"
                        type="button"
                        key={muscleGroup}
                        aria-pressed={selected}
                        className={
                          selected
                            ? "theme-accent-surface min-h-11 rounded-xl border px-3 py-2 text-sm font-semibold"
                            : "min-h-11 rounded-xl border border-(--profile-border) px-3 py-2 text-sm text-slate-300"
                        }
                        onClick={() => toggleCustomSecondaryMuscle(muscleGroup)}
                      >
                        {muscleGroup}
                      </ActionButton>
                    );
                  })}
              </div>
            </fieldset>
            <label className="field mt-4">
              <span>Equipment</span>
              <Select
                value={customEquipment}
                onValueChange={(value) =>
                  setCustomEquipment(value as Equipment)
                }
              >
                <SelectTrigger className="mt-2 min-h-12 w-full rounded-2xl border-(--profile-border) bg-(--profile-background)">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {equipmentOptions.map((equipment) => (
                    <SelectItem key={equipment} value={equipment}>
                      {equipment}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <ActionButton
                type="button"
                onClick={() => setCreatingCustom(false)}
              >
                Cancel
              </ActionButton>
              <ActionButton
                tone="primary"
                type="button"
                disabled={!customName.trim()}
                onClick={createCustomExercise}
              >
                Create
              </ActionButton>
            </div>
          </DialogContent>
        </Dialog>
      </SheetContent>
    </Sheet>
  );
}
