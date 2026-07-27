"use client";

import Link from "next/link";
import { EmptyState, PageShell } from "@/app/_components/ui";
import { useKinEthicData } from "@/lib/kinethic/hooks";
import { repository } from "@/lib/kinethic/repository";
import { ConfirmAction } from "@/components/confirm-action";
import {
  ActionButton,
  StatusBadge,
  Surface,
} from "@/components/kinethic-ui";
export function SplitListScreen({ profileId }: { profileId: string }) {
  const data = useKinEthicData();
  const profile = data.profiles[profileId];
  const splits = Object.values(data.splits).filter(
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
      title="Workout splits"
      profile={profile}
    >
      <div className="flex flex-wrap items-end justify-between gap-3 pt-7">
        <div className="min-w-0">
          <p className="eyebrow">Training plans</p>
          <h1 className="mt-1 text-2xl font-semibold">Workout splits</h1>
        </div>
        <ActionButton asChild>
          <Link href={`/profiles/${profileId}/splits/new`}>+ New</Link>
        </ActionButton>
      </div>
      <div className="mt-5 space-y-3">
        {splits.length === 0 && (
          <Surface className="p-5 text-sm leading-6 text-slate-400">
            Create a split, assign reusable workouts to weekdays, and make it
            active.
          </Surface>
        )}
        {splits.map((split) => {
          const active = profile.activeSplitId === split.id;
          const count = Object.values(split.schedule).filter(Boolean).length;
          return (
            <Surface
              className={`p-4 ${active ? "theme-accent-surface" : ""}`}
              key={split.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate font-semibold">{split.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {count} scheduled days
                  </p>
                </div>
                {active && (
                  <StatusBadge className="px-3 py-1">
                    Active
                  </StatusBadge>
                )}
              </div>
              <div className="mt-4 grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
                <ActionButton asChild>
                  <Link href={`/profiles/${profileId}/splits/${split.id}/edit`}>
                    Edit
                  </Link>
                </ActionButton>
                {!active ? (
                  <ActionButton
                    tone="primary"
                    onClick={() =>
                      repository.setActiveSplit(profileId, split.id)
                    }
                  >
                    Make active
                  </ActionButton>
                ) : (
                  <ConfirmAction
                    trigger={<ActionButton tone="danger">Delete</ActionButton>}
                    title={`Delete ${split.name}?`}
                    description="Your workouts will remain available, but this split and its schedule will be removed."
                    actionLabel="Delete split"
                    destructive
                    onConfirm={() => repository.deleteSplit(split.id)}
                  />
                )}
              </div>
              {!active && (
                <ConfirmAction
                  trigger={
                    <ActionButton
                      tone="ghost"
                      className="mt-2 w-full text-red-200"
                    >
                      Delete split
                    </ActionButton>
                  }
                  title={`Delete ${split.name}?`}
                  description="Your workouts will remain available, but this split and its schedule will be removed."
                  actionLabel="Delete split"
                  destructive
                  onConfirm={() => repository.deleteSplit(split.id)}
                />
              )}
            </Surface>
          );
        })}
      </div>
      <ActionButton asChild className="mt-6 w-full">
        <Link href={`/profiles/${profileId}/workouts`}>
          Manage workout library
        </Link>
      </ActionButton>
    </PageShell>
  );
}
