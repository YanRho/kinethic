"use client";

import { FormEvent, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PageShell, EmptyState } from "@/app/_components/ui";
import {
  Id,
  RepTarget,
  TrackingType,
  WorkoutExercise,
} from "@/lib/kinethic/domain";
import { useKinEthicData } from "@/lib/kinethic/hooks";
import { newWorkoutExercise, repository } from "@/lib/kinethic/repository";
import { ExercisePicker } from "@/features/exercises/exercise-picker";

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
  const [items, setItems] = useState<WorkoutExercise[]>(
    existing?.exercises.map((item) => ({
      ...item,
      trackingType:
        item.trackingType ??
        data.exercises[item.exerciseId]?.trackingType ??
        "weight_reps",
    })) ?? [],
  );
  const [expandedExerciseIds, setExpandedExerciseIds] = useState<Set<Id>>(
    () => new Set(existing?.exercises[0] ? [existing.exercises[0].id] : []),
  );
  const [picker, setPicker] = useState(false);
  const [draggedExerciseId, setDraggedExerciseId] = useState<Id | null>(null);
  const [dragOverExerciseId, setDragOverExerciseId] = useState<Id | null>(null);
  const cardElements = useRef(new Map<Id, HTMLElement>());
  const cardAnimations = useRef(new Map<Id, Animation>());
  const previousCardPositions = useRef(new Map<Id, DOMRect>());
  const lastReorderTargetId = useRef<Id | null>(null);

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
  }, [items, expandedExerciseIds]);
  if (
    !profile ||
    (workoutId && (!existing || existing.profileId !== profileId))
  )
    return (
      <PageShell backHref="/">
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
    setExpandedExerciseIds(new Set(lastNewItem ? [lastNewItem.id] : []));
    setPicker(false);
  };
  const toggleExercise = (exerciseId: Id) => {
    setExpandedExerciseIds((current) => {
      const next = new Set(current);

      if (next.has(exerciseId)) {
        next.delete(exerciseId);
      } else {
        next.add(exerciseId);
      }

      return next;
    });
  };
  const removeExercise = (exerciseId: Id) => {
    setItems((current) => current.filter((item) => item.id !== exerciseId));
    setExpandedExerciseIds((current) => {
      const next = new Set(current);

      next.delete(exerciseId);
      return next;
    });
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
    if (!name.trim() || items.some((item) => !item.trackingType)) {
      return;
    }
    repository.saveWorkout({
      id: workoutId,
      profileId,
      name,
      exercises: items,
    });
    router.replace(`/profiles/${profileId}/workouts`);
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
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Upper A, Push, Full Body…"
            />
          </label>
          <div className="panel mt-5 hidden p-4 text-sm leading-6 text-slate-400 lg:block">
            Exercises are performed from top to bottom. Use the move controls to
            keep their order clear on every device.
          </div>
        </aside>
        <div>
          <div className="mt-8 flex items-center justify-between lg:mt-0">
            <div>
              <p className="eyebrow">Exercises</p>
              <h1 className="mt-1 text-xl font-semibold">Training order</h1>
            </div>
            <button
              type="button"
              onClick={() => setPicker(true)}
              className="muted-button"
            >
              + Add
            </button>
          </div>
          <div className="mt-4 space-y-4">
            {items.length === 0 && (
              <div className="panel p-5 text-sm leading-6 text-slate-400">
                No exercises yet. Add an exercise and configure its training
                targets.
              </div>
            )}
            {items.map((item, index) => {
              const exercise = data.exercises[item.exerciseId];
              const reps = item.reps;
              const trackingType = item.trackingType;
              const expanded = expandedExerciseIds.has(item.id);
              const repSummary =
                trackingType === undefined
                  ? "Choose a tracking type"
                  : trackingType === "duration"
                    ? `${item.durationSeconds ?? 0}s`
                    : reps.kind === "exact"
                        ? `${reps.reps} reps`
                        : `${reps.min}–${reps.max} reps`;
              return (
                <section
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
                  <div className="flex items-start justify-between gap-3">
                    <button
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
                      className="theme-accent-text ml-2 mt-4 flex min-h-11 w-10 cursor-grab touch-none items-center justify-center rounded-xl text-xl active:cursor-grabbing"
                    >
                      ☰
                    </button>
                    <button
                      type="button"
                      aria-expanded={expanded}
                      onClick={() => toggleExercise(item.id)}
                      className="flex min-h-20 flex-1 items-center justify-between gap-4 p-4 text-left"
                    >
                      <span>
                        <span className="block text-xs text-slate-500">
                          Exercise {index + 1}
                        </span>
                        <span className="mt-1 block font-semibold">
                          {exercise?.name ?? "Unavailable exercise"}
                        </span>
                        {!expanded && (
                          <span className="mt-1 block text-xs text-slate-400">
                            {item.sets} sets · {repSummary} · {item.restSeconds}
                            s rest
                            {item.weight !== undefined
                              ? ` · ${item.weight} ${item.weightUnit ?? "lb"}`
                              : ""}
                          </span>
                        )}
                      </span>
                      <span
                        aria-hidden="true"
                        className={`theme-accent-text text-xl transition-transform ${expanded ? "rotate-180" : ""}`}
                      >
                        ⌄
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeExercise(item.id)}
                      className="mr-4 mt-4 min-h-11 text-sm text-red-200"
                    >
                      Remove
                    </button>
                  </div>
                  {expanded && (
                    <div className="border-t border-white/10 p-4">
                      <div className="grid grid-cols-2 gap-3">
                        <label className="field col-span-2">
                          <span>Tracking type</span>
                          <select
                            value={trackingType ?? ""}
                            onChange={(event) =>
                              changeTrackingType(
                                index,
                                event.target.value as TrackingType,
                              )
                            }
                          >
                            <option value="" disabled>
                              Choose tracking type
                            </option>
                            <option value="weight_reps">Weight and reps</option>
                            <option value="reps">Reps only</option>
                            <option value="duration">Duration</option>
                          </select>
                        </label>
                        {trackingType && (
                          <>
                            <label className="field">
                              <span>Sets</span>
                              <input
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
                            </label>
                            {(trackingType === "weight_reps" ||
                              trackingType === "reps") && (
                              <>
                                <label className="field">
                                  <span>Rep target</span>
                                  <select
                                    value={reps.kind}
                                    onChange={(event) =>
                                      update(index, {
                                        reps:
                                          event.target.value === "exact"
                                            ? { kind: "exact", reps: 10 }
                                            : {
                                                kind: "range",
                                                min: 8,
                                                max: 12,
                                              },
                                      })
                                    }
                                  >
                                    <option value="range">Range</option>
                                    <option value="exact">Exact</option>
                                  </select>
                                </label>
                                {reps.kind === "exact" ? (
                                  <label className="field">
                                    <span>Reps</span>
                                    <input
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
                                  </label>
                                ) : (
                                  <>
                                    <label className="field">
                                      <span>Min reps</span>
                                      <input
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
                                    </label>
                                    <label className="field">
                                      <span>Max reps</span>
                                      <input
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
                                    </label>
                                  </>
                                )}
                              </>
                            )}
                            <label className="field">
                              <span>Rest (seconds)</span>
                              <input
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
                            </label>
                            {trackingType === "weight_reps" && (
                              <>
                                <label className="field">
                                  <span>Weight (optional)</span>
                                  <input
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
                                  <select
                                    value={item.weightUnit ?? "lb"}
                                    onChange={(event) =>
                                      update(index, {
                                        weightUnit: event.target.value as
                                          | "lb"
                                          | "kg",
                                      })
                                    }
                                  >
                                    <option value="lb">lb</option>
                                    <option value="kg">kg</option>
                                  </select>
                                </label>
                              </>
                            )}
                            {trackingType === "duration" && (
                              <label className="field">
                                <span>Target duration (seconds)</span>
                                <input
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
                          </>
                        )}
                      </div>
                      {!trackingType && (
                        <p className="mt-4 text-sm leading-6 text-slate-400">
                          Choose how this exercise should be tracked to
                          configure its targets.
                        </p>
                      )}
                      {trackingType && (
                        <label className="field mt-3">
                          <span>Notes (optional)</span>
                          <textarea
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
                  )}
                </section>
              );
            })}
          </div>
        </div>
        <div className="fixed inset-x-0 bottom-0 border-t border-white/10 bg-[#080b12]/95 p-4 backdrop-blur">
          <div className="mx-auto max-w-5xl lg:flex lg:justify-end">
            <button
              disabled={
                !name.trim() || items.some((item) => !item.trackingType)
              }
              className="primary-button lg:w-64"
            >
              Save workout
            </button>
          </div>
        </div>
      </form>
      {picker && (
        <ExercisePicker
          profileId={profileId}
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
