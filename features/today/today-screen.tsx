"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Brand,
  EmptyState,
  ProfileBadge,
  getProfileThemeStyle,
} from "@/app/_components/ui";
import {
  TrackingType,
  WorkoutExercise,
  dayLabel,
  localDay,
  weekdays,
} from "@/lib/kinethic/domain";
import { useKinEthicData } from "@/lib/kinethic/hooks";
import { repository } from "@/lib/kinethic/repository";
import { resolveToday } from "@/features/today/resolve-today";

const repText = (
  reps:
    | { kind: "exact"; reps: number }
    | { kind: "range"; min: number; max: number },
) =>
  reps.kind === "exact" ? `${reps.reps} reps` : `${reps.min}–${reps.max} reps`;

function workoutExerciseText(
  item: WorkoutExercise,
  trackingType: TrackingType,
) {
  if (trackingType === "duration") {
    return `${item.sets} sets · ${item.durationSeconds ?? 0}s · ${item.restSeconds}s rest`;
  }

  if (trackingType === "cardio") {
    return `${Math.round((item.durationSeconds ?? 0) / 60)} min cardio`;
  }

  return `${item.sets} sets · ${repText(item.reps)} · ${item.restSeconds}s rest${trackingType === "weight_reps" && item.weight !== undefined ? ` · ${item.weight} ${item.weightUnit ?? "lb"}` : ""}`;
}
export function TodayScreen({ profileId }: { profileId: string }) {
  const data = useKinEthicData();
  const router = useRouter();
  const profile = data.profiles[profileId];
  const experience = resolveToday(data, profileId);
  const today = localDay();
  if (!profile) {
    return (
      <main className="grid min-h-dvh place-items-center bg-[#080b12] px-5 text-white">
        <div className="max-w-sm">
          <EmptyState
            eyebrow="Profile not found"
            title="This profile is not on this device"
            body="Profiles are stored locally in each browser."
            action={
              <Link href="/" className="primary-button">
                Back to profiles
              </Link>
            }
          />
        </div>
      </main>
    );
  }

  const split = profile.activeSplitId
    ? data.splits[profile.activeSplitId]
    : undefined;
  const workout =
    experience.kind === "workout"
      ? data.workouts[experience.workoutId]
      : undefined;
  const deleteProfile = () => {
    if (
      confirm(
        `Delete ${profile.name} and all of this profile's local workout data?`,
      )
    ) {
      repository.deleteProfile(profile.id);
      router.push("/");
    }
  };
  const startWorkout = () => {
    if (!workout || workout.exercises.length === 0) {
      return;
    }

    const session = repository.startWorkoutSession(profileId, workout.id);

    if (session) {
      router.push(`/profiles/${profileId}/workout-sessions/${session.id}`);
    }
  };
  return (
    <main
      className="profile-theme min-h-dvh bg-[#080b12] px-4 py-5 text-white"
      style={getProfileThemeStyle(profile.accent)}
    >
      <div className="mx-auto max-w-md">
        <header className="flex items-center justify-between">
          <Link href="/">
            <Brand />
          </Link>
          <Link className="muted-button" href="/">
            Switch profile
          </Link>
        </header>
        <section className="pt-10">
          <div className="flex items-center gap-4">
            <ProfileBadge profile={profile} size="sm" />
            <div>
              <p className="text-sm text-slate-400">Welcome back,</p>
              <h1 className="text-2xl font-semibold">{profile.name}</h1>
            </div>
          </div>
          <p className="mt-10 text-sm font-medium text-slate-500">
            {new Intl.DateTimeFormat(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            }).format(new Date())}
          </p>
          <div className="panel mt-4 overflow-hidden p-6 shadow-2xl shadow-black/30">
            {experience.kind === "workout" && workout ? (
              <>
                <p className="eyebrow">Scheduled today · {split?.name}</p>
                <h2 className="mt-4 text-3xl font-semibold">{workout.name}</h2>
                <p className="mt-2 text-sm text-slate-400">
                  {workout.exercises.length}{" "}
                  {workout.exercises.length === 1 ? "exercise" : "exercises"}
                </p>
                <div className="mt-6 space-y-3">
                  {workout.exercises.map((item, index) => {
                    const exercise = data.exercises[item.exerciseId];
                    const trackingType =
                      item.trackingType ??
                      exercise?.trackingType ??
                      "weight_reps";
                    return (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-white/10 bg-black/20 p-4"
                      >
                        <div className="flex gap-3">
                          <span className="text-sm text-slate-500">
                            {index + 1}
                          </span>
                          <div>
                            <h3 className="font-semibold">
                              {exercise?.name ?? "Unavailable exercise"}
                            </h3>
                            <p className="mt-1 text-sm text-slate-400">
                              {workoutExerciseText(item, trackingType)}
                            </p>
                            {item.notes && (
                              <p className="mt-2 text-sm leading-6 text-slate-500">
                                {item.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <button
                    className="primary-button"
                    disabled={workout.exercises.length === 0}
                    onClick={startWorkout}
                  >
                    Start Workout
                  </button>
                  <Link
                    href={`/profiles/${profileId}/workouts/${workout.id}/edit`}
                    className="muted-button"
                  >
                    Edit template
                  </Link>
                </div>
              </>
            ) : experience.kind === "rest" ? (
              <>
                <p className="eyebrow text-slate-400">
                  Recovery · {split?.name}
                </p>
                <h2 className="mt-4 text-3xl font-semibold">Rest day</h2>
                <p className="mt-3 leading-7 text-slate-400">
                  No workout is assigned today. Rest, recover, or move however
                  feels good.
                </p>
              </>
            ) : (
              <>
                <p className="eyebrow">Setup needed</p>
                <h2 className="mt-4 text-3xl font-semibold">
                  {experience.kind === "no-active-split"
                    ? "Choose an active split"
                    : experience.kind === "invalid-split"
                      ? "Active split unavailable"
                      : "Workout unavailable"}
                </h2>
                <p className="mt-3 leading-7 text-slate-400">
                  {experience.kind === "missing-workout"
                    ? "Today references a workout that no longer exists. Edit the split to replace or remove it."
                    : "Create a workout split or choose one as active to see today’s training."}
                </p>
                <Link
                  href={`/profiles/${profileId}/splits`}
                  className="primary-button mt-6"
                >
                  Manage splits
                </Link>
              </>
            )}
          </div>
          {split && (
            <section className="mt-9">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-sm text-slate-400">This week</p>
                  <h2 className="mt-1 text-xl font-semibold">{split.name}</h2>
                </div>
                <Link
                  className="theme-accent-text text-sm font-semibold"
                  href={`/profiles/${profileId}/splits/${split.id}/edit`}
                >
                  Edit
                </Link>
              </div>
              <div className="mt-4 space-y-2">
                {weekdays.map((day) => {
                  const assigned = split.schedule[day]
                    ? data.workouts[split.schedule[day]!]
                    : undefined;
                  return (
                    <div
                      key={day}
                      className={`flex min-h-14 items-center justify-between rounded-2xl border px-4 ${day === today ? "theme-accent-surface" : "border-white/10 bg-white/2.5"}`}
                    >
                      <span className="text-sm font-medium">
                        {dayLabel(day)}
                      </span>
                      <span
                        className={`text-sm ${assigned ? "text-slate-300" : "text-slate-600"}`}
                      >
                        {assigned?.name ?? "Rest"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
          <nav className="mt-8 grid grid-cols-2 gap-3">
            <Link
              href={`/profiles/${profileId}/splits`}
              className="muted-button"
            >
              Workout splits
            </Link>
            <Link
              href={`/profiles/${profileId}/workouts`}
              className="muted-button"
            >
              Workouts
            </Link>
          </nav>
          <button
            onClick={deleteProfile}
            className="mt-10 min-h-12 w-full text-sm text-red-200"
          >
            Delete local profile
          </button>
        </section>
      </div>
    </main>
  );
}
