"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EmptyState, PageShell } from "@/app/_components/ui";
import { SessionExercise, WorkoutSession } from "@/lib/kinethic/domain";
import { useKinEthicData } from "@/lib/kinethic/hooks";
import { repository } from "@/lib/kinethic/repository";
import {
  formatPreviousPerformance,
  getExerciseRecommendation,
  getPreviousExercise,
} from "./recommendations";
import { ExerciseLogger } from "./exercise-loggers";
import { ActionButton, Surface } from "@/components/kinethic-ui";
import {
  formatTimer,
  useElapsedWorkoutSeconds,
  useRestSeconds,
} from "./use-session-timers";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type WorkoutSessionScreenProps = {
  profileId: string;
  sessionId: string;
};

function targetText(exercise: SessionExercise) {
  if (exercise.trackingType === "duration") {
    return `${exercise.sets.length} × ${exercise.targetDurationSeconds ?? 0}s`;
  }

  if (exercise.target.kind === "exact") {
    return `${exercise.sets.length} × ${exercise.target.reps}`;
  }

  return `${exercise.sets.length} × ${exercise.target.min}–${exercise.target.max}`;
}

function normalizeSession(session: WorkoutSession): WorkoutSession {
  return {
    ...session,
    currentExerciseIndex: session.currentExerciseIndex ?? 0,
    restEndsAt: session.restEndsAt ?? null,
    exercises: session.exercises.map((exercise) => ({
      ...exercise,
      trackingType: exercise.trackingType ?? "weight_reps",
    })),
  };
}

export function WorkoutSessionScreen({
  profileId,
  sessionId,
}: WorkoutSessionScreenProps) {
  const data = useKinEthicData();
  const router = useRouter();
  const profile = data.profiles[profileId];
  const storedSession = data.workoutSessions[sessionId];
  const [session, setSession] = useState<WorkoutSession | null>(() =>
    storedSession ? normalizeSession(storedSession) : null,
  );
  const [showSkipConfirmation, setShowSkipConfirmation] = useState(false);
  const elapsedSeconds = useElapsedWorkoutSeconds(session?.startedAt ?? null);
  const restSeconds = useRestSeconds(session?.restEndsAt ?? null);

  useEffect(() => {
    if (!session || session.completedAt) {
      return;
    }

    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      repository.saveWorkoutSession(session);
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [session]);

  if (
    !profile ||
    !session ||
    session.profileId !== profileId ||
    session.completedAt
  ) {
    return (
      <PageShell backHref={`/today/${profileId}`} profile={profile}>
        <EmptyState
          eyebrow="Session unavailable"
          title="This workout session cannot be opened"
          body="It may have already been completed or removed from local storage."
        />
      </PageShell>
    );
  }

  const currentExercise = session.exercises[session.currentExerciseIndex];
  const sessionComplete = !currentExercise;
  const previousSessions = Object.values(data.workoutSessions).filter(
    (candidate) =>
      candidate.profileId === profileId &&
      candidate.workoutId === session.workoutId &&
      candidate.id !== session.id &&
      candidate.completedAt,
  );
  const previousExercise = currentExercise
    ? getPreviousExercise(currentExercise, previousSessions)
    : null;
  const recommendation = currentExercise
    ? getExerciseRecommendation(currentExercise, previousSessions)
    : null;

  const saveSession = (nextSession: WorkoutSession) => {
    setSession(nextSession);
    repository.saveWorkoutSession(nextSession);
  };

  const setWorkingWeight = (weight?: number) => {
    if (!currentExercise) {
      return;
    }

    saveSession({
      ...session,
      exercises: session.exercises.map((exercise, index) =>
        index === session.currentExerciseIndex
          ? {
              ...exercise,
              sets: exercise.sets.map((set) => ({
                ...set,
                actualWeight: set.completedAt ? set.actualWeight : weight,
              })),
            }
          : exercise,
      ),
    });
  };

  const updateSessionSet = (
    setNumber: number,
    changes: Partial<SessionExercise["sets"][number]>,
  ) => {
    if (!currentExercise) {
      return;
    }

    saveSession({
      ...session,
      exercises: session.exercises.map((exercise, index) =>
        index === session.currentExerciseIndex
          ? {
              ...exercise,
              sets: exercise.sets.map((set) =>
                set.setNumber === setNumber ? { ...set, ...changes } : set,
              ),
            }
          : exercise,
      ),
    });
  };

  const completeSet = (setNumber: number) => {
    if (!currentExercise) {
      return;
    }

    const completedAt = new Date().toISOString();
    const exercises = session.exercises.map((exercise, index) =>
      index === session.currentExerciseIndex
        ? {
            ...exercise,
            sets: exercise.sets.map((set) =>
              set.setNumber === setNumber ? { ...set, completedAt } : set,
            ),
          }
        : exercise,
    );
    const updatedExercise = exercises[session.currentExerciseIndex];
    const exerciseComplete = updatedExercise.sets.every(
      (set) => set.completedAt,
    );

    saveSession({
      ...session,
      exercises,
      currentExerciseIndex: exerciseComplete
        ? session.currentExerciseIndex + 1
        : session.currentExerciseIndex,
      restEndsAt: exerciseComplete
        ? null
        : new Date(
            Date.now() + currentExercise.restSeconds * 1000,
          ).toISOString(),
    });
  };

  const adjustRest = (seconds: number) => {
    const currentTarget = session.restEndsAt
      ? new Date(session.restEndsAt).getTime()
      : Date.now();

    saveSession({
      ...session,
      restEndsAt: new Date(
        Math.max(Date.now(), currentTarget + seconds * 1000),
      ).toISOString(),
    });
  };

  const skipRest = () => {
    saveSession({ ...session, restEndsAt: null });
  };

  const skipExercise = () => {
    if (!currentExercise) {
      return;
    }

    const skippedAt = new Date().toISOString();
    const exercises = session.exercises.map((exercise, index) =>
      index === session.currentExerciseIndex
        ? { ...exercise, skippedAt, skipReason: "Skipped by user" }
        : exercise,
    );

    setShowSkipConfirmation(false);
    saveSession({
      ...session,
      exercises,
      currentExerciseIndex: session.currentExerciseIndex + 1,
      restEndsAt: null,
    });
  };

  const finishWorkout = () => {
    repository.saveWorkoutSession(session);
    const completedSession = repository.finishWorkoutSession(session.id);

    if (completedSession) {
      router.push(`/today/${profileId}`);
    }
  };

  return (
    <PageShell
      backHref={`/today/${profileId}`}
      backConfirmMessage="Leave this workout? Your in-progress session is saved locally, but the workout will remain unfinished."
      onBeforeBack={() => repository.saveWorkoutSession(session)}
      title={formatTimer(elapsedSeconds)}
      profile={profile}
    >
      <div className="mx-auto max-w-3xl pb-28 pt-7">
        <div className="flex flex-wrap items-end justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <p className="eyebrow">Workout in progress</p>
            <h1 className="mt-2 break-words text-xl font-semibold sm:text-2xl">
              {session.workoutName}
            </h1>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Elapsed</p>
            <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">
              {formatTimer(elapsedSeconds)}
            </p>
          </div>
        </div>

        {sessionComplete ? (
          <Surface className="mt-8 p-6 text-center">
            <p className="eyebrow">All exercises complete</p>
            <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">
              Workout complete
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Finish to save this session to local workout history.
            </p>
            <ActionButton
              tone="primary"
              className="mt-6"
              onClick={finishWorkout}
            >
              Finish Workout
            </ActionButton>
          </Surface>
        ) : (
          currentExercise && (
            <Surface className="mt-8 p-4 sm:p-6">
              <div className="flex items-start justify-between gap-3 sm:gap-4">
                <div className="min-w-0">
                  <p className="text-xs text-slate-400">
                    Exercise {session.currentExerciseIndex + 1} of{" "}
                    {session.exercises.length}
                  </p>
                  <h2 className="mt-2 break-words text-xl font-semibold sm:text-2xl">
                    {currentExercise.exerciseName}
                  </h2>
                  <p className="mt-2 text-sm text-slate-400">
                    Target {targetText(currentExercise)} ·{" "}
                    {currentExercise.restSeconds}s rest
                  </p>
                </div>
                <ActionButton
                  tone="ghost"
                  className="min-h-11 text-sm font-semibold text-red-200"
                  onClick={() => setShowSkipConfirmation(true)}
                >
                  Skip
                </ActionButton>
              </div>

              {previousExercise && (
                <div className="mt-5 rounded-2xl border border-white/10 bg-black/15 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Previous performance
                  </p>
                  <p className="mt-2 text-sm leading-6">
                    {formatPreviousPerformance(previousExercise)}
                  </p>
                </div>
              )}

              {recommendation && (
                <div className="theme-accent-surface mt-4 rounded-2xl border p-4 text-sm leading-6">
                  <span className="theme-accent-text font-semibold">
                    Today’s suggestion:
                  </span>
                  {recommendation.message}
                </div>
              )}

              <ExerciseLogger
                exercise={currentExercise}
                restSeconds={restSeconds}
                onUpdateSet={updateSessionSet}
                onCompleteSet={completeSet}
                onWorkingWeightChange={setWorkingWeight}
              />

              {currentExercise.notes && (
                <p className="mt-5 text-sm leading-6 text-slate-400">
                  {currentExercise.notes}
                </p>
              )}
            </Surface>
          )
        )}
      </div>

      <Dialog open={restSeconds > 0}>
        <DialogContent
          showCloseButton={false}
          className="bg-(--profile-panel) p-6 text-center text-white sm:max-w-md"
          onEscapeKeyDown={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => event.preventDefault()}
        >
          <DialogHeader>
            <p className="eyebrow">Recovery</p>
            <DialogTitle className="mt-3 text-2xl font-semibold">
              Rest before your next set
            </DialogTitle>
            <DialogDescription className="sr-only">
              Rest timer before the next set unlocks.
            </DialogDescription>
          </DialogHeader>
            <p className="mt-6 font-mono text-5xl font-semibold tabular-nums sm:text-6xl">
              {formatTimer(restSeconds)}
            </p>
            <p className="mt-3 text-sm text-slate-400">
              The next set will unlock when the timer ends.
            </p>
            <div className="mt-7 grid grid-cols-2 gap-2 sm:gap-3">
              <ActionButton onClick={() => adjustRest(-15)}>
                −15s
              </ActionButton>
              <ActionButton onClick={() => adjustRest(15)}>
                +15s
              </ActionButton>
            </div>
            <ActionButton tone="primary" className="mt-3" onClick={skipRest}>
              Skip Rest
            </ActionButton>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={showSkipConfirmation && Boolean(currentExercise)}
        onOpenChange={setShowSkipConfirmation}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to skip this exercise?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {currentExercise?.exerciseName} will be recorded as skipped in this
              workout session.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep exercise</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white"
              onClick={skipExercise}
            >
              Skip exercise
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}
