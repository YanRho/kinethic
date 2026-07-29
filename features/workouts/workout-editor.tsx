"use client";

import {
  createContext,
  FormEvent,
  ReactNode,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useRouter } from "next/navigation";
import { GripVertical, SlidersHorizontal, X } from "lucide-react";
import {
  WheelPicker,
  WheelPickerOption,
  WheelPickerValue,
  WheelPickerWrapper,
} from "@ncdai/react-wheel-picker";
import {
  PageShell,
  EmptyState,
  getProfileThemeStyle,
} from "@/app/_components/ui";
import {
  Id,
  RepTarget,
  TrackingType,
  WorkoutExercise,
  nameKey,
} from "@/lib/kinethic/domain";
import { useKinEthicData } from "@/lib/kinethic/hooks";
import { newWorkoutExercise, repository } from "@/lib/kinethic/repository";
import { ExercisePicker } from "@/features/exercises/exercise-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  ActionButton,
  AppInput,
  AppTextarea,
  Surface,
} from "@/components/kinethic-ui";

const workoutNamePlaceholders = [
  "Iron Forge",
  "Strength Circuit",
  "Power Hour",
  "Upper Body Blitz",
  "Leg Day Legends",
  "Full Body Fuel",
  "Push Day Power",
  "Pull Day Progress",
  "Weekend Warrior",
  "Morning Momentum",
];
let lastWorkoutNamePlaceholderIndex = -1;

const randomWorkoutNamePlaceholder = () => {
  const availableCount =
    lastWorkoutNamePlaceholderIndex < 0
      ? workoutNamePlaceholders.length
      : workoutNamePlaceholders.length - 1;
  let index =
    crypto.getRandomValues(new Uint32Array(1))[0] % availableCount;

  if (
    lastWorkoutNamePlaceholderIndex >= 0 &&
    index >= lastWorkoutNamePlaceholderIndex
  ) {
    index += 1;
  }

  lastWorkoutNamePlaceholderIndex = index;
  return workoutNamePlaceholders[index];
};

const mobileEditorQuery = "(max-width: 639px)";
const MobileEditorContext = createContext(false);

const subscribeToMobileEditor = (onChange: () => void) => {
  const query = window.matchMedia(mobileEditorQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

const getMobileEditorSnapshot = () =>
  window.matchMedia(mobileEditorQuery).matches;

const getMobileEditorServerSnapshot = () => false;

const numberOptions = (
  start: number,
  end: number,
  step = 1,
  format: (value: number) => ReactNode = (value) => value,
): WheelPickerOption<number>[] =>
  Array.from({ length: Math.floor((end - start) / step) + 1 }, (_, index) => {
    const value = start + index * step;
    return { value, label: format(value) };
  });

const trackingTypeOptions: WheelPickerOption<TrackingType>[] = [
  { value: "weight_reps", label: "Weight and reps" },
  { value: "reps", label: "Reps only" },
  { value: "duration", label: "Duration" },
];
const initialTrackingTypeOptions: WheelPickerOption<TrackingType | "">[] = [
  { value: "", label: "Choose tracking type" },
  ...trackingTypeOptions,
];
const repTargetOptions: WheelPickerOption<RepTarget["kind"]>[] = [
  { value: "range", label: "Range" },
  { value: "exact", label: "Exact" },
];
const weightUnitOptions: WheelPickerOption<"lb" | "kg">[] = [
  { value: "lb", label: "lb" },
  { value: "kg", label: "kg" },
];
const setOptions = numberOptions(1, 20);
const repOptions = numberOptions(1, 100);
const minuteOptions = numberOptions(0, 10);
const secondOptions = numberOptions(0, 59, 1, (seconds) =>
  seconds.toString().padStart(2, "0"),
);
const formatRestTime = (seconds: number) => {
  if (seconds === 0) return "No rest";
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return minutes
    ? `${minutes} min${remainder ? ` ${remainder} sec` : ""}`
    : `${seconds} sec`;
};

const wheelClassNames = {
  optionItem: "text-slate-500",
  highlightWrapper:
    "rounded-xl border-y border-cyan-300/20 bg-[#102238] text-lg text-white",
  highlightItem: "font-semibold text-white",
};

function AdaptiveWheelControl<T extends WheelPickerValue>({
  title,
  value,
  options,
  onValueChange,
  children,
}: {
  title: string;
  value: T;
  options: WheelPickerOption<T>[];
  onValueChange: (value: T) => void;
  children: ReactNode;
}) {
  const mobile = useContext(MobileEditorContext);
  const [open, setOpen] = useState(false);
  const [draftValue, setDraftValue] = useState(value);
  const selectedOption = options.find((option) => option.value === value);

  if (!mobile) return children;

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) setDraftValue(value);
        setOpen(nextOpen);
      }}
    >
      <SheetTrigger asChild>
        <button
          type="button"
          className="mt-2 flex min-h-12 w-full items-center justify-between rounded-2xl border border-(--profile-border) bg-(--profile-background) px-4 py-3 text-left text-base text-white outline-none transition active:scale-[0.99]"
        >
          <span>{selectedOption?.label ?? value}</span>
          <span className="text-xs font-semibold text-(--profile-accent)">
            Change
          </span>
        </button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="z-[70] gap-0 rounded-t-3xl border-white/10 bg-[#0c1929] text-white"
      >
        <SheetHeader className="flex-row items-center justify-between border-b border-white/10">
          <ActionButton type="button" onClick={() => setOpen(false)}>
            Cancel
          </ActionButton>
          <SheetTitle className="text-center text-white">{title}</SheetTitle>
          <ActionButton
            type="button"
            tone="primary"
            className="min-h-10 w-auto rounded-xl px-4 py-2 text-sm"
            onClick={() => {
              onValueChange(draftValue);
              setOpen(false);
            }}
          >
            Done
          </ActionButton>
        </SheetHeader>
        <div className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <WheelPickerWrapper className="h-56">
            <WheelPicker
              value={draftValue}
              onValueChange={setDraftValue}
              options={options}
              visibleCount={20}
              optionItemHeight={44}
              classNames={wheelClassNames}
            />
          </WheelPickerWrapper>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function AdaptiveRestControl({
  value,
  onValueChange,
  children,
}: {
  value: number;
  onValueChange: (value: number) => void;
  children: ReactNode;
}) {
  const mobile = useContext(MobileEditorContext);
  const [open, setOpen] = useState(false);
  const [minutes, setMinutes] = useState(Math.floor(value / 60));
  const [seconds, setSeconds] = useState(value % 60);

  if (!mobile) return children;

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          setMinutes(Math.min(10, Math.floor(value / 60)));
          setSeconds(value % 60);
        }
        setOpen(nextOpen);
      }}
    >
      <SheetTrigger asChild>
        <button
          type="button"
          className="mt-2 flex min-h-12 w-full items-center justify-between rounded-2xl border border-(--profile-border) bg-(--profile-background) px-4 py-3 text-left text-base text-white outline-none transition active:scale-[0.99]"
        >
          <span>{formatRestTime(value)}</span>
          <span className="text-xs font-semibold text-(--profile-accent)">
            Change
          </span>
        </button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="z-[70] gap-0 rounded-t-3xl border-white/10 bg-[#0c1929] text-white"
      >
        <SheetHeader className="flex-row items-center justify-between border-b border-white/10">
          <ActionButton type="button" onClick={() => setOpen(false)}>
            Cancel
          </ActionButton>
          <SheetTitle className="text-center text-white">Rest time</SheetTitle>
          <ActionButton
            type="button"
            tone="primary"
            className="min-h-10 w-auto rounded-xl px-4 py-2 text-sm"
            onClick={() => {
              onValueChange(minutes * 60 + seconds);
              setOpen(false);
            }}
          >
            Done
          </ActionButton>
        </SheetHeader>
        <div className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <div className="grid grid-cols-2 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
            <span>Minutes</span>
            <span>Seconds</span>
          </div>
          <WheelPickerWrapper className="mt-1 h-56">
            <WheelPicker
              value={minutes}
              onValueChange={setMinutes}
              options={minuteOptions}
              visibleCount={20}
              optionItemHeight={44}
              classNames={wheelClassNames}
            />
            <WheelPicker
              value={seconds}
              onValueChange={setSeconds}
              options={secondOptions}
              visibleCount={20}
              optionItemHeight={44}
              classNames={wheelClassNames}
            />
          </WheelPickerWrapper>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ExerciseSettingsRoot({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  const mobile = useSyncExternalStore(
    subscribeToMobileEditor,
    getMobileEditorSnapshot,
    getMobileEditorServerSnapshot,
  );

  return (
    <MobileEditorContext.Provider value={mobile}>
      {mobile ? (
        <Sheet open={open} onOpenChange={onOpenChange}>
          {children}
        </Sheet>
      ) : (
        <Popover open={open} onOpenChange={onOpenChange}>
          {children}
        </Popover>
      )}
    </MobileEditorContext.Provider>
  );
}

function ExerciseSettingsTrigger({ children }: { children: ReactNode }) {
  const mobile = useContext(MobileEditorContext);

  return mobile ? (
    <SheetTrigger asChild>{children}</SheetTrigger>
  ) : (
    <PopoverTrigger asChild>{children}</PopoverTrigger>
  );
}

function ExerciseSettingsContent({
  title,
  children,
  style,
}: {
  title: string;
  children: ReactNode;
  style: ReturnType<typeof getProfileThemeStyle>;
}) {
  const mobile = useContext(MobileEditorContext);

  if (mobile) {
    return (
      <SheetContent
        side="bottom"
        className="max-h-[90dvh] gap-0 overflow-hidden rounded-t-3xl border-(--profile-border) bg-(--profile-panel) text-white data-[side=bottom]:h-[min(90dvh,44rem)]"
        style={style}
      >
        <SheetHeader className="shrink-0 border-b border-(--profile-border) pr-14">
          <SheetTitle className="text-left text-white">{title}</SheetTitle>
        </SheetHeader>
        <div className="touch-pan-y overflow-y-auto overscroll-contain p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {children}
        </div>
      </SheetContent>
    );
  }

  return (
    <PopoverContent
      align="center"
      sideOffset={8}
      collisionPadding={16}
      className="max-h-[min(calc(100dvh-2rem),var(--radix-popover-content-available-height),42rem)] w-[min(calc(100vw-2rem),32rem)] overflow-y-auto overscroll-contain border border-(--profile-border) bg-(--profile-panel) p-4 text-white"
      style={style}
    >
      {children}
    </PopoverContent>
  );
}

export function WorkoutEditor({
  profileId,
  workoutId,
}: {
  profileId: Id;
  workoutId?: Id;
}) {
  const data = useKinEthicData();
  const router = useRouter();
  const profile = data.profiles[profileId];
  const existing = workoutId ? data.workouts[workoutId] : undefined;
  const [name, setName] = useState(existing?.name ?? "");
  const [namePlaceholder, setNamePlaceholder] = useState(
    workoutNamePlaceholders[0],
  );
  const [items, setItems] = useState<WorkoutExercise[]>(
    existing?.exercises.map((item) => ({
      ...item,
      trackingType:
        item.trackingType ??
        data.exercises[item.exerciseId]?.trackingType ??
        "weight_reps",
    })) ?? [],
  );
  const [openExerciseId, setOpenExerciseId] = useState<Id | null>(null);
  const [picker, setPicker] = useState(false);
  const [draggedExerciseId, setDraggedExerciseId] = useState<Id | null>(null);
  const [dragOverExerciseId, setDragOverExerciseId] = useState<Id | null>(null);
  const cardElements = useRef(new Map<Id, HTMLElement>());
  const cardAnimations = useRef(new Map<Id, Animation>());
  const previousCardPositions = useRef(new Map<Id, DOMRect>());
  const lastReorderTargetId = useRef<Id | null>(null);
  const duplicateWorkoutName = Object.values(data.workouts).some(
    (workout) =>
      workout.profileId === profileId &&
      workout.id !== workoutId &&
      nameKey(workout.name) === nameKey(name),
  );

  useEffect(() => {
    if (workoutId) return;

    const frame = requestAnimationFrame(() => {
      setNamePlaceholder(randomWorkoutNamePlaceholder());
    });

    return () => cancelAnimationFrame(frame);
  }, [workoutId]);

  useLayoutEffect(() => {
    const nextPositions = new Map<Id, DOMRect>();

    for (const item of items) {
      const element = cardElements.current.get(item.id);

      if (!element) {
        continue;
      }

      cardAnimations.current.get(item.id)?.cancel();

      const nextPosition = element.getBoundingClientRect();
      const previousPosition = previousCardPositions.current.get(item.id);

      nextPositions.set(item.id, nextPosition);

      if (!previousPosition) {
        continue;
      }

      const horizontalChange = previousPosition.left - nextPosition.left;
      const verticalChange = previousPosition.top - nextPosition.top;

      if (horizontalChange === 0 && verticalChange === 0) {
        continue;
      }

      const animation = element.animate(
        [
          {
            transform: `translate(${horizontalChange}px, ${verticalChange}px)`,
          },
          { transform: "translate(0, 0)" },
        ],
        {
          duration: 420,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
        },
      );

      cardAnimations.current.set(item.id, animation);
    }

    previousCardPositions.current = nextPositions;
  }, [items]);
  if (
    !profile ||
    (workoutId && (!existing || existing.profileId !== profileId))
  )
    return (
      <PageShell backHref="/profiles">
        <EmptyState
          eyebrow="Not found"
          title="Workout unavailable"
          body="This workout is not available for this local profile."
        />
      </PageShell>
    );

  const addExercises = (exerciseIds: Id[]) => {
    const newItems = exerciseIds.map((exerciseId) =>
      newWorkoutExercise(exerciseId),
    );
    const lastNewItem = newItems.at(-1);

    setItems((current) => [...current, ...newItems]);
    setOpenExerciseId(lastNewItem?.id ?? null);
    setPicker(false);
  };
  const removeExercise = (exerciseId: Id) => {
    setItems((current) => current.filter((item) => item.id !== exerciseId));
    setOpenExerciseId((current) => (current === exerciseId ? null : current));
  };
  const update = (index: number, patch: Partial<WorkoutExercise>) =>
    setItems((current) =>
      current.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  const changeTrackingType = (index: number, trackingType: TrackingType) => {
    const item = items[index];
    const previousTrackingType = item.trackingType ?? "weight_reps";

    update(index, {
      trackingType,
      durationSeconds:
        trackingType === "duration"
          ? previousTrackingType === "duration"
            ? item.durationSeconds
            : 60
          : item.durationSeconds,
    });
  };
  const reorderExercise = (sourceId: Id, targetId: Id) => {
    if (sourceId === targetId) {
      return;
    }

    setItems((current) => {
      const sourceIndex = current.findIndex((item) => item.id === sourceId);
      const targetIndex = current.findIndex((item) => item.id === targetId);

      if (sourceIndex < 0 || targetIndex < 0) {
        return current;
      }

      const next = [...current];
      const [sourceItem] = next.splice(sourceIndex, 1);

      next.splice(targetIndex, 0, sourceItem);
      return next;
    });
  };
  const finishDragging = () => {
    setDraggedExerciseId(null);
    setDragOverExerciseId(null);
    lastReorderTargetId.current = null;
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (
      !name.trim() ||
      duplicateWorkoutName ||
      items.some((item) => !item.trackingType)
    ) {
      return;
    }
    const saved = repository.saveWorkout({
      id: workoutId,
      profileId,
      name,
      exercises: items,
    });
    if (saved) {
      router.replace(`/profiles/${profileId}/workouts`);
    }
  };
  return (
    <PageShell
      backHref={`/profiles/${profileId}/workouts`}
      title={existing ? "Edit workout" : "New workout"}
      profile={profile}
    >
      <form
        onSubmit={submit}
        className="pb-28 pt-6 lg:grid lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start lg:gap-8"
      >
        <aside className="lg:sticky lg:top-6">
          <label className="field">
            <span>Workout name</span>
            <AppInput
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={namePlaceholder}
              aria-invalid={duplicateWorkoutName}
            />
          </label>
          {duplicateWorkoutName && (
            <p className="mt-2 text-sm text-red-200">
              A workout with this name already exists.
            </p>
          )}
          <Surface className="mt-5 hidden p-4 text-sm leading-6 text-slate-400 lg:block">
            Exercises are performed from top to bottom. Use the move controls to
            keep their order clear on every device.
          </Surface>
        </aside>
        <div>
          <div className="mt-8 flex items-center justify-between gap-3 lg:mt-0">
            <div className="min-w-0">
              <p className="eyebrow">Exercises</p>
              <h1 className="mt-1 text-xl font-semibold">Training order</h1>
            </div>
            <ActionButton
              type="button"
              onClick={() => setPicker(true)}
            >
              + Add
            </ActionButton>
          </div>
          <div className="mt-4 space-y-4">
            {items.length === 0 && (
              <Surface className="p-5 text-sm leading-6 text-slate-400">
                No exercises yet. Add an exercise and configure its training
                targets.
              </Surface>
            )}
            {items.map((item, index) => {
              const exercise = data.exercises[item.exerciseId];
              const reps = item.reps;
              const trackingType = item.trackingType;
              const open = openExerciseId === item.id;
              const repSummary =
                trackingType === undefined
                  ? "Choose a tracking type"
                  : trackingType === "duration"
                    ? `${item.durationSeconds ?? 0}s`
                    : reps.kind === "exact"
                      ? `${reps.reps} reps`
                      : `${reps.min}–${reps.max} reps`;
              return (
                <Surface
                  key={item.id}
                  data-exercise-card
                  ref={(element) => {
                    if (element) {
                      cardElements.current.set(item.id, element);
                    } else {
                      cardElements.current.delete(item.id);
                    }
                  }}
                  onDragEnter={() => {
                    if (
                      draggedExerciseId &&
                      draggedExerciseId !== item.id &&
                      lastReorderTargetId.current !== item.id
                    ) {
                      reorderExercise(draggedExerciseId, item.id);
                      lastReorderTargetId.current = item.id;
                    }

                    setDragOverExerciseId(item.id);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragOverExerciseId(item.id);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    finishDragging();
                  }}
                  className={`panel overflow-hidden transition ${draggedExerciseId === item.id ? "opacity-45" : ""} ${dragOverExerciseId === item.id && draggedExerciseId !== item.id ? "theme-accent-surface" : ""}`}
                >
                  <ExerciseSettingsRoot
                    open={open}
                    onOpenChange={(nextOpen) =>
                      setOpenExerciseId(nextOpen ? item.id : null)
                    }
                  >
                  <div className="flex items-start gap-1 sm:gap-2">
                    <ActionButton
                      tone="ghost"
                      type="button"
                      draggable
                      aria-label={`Drag to reorder ${exercise?.name ?? "exercise"}`}
                      title="Drag to reorder"
                      onDragStart={(event) => {
                        event.dataTransfer.effectAllowed = "move";
                        event.dataTransfer.setData("text/plain", item.id);
                        const card = event.currentTarget.closest(
                          "[data-exercise-card]",
                        );

                        if (card instanceof HTMLElement) {
                          const bounds = card.getBoundingClientRect();

                          event.dataTransfer.setDragImage(
                            card,
                            Math.min(32, bounds.width / 2),
                            24,
                          );
                        }

                        setDraggedExerciseId(item.id);
                      }}
                      onDragEnd={finishDragging}
                      className="theme-accent-text ml-1 mt-4 flex min-h-11 w-9 cursor-grab touch-none items-center justify-center rounded-xl sm:ml-2 sm:w-10 active:cursor-grabbing"
                    >
                      <GripVertical aria-hidden="true" />
                    </ActionButton>
                    <ExerciseSettingsTrigger>
                      <ActionButton
                        tone="ghost"
                        type="button"
                        aria-expanded={open}
                        className="min-w-0 flex min-h-20 flex-1 items-center justify-between gap-2 px-2 py-4 text-left sm:gap-4 sm:p-4"
                      >
                      <span className="min-w-0">
                        <span className="block text-xs text-slate-500">
                          Exercise {index + 1}
                        </span>
                        <span className="mt-1 block truncate font-semibold">
                          {exercise?.name ?? "Unavailable exercise"}
                        </span>
                        <span className="mt-1 block break-words text-xs text-slate-400">
                          {item.sets} sets · {repSummary} · {item.restSeconds}s
                          rest
                          {item.weight !== undefined
                            ? ` · ${item.weight} ${item.weightUnit ?? "lb"}`
                            : ""}
                        </span>
                      </span>
                        <SlidersHorizontal
                          aria-hidden="true"
                          className="theme-accent-text h-5 w-5 shrink-0"
                        />
                      </ActionButton>
                    </ExerciseSettingsTrigger>
                    <ActionButton
                      tone="ghost"
                      type="button"
                      onClick={() => removeExercise(item.id)}
                      size="icon-lg"
                      aria-label={`Remove ${exercise?.name ?? "exercise"}`}
                      title="Remove exercise"
                      className="mr-1 mt-4 rounded-xl text-red-200 sm:mr-4"
                    >
                      <X aria-hidden="true" />
                    </ActionButton>
                  </div>
                  <ExerciseSettingsContent
                    title={`Edit ${exercise?.name ?? "exercise"}`}
                    style={getProfileThemeStyle(profile.accent)}
                  >
                    <div>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="field col-span-2">
                          <span>Tracking type</span>
                          <AdaptiveWheelControl
                            title="Tracking type"
                            value={trackingType ?? ""}
                            options={
                              trackingType
                                ? trackingTypeOptions
                                : initialTrackingTypeOptions
                            }
                            onValueChange={(value) => {
                              if (value) {
                                changeTrackingType(index, value);
                              }
                            }}
                          >
                            <Select
                              value={trackingType ?? ""}
                              onValueChange={(value) =>
                                changeTrackingType(index, value as TrackingType)
                              }
                            >
                              <SelectTrigger className="mt-2 min-h-12 w-full rounded-2xl border-(--profile-border) bg-(--profile-background)">
                                <SelectValue placeholder="Choose tracking type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="weight_reps">
                                  Weight and reps
                                </SelectItem>
                                <SelectItem value="reps">Reps only</SelectItem>
                                <SelectItem value="duration">Duration</SelectItem>
                              </SelectContent>
                            </Select>
                          </AdaptiveWheelControl>
                        </label>
                        {trackingType && (
                          <div className="col-span-2 grid grid-cols-2 gap-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                            <label className="field">
                              <span>Sets</span>
                              <AdaptiveWheelControl
                                title="Sets"
                                value={item.sets}
                                options={setOptions}
                                onValueChange={(sets) =>
                                  update(index, { sets })
                                }
                              >
                                <AppInput
                                  type="number"
                                  inputMode="numeric"
                                  min="1"
                                  value={item.sets}
                                  onChange={(e) =>
                                    update(index, {
                                      sets: Math.max(1, Number(e.target.value)),
                                    })
                                  }
                                />
                              </AdaptiveWheelControl>
                            </label>
                            {(trackingType === "weight_reps" ||
                              trackingType === "reps") && (
                              <>
                                <label className="field">
                                  <span>Rep target</span>
                                  <AdaptiveWheelControl
                                    title="Rep target"
                                    value={reps.kind}
                                    options={repTargetOptions}
                                    onValueChange={(value) =>
                                      update(index, {
                                        reps:
                                          value === "exact"
                                            ? { kind: "exact", reps: 10 }
                                            : {
                                                kind: "range",
                                                min: 8,
                                                max: 12,
                                              },
                                      })
                                    }
                                  >
                                    <Select
                                      value={reps.kind}
                                      onValueChange={(value) =>
                                        update(index, {
                                          reps:
                                            value === "exact"
                                              ? { kind: "exact", reps: 10 }
                                              : {
                                                  kind: "range",
                                                  min: 8,
                                                  max: 12,
                                                },
                                        })
                                      }
                                    >
                                      <SelectTrigger className="mt-2 min-h-12 w-full rounded-2xl border-(--profile-border) bg-(--profile-background)">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="range">
                                          Range
                                        </SelectItem>
                                        <SelectItem value="exact">
                                          Exact
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </AdaptiveWheelControl>
                                </label>
                                {reps.kind === "exact" ? (
                                  <label className="field">
                                    <span>Reps</span>
                                    <AdaptiveWheelControl
                                      title="Reps"
                                      value={Math.max(1, reps.reps)}
                                      options={repOptions}
                                      onValueChange={(value) =>
                                        update(index, {
                                          reps: {
                                            kind: "exact",
                                            reps: Number(value),
                                          },
                                        })
                                      }
                                    >
                                      <AppInput
                                        type="number"
                                        inputMode="numeric"
                                        min="1"
                                        value={reps.reps || ""}
                                        onChange={(event) =>
                                          update(index, {
                                            reps: {
                                              kind: "exact",
                                              reps: Number(event.target.value),
                                            },
                                          })
                                        }
                                        onBlur={() => {
                                          if (reps.reps < 1) {
                                            update(index, {
                                              reps: { kind: "exact", reps: 1 },
                                            });
                                          }
                                        }}
                                      />
                                    </AdaptiveWheelControl>
                                  </label>
                                ) : (
                                  <>
                                    <label className="field">
                                      <span>Min reps</span>
                                      <AdaptiveWheelControl
                                        title="Minimum reps"
                                        value={Math.max(1, reps.min)}
                                        options={repOptions}
                                        onValueChange={(value) =>
                                          update(index, {
                                            reps: {
                                              ...reps,
                                              min: Number(value),
                                            } as RepTarget,
                                          })
                                        }
                                      >
                                        <AppInput
                                          type="number"
                                          inputMode="numeric"
                                          min="1"
                                          value={reps.min || ""}
                                          onChange={(event) =>
                                            update(index, {
                                              reps: {
                                                ...reps,
                                                min: Number(event.target.value),
                                              } as RepTarget,
                                            })
                                          }
                                          onBlur={() => {
                                            if (reps.min < 1) {
                                              update(index, {
                                                reps: {
                                                  ...reps,
                                                  min: 1,
                                                } as RepTarget,
                                              });
                                            }
                                          }}
                                        />
                                      </AdaptiveWheelControl>
                                    </label>
                                    <label className="field">
                                      <span>Max reps</span>
                                      <AdaptiveWheelControl
                                        title="Maximum reps"
                                        value={Math.max(1, reps.max)}
                                        options={repOptions}
                                        onValueChange={(value) =>
                                          update(index, {
                                            reps: {
                                              ...reps,
                                              max: Number(value),
                                            } as RepTarget,
                                          })
                                        }
                                      >
                                        <AppInput
                                          type="number"
                                          inputMode="numeric"
                                          min="1"
                                          value={reps.max || ""}
                                          onChange={(event) =>
                                            update(index, {
                                              reps: {
                                                ...reps,
                                                max: Number(event.target.value),
                                              } as RepTarget,
                                            })
                                          }
                                          onBlur={() => {
                                            if (reps.max < 1) {
                                              update(index, {
                                                reps: {
                                                  ...reps,
                                                  max: 1,
                                                } as RepTarget,
                                              });
                                            }
                                          }}
                                        />
                                      </AdaptiveWheelControl>
                                    </label>
                                  </>
                                )}
                              </>
                            )}
                            <label className="field">
                              <span>Rest (seconds)</span>
                              <AdaptiveRestControl
                                value={item.restSeconds}
                                onValueChange={(restSeconds) =>
                                  update(index, { restSeconds })
                                }
                              >
                                <AppInput
                                  type="number"
                                  inputMode="numeric"
                                  min="0"
                                  step="15"
                                  value={item.restSeconds}
                                  onChange={(e) =>
                                    update(index, {
                                      restSeconds: Math.max(
                                        0,
                                        Number(e.target.value),
                                      ),
                                    })
                                  }
                                />
                              </AdaptiveRestControl>
                            </label>
                            {trackingType === "weight_reps" && (
                              <>
                                <label className="field">
                                  <span>Weight (optional)</span>
                                  <AppInput
                                    type="number"
                                    inputMode="decimal"
                                    min="0"
                                    step="0.5"
                                    value={item.weight ?? ""}
                                    onChange={(event) =>
                                      update(index, {
                                        weight: event.target.value
                                          ? Number(event.target.value)
                                          : undefined,
                                      })
                                    }
                                  />
                                </label>
                                <label className="field">
                                  <span>Unit</span>
                                  <AdaptiveWheelControl
                                    title="Weight unit"
                                    value={item.weightUnit ?? "lb"}
                                    options={weightUnitOptions}
                                    onValueChange={(value) =>
                                      update(index, {
                                        weightUnit: value as "lb" | "kg",
                                      })
                                    }
                                  >
                                    <Select
                                      value={item.weightUnit ?? "lb"}
                                      onValueChange={(value) =>
                                        update(index, {
                                          weightUnit: value as "lb" | "kg",
                                        })
                                      }
                                    >
                                      <SelectTrigger className="mt-2 min-h-12 w-full rounded-2xl border-(--profile-border) bg-(--profile-background)">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="lb">lb</SelectItem>
                                        <SelectItem value="kg">kg</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </AdaptiveWheelControl>
                                </label>
                              </>
                            )}
                            {trackingType === "duration" && (
                              <label className="field">
                                <span>Target duration (seconds)</span>
                                <AppInput
                                  type="number"
                                  inputMode="numeric"
                                  min="1"
                                  value={item.durationSeconds ?? ""}
                                  onChange={(event) =>
                                    update(index, {
                                      durationSeconds: event.target.value
                                        ? Number(event.target.value)
                                        : undefined,
                                    })
                                  }
                                />
                              </label>
                            )}
                          </div>
                        )}
                      </div>
                      {!trackingType && (
                        <p className="mt-4 text-sm leading-6 text-slate-400">
                          Choose how this exercise should be tracked to
                          configure its targets.
                        </p>
                      )}
                      {trackingType && (
                        <label className="field mt-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                          <span>Notes (optional)</span>
                          <AppTextarea
                            rows={2}
                            value={item.notes ?? ""}
                            onChange={(e) =>
                              update(index, {
                                notes: e.target.value || undefined,
                              })
                            }
                            placeholder="Tempo, setup, cues…"
                          />
                        </label>
                      )}
                    </div>
                  </ExerciseSettingsContent>
                  </ExerciseSettingsRoot>
                </Surface>
              );
            })}
          </div>
        </div>
        <div className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#080b12]/95 px-3 pt-3 backdrop-blur sm:px-4">
          <div className="mx-auto max-w-5xl lg:flex lg:justify-end">
            <ActionButton
              tone="primary"
              disabled={
                !name.trim() ||
                duplicateWorkoutName ||
                items.some((item) => !item.trackingType)
              }
              className="lg:w-64"
            >
              Save workout
            </ActionButton>
          </div>
        </div>
      </form>
      {picker && (
        <ExercisePicker
          profileId={profileId}
          existingExerciseIds={items.map((item) => item.exerciseId)}
          onAdd={addExercises}
          onClose={() => setPicker(false)}
          onDelete={(exerciseId) =>
            setItems((current) =>
              current.filter((item) => item.exerciseId !== exerciseId),
            )
          }
        />
      )}
    </PageShell>
  );
}
