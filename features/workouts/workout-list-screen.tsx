"use client";

import Link from "next/link";
import { EmptyState, PageShell } from "@/app/_components/ui";
import { useKinEthicData } from "@/lib/kinethic/hooks";
import { repository } from "@/lib/kinethic/repository";
import { ConfirmAction } from "@/components/confirm-action";
import { ActionButton, Surface } from "@/components/kinethic-ui";
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
      <div className="flex flex-wrap items-end justify-between gap-3 pt-7">
        <div className="min-w-0">
          <p className="eyebrow">Reusable</p>
          <h1 className="mt-1 text-2xl font-semibold">Workouts</h1>
        </div>
        <ActionButton asChild>
          <Link href={`/profiles/${profileId}/workouts/new`}>+ New</Link>
        </ActionButton>
      </div>
      <div className="mt-5 space-y-3">
        {workouts.length === 0 && (
          <Surface className="p-5 text-sm leading-6 text-slate-400">
            No workouts yet. Create one here or while assigning a day in a
            split.
          </Surface>
        )}
        {workouts.map((workout) => (
          <Surface className="p-4" key={workout.id}>
            <h2 className="break-words font-semibold">{workout.name}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {workout.exercises.length}{" "}
              {workout.exercises.length === 1 ? "exercise" : "exercises"}
            </p>
            <div className="mt-4 grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
              <ActionButton asChild>
                <Link
                  href={`/profiles/${profileId}/workouts/${workout.id}/edit`}
                >
                  Edit
                </Link>
              </ActionButton>
              <ConfirmAction
                trigger={<ActionButton tone="danger">Delete</ActionButton>}
                title={`Delete ${workout.name}?`}
                description="It will be removed from every workout split. This action cannot be undone."
                actionLabel="Delete workout"
                destructive
                onConfirm={() => repository.deleteWorkout(workout.id)}
              />
            </div>
          </Surface>
        ))}
      </div>
    </PageShell>
  );
}
