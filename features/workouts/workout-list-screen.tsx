"use client";

import Link from "next/link";
import { EmptyState, PageShell } from "@/app/_components/ui";
import { useKinEthicData } from "@/lib/kinethic/hooks";
import { repository } from "@/lib/kinethic/repository";
export function WorkoutListScreen({ profileId }: { profileId: string }) {
  const data = useKinEthicData();
  const profile = data.profiles[profileId];
  const workouts = Object.values(data.workouts).filter(
    (x) => x.profileId === profileId,
  );
  if (!profile) {
    return (
      <PageShell backHref="/">
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
      title="Workout library"
      profile={profile}
    >
      <div className="flex items-end justify-between pt-7">
        <div>
          <p className="eyebrow">Reusable</p>
          <h1 className="mt-1 text-2xl font-semibold">Workouts</h1>
        </div>
        <Link
          className="muted-button"
          href={`/profiles/${profileId}/workouts/new`}
        >
          + New
        </Link>
      </div>
      <div className="mt-5 space-y-3">
        {workouts.length === 0 && (
          <div className="panel p-5 text-sm leading-6 text-slate-400">
            No workouts yet. Create one here or while assigning a day in a
            split.
          </div>
        )}
        {workouts.map((workout) => (
          <div className="panel p-4" key={workout.id}>
            <h2 className="font-semibold">{workout.name}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {workout.exercises.length}{" "}
              {workout.exercises.length === 1 ? "exercise" : "exercises"}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link
                className="muted-button"
                href={`/profiles/${profileId}/workouts/${workout.id}/edit`}
              >
                Edit
              </Link>
              <button
                className="danger-button"
                onClick={() => {
                  if (
                    confirm(
                      `Delete ${workout.name}? It will be removed from every split.`,
                    )
                  )
                    repository.deleteWorkout(workout.id);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
