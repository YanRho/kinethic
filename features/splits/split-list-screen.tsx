"use client";

import Link from "next/link";
import { EmptyState, PageShell } from "@/app/_components/ui";
import { useKinEthicData } from "@/lib/kinethic/hooks";
import { repository } from "@/lib/kinethic/repository";
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
      <div className="flex items-end justify-between pt-7">
        <div>
          <p className="eyebrow">Training plans</p>
          <h1 className="mt-1 text-2xl font-semibold">Workout splits</h1>
        </div>
        <Link
          href={`/profiles/${profileId}/splits/new`}
          className="muted-button"
        >
          + New
        </Link>
      </div>
      <div className="mt-5 space-y-3">
        {splits.length === 0 && (
          <div className="panel p-5 text-sm leading-6 text-slate-400">
            Create a split, assign reusable workouts to weekdays, and make it
            active.
          </div>
        )}
        {splits.map((split) => {
          const active = profile.activeSplitId === split.id;
          const count = Object.values(split.schedule).filter(Boolean).length;
          return (
            <section
              className={`panel p-4 ${active ? "theme-accent-surface" : ""}`}
              key={split.id}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold">{split.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {count} scheduled days
                  </p>
                </div>
                {active && (
                  <span className="theme-accent-surface theme-accent-text rounded-full border px-3 py-1 text-xs font-semibold">
                    Active
                  </span>
                )}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Link
                  href={`/profiles/${profileId}/splits/${split.id}/edit`}
                  className="muted-button"
                >
                  Edit
                </Link>
                {!active ? (
                  <button
                    className="primary-button"
                    onClick={() =>
                      repository.setActiveSplit(profileId, split.id)
                    }
                  >
                    Make active
                  </button>
                ) : (
                  <button
                    className="danger-button"
                    onClick={() => {
                      if (
                        confirm(
                          `Delete ${split.name}? Your workouts will remain available.`,
                        )
                      )
                        repository.deleteSplit(split.id);
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
              {!active && (
                <button
                  className="mt-2 min-h-11 w-full text-sm text-red-200"
                  onClick={() => {
                    if (
                      confirm(
                        `Delete ${split.name}? Your workouts will remain available.`,
                      )
                    )
                      repository.deleteSplit(split.id);
                  }}
                >
                  Delete split
                </button>
              )}
            </section>
          );
        })}
      </div>
      <Link
        className="muted-button mt-6 w-full"
        href={`/profiles/${profileId}/workouts`}
      >
        Manage workout library
      </Link>
    </PageShell>
  );
}
