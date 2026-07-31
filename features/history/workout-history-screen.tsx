"use client";

import { CalendarDays, Check, Clock3, Dumbbell, SkipForward } from "lucide-react";
import { EmptyState, PageShell } from "@/app/_components/ui";
import { StatusBadge, Surface } from "@/components/kinethic-ui";
import { SessionExercise, WorkoutSession } from "@/lib/kinethic/domain";
import { useKinEthicData } from "@/lib/kinethic/hooks";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const formatDuration = (session: WorkoutSession) => {
  if (!session.completedAt) return "";
  const seconds = Math.max(
    0,
    Math.floor(
      (new Date(session.completedAt).getTime() -
        new Date(session.startedAt).getTime()) /
        1000,
    ) - (session.accumulatedPausedSeconds ?? 0),
  );
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours ? `${hours}h ${minutes}m` : `${Math.max(1, minutes)}m`;
};

const formatTarget = (exercise: SessionExercise) => {
  if (exercise.trackingType === "duration") {
    return exercise.targetDurationSeconds
      ? `${exercise.targetDurationSeconds}s target`
      : "Duration";
  }
  const reps =
    exercise.target.kind === "exact"
      ? `${exercise.target.reps} reps`
      : `${exercise.target.min}–${exercise.target.max} reps`;
  return exercise.trackingType === "weight_reps" &&
    exercise.plannedWeight !== undefined
    ? `${exercise.plannedWeight} ${exercise.weightUnit} × ${reps}`
    : reps;
};

const formatSet = (exercise: SessionExercise, setIndex: number) => {
  const set = exercise.sets[setIndex];
  if (!set.completedAt) return "Not completed";
  if (exercise.trackingType === "duration") {
    return `${set.actualDurationSeconds ?? 0}s`;
  }
  if (exercise.trackingType === "reps") {
    return `${set.actualReps ?? 0} reps`;
  }
  return `${set.actualWeight ?? 0} ${exercise.weightUnit} × ${set.actualReps ?? 0}`;
};

export function WorkoutHistoryScreen({ profileId }: { profileId: string }) {
  const data = useKinEthicData();
  const profile = data.profiles[profileId];
  const sessions = Object.values(data.workoutSessions)
    .filter(
      (session) => session.profileId === profileId && session.completedAt,
    )
    .sort((a, b) => b.completedAt!.localeCompare(a.completedAt!));

  if (!profile) {
    return (
      <PageShell backHref="/profiles">
        <EmptyState
          eyebrow="Not found"
          title="Profile unavailable"
          body="This profile is not stored in this browser."
        />
      </PageShell>
    );
  }

  return (
    <PageShell
      backHref={`/today/${profileId}`}
      title="Workout history"
      profile={profile}
    >
      <section className="pb-10 pt-7">
        <p className="eyebrow">Training log</p>
        <h1 className="mt-1 text-2xl font-semibold">Workout history</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          Completed workouts are saved as they happened, even if you later edit
          a workout or change your split.
        </p>

        {sessions.length === 0 ? (
          <Surface className="mt-6 p-6 text-center">
            <Dumbbell
              aria-hidden="true"
              className="theme-accent-text mx-auto h-8 w-8"
            />
            <h2 className="mt-3 font-semibold">No completed workouts yet</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Finish a workout and its full session details will appear here.
            </p>
          </Surface>
        ) : (
          <div className="mt-6 space-y-4">
            {sessions.map((session) => {
              const completedSets = session.exercises.reduce(
                (total, exercise) =>
                  total + exercise.sets.filter((set) => set.completedAt).length,
                0,
              );
              return (
                <Surface key={session.id} className="overflow-hidden">
                  <details className="group">
                    <summary className="cursor-pointer list-none p-4 sm:p-5 [&::-webkit-details-marker]:hidden">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h2 className="truncate text-lg font-semibold">
                            {session.workoutName}
                          </h2>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                            <span className="flex items-center gap-1.5">
                              <CalendarDays aria-hidden="true" className="h-3.5 w-3.5" />
                              {formatDate(session.completedAt!)}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Clock3 aria-hidden="true" className="h-3.5 w-3.5" />
                              {formatDuration(session)}
                            </span>
                          </div>
                        </div>
                        <span className="theme-accent-text shrink-0 text-sm font-semibold group-open:hidden">
                          View
                        </span>
                        <span className="theme-accent-text hidden shrink-0 text-sm font-semibold group-open:inline">
                          Hide
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <StatusBadge>{session.exercises.length} exercises</StatusBadge>
                        <StatusBadge>{completedSets} completed sets</StatusBadge>
                      </div>
                    </summary>

                    <div className="border-t border-(--profile-border) px-4 pb-5 pt-2 sm:px-5">
                      <div className="space-y-3">
                        {session.exercises.map((exercise, exerciseIndex) => (
                          <div
                            key={exercise.id}
                            className="rounded-2xl border border-(--profile-border) bg-(--profile-background) p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-xs font-semibold text-slate-500">
                                  Exercise {exerciseIndex + 1}
                                </p>
                                <h3 className="mt-1 font-semibold">
                                  {exercise.exerciseName}
                                </h3>
                                <p className="mt-1 text-xs text-slate-400">
                                  {formatTarget(exercise)} · {exercise.restSeconds}s rest
                                </p>
                              </div>
                              {exercise.skippedAt ? (
                                <StatusBadge className="border-amber-300/30 bg-amber-300/10 text-amber-200">
                                  <SkipForward aria-hidden="true" /> Skipped
                                </StatusBadge>
                              ) : (
                                <StatusBadge>
                                  <Check aria-hidden="true" /> Done
                                </StatusBadge>
                              )}
                            </div>

                            <div className="mt-4 space-y-2">
                              {exercise.sets.map((set, setIndex) => (
                                <div
                                  key={set.setNumber}
                                  className="flex items-center justify-between gap-4 rounded-xl bg-(--profile-panel-strong) px-3 py-2 text-sm"
                                >
                                  <span className="text-slate-400">
                                    Set {set.setNumber}
                                  </span>
                                  <span className={set.completedAt ? "font-semibold" : "text-slate-500"}>
                                    {formatSet(exercise, setIndex)}
                                  </span>
                                </div>
                              ))}
                            </div>

                            {exercise.notes && (
                              <p className="mt-3 rounded-xl border border-(--profile-border) px-3 py-2 text-sm leading-6 text-slate-400">
                                <span className="font-semibold text-slate-300">Notes:</span>{" "}
                                {exercise.notes}
                              </p>
                            )}
                            {exercise.skipReason && (
                              <p className="mt-3 text-sm text-amber-200">
                                Skip reason: {exercise.skipReason}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="mt-4 text-xs text-slate-500">
                        Started {formatDate(session.startedAt)} · Completed {formatDate(session.completedAt!)}
                      </p>
                    </div>
                  </details>
                </Surface>
              );
            })}
          </div>
        )}
      </section>
    </PageShell>
  );
}
