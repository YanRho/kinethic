"use client";

import Link from "next/link";
import { Check, Pencil, Trash2 } from "lucide-react";
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
              className={`p-3 sm:p-4 ${active ? "theme-accent-surface" : ""}`}
              key={split.id}
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-semibold">{split.name}</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {count} scheduled days
                  </p>
                </div>
                {active && (
                  <StatusBadge className="px-2.5 py-1">
                    Active
                  </StatusBadge>
                )}
                {!active && (
                  <ActionButton
                    tone="primary"
                    className="min-h-11 w-auto shrink-0 rounded-xl px-3 text-xs"
                    onClick={() =>
                      repository.setActiveSplit(profileId, split.id)
                    }
                  >
                    <Check aria-hidden="true" className="h-4 w-4" />
                    Make active
                  </ActionButton>
                )}
                <ActionButton
                  asChild
                  tone="ghost"
                  size="icon-lg"
                  className="shrink-0 rounded-xl"
                >
                  <Link
                    href={`/profiles/${profileId}/splits/${split.id}/edit`}
                    aria-label={`Edit ${split.name}`}
                    title={`Edit ${split.name}`}
                  >
                    <Pencil aria-hidden="true" className="h-4 w-4" />
                  </Link>
                </ActionButton>
                <ConfirmAction
                  trigger={
                    <ActionButton
                      tone="ghost"
                      size="icon-lg"
                      className="shrink-0 rounded-xl text-red-200 hover:bg-red-300/10"
                      aria-label={`Delete ${split.name}`}
                      title={`Delete ${split.name}`}
                    >
                      <Trash2 aria-hidden="true" className="h-4 w-4" />
                    </ActionButton>
                  }
                  title={`Delete ${split.name}?`}
                  description="Your workouts will remain available, but this split and its schedule will be removed."
                  actionLabel="Delete split"
                  destructive
                  onConfirm={() => repository.deleteSplit(split.id)}
                />
              </div>
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
