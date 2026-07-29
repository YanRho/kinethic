"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, RefreshCw, X } from "lucide-react";
import { EmptyState, PageShell } from "@/app/_components/ui";
import {
  DayKey,
  Id,
  WeeklySchedule,
  dayLabel,
  emptySchedule,
  weekdays,
} from "@/lib/kinethic/domain";
import { useKinEthicData } from "@/lib/kinethic/hooks";
import { repository } from "@/lib/kinethic/repository";
import { ActionButton, AppInput, Surface } from "@/components/kinethic-ui";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

export function SplitEditor({
  profileId,
  splitId,
}: {
  profileId: Id;
  splitId?: Id;
}) {
  const data = useKinEthicData();
  const router = useRouter();
  const profile = data.profiles[profileId];
  const existing = splitId ? data.splits[splitId] : undefined;
  const [name, setName] = useState(existing?.name ?? "");
  const [schedule, setSchedule] = useState<WeeklySchedule>(
    existing?.schedule ?? emptySchedule(),
  );
  const [selecting, setSelecting] = useState<DayKey | null>(null);
  const [newName, setNewName] = useState("");
  if (
    !profile ||
    (splitId && (!existing || existing.profileId !== profileId))
  ) {
    return (
      <PageShell backHref="/profiles">
        <EmptyState
          eyebrow="Not found"
          title="Split unavailable"
          body="This split is not available for this local profile."
        />
      </PageShell>
    );
  }

  const workouts = Object.values(data.workouts).filter(
    (x) => x.profileId === profileId,
  );
  const choose = (workoutId: Id | null) => {
    if (selecting) {
      setSchedule((current) => ({
        ...current,
        [selecting]: workoutId,
      }));
    }
    setSelecting(null);
    setNewName("");
  };
  const create = () => {
    if (!newName.trim()) {
      return;
    }
    const workout = repository.saveWorkout({
      profileId,
      name: newName,
      exercises: [],
    });
    choose(workout.id);
  };
  const submit = (event: FormEvent, activate: boolean) => {
    event.preventDefault();
    if (!name.trim()) {
      return;
    }
    const split = repository.saveSplit({
      id: splitId,
      profileId,
      name,
      schedule,
    });
    if (activate || !profile.activeSplitId) {
      repository.setActiveSplit(profileId, split.id);
    }
    router.replace(`/profiles/${profileId}/splits`);
  };
  return (
    <PageShell
      backHref={`/profiles/${profileId}/splits`}
      title={existing ? "Edit split" : "New split"}
      profile={profile}
    >
      <form onSubmit={(e) => submit(e, false)} className="pb-28 pt-6">
        <label className="field">
          <span>Split name</span>
          <AppInput
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Upper / Lower, Push Pull Legs…"
          />
        </label>
        <div className="mt-8">
          <p className="eyebrow">Weekly schedule</p>
          <h1 className="mt-1 text-xl font-semibold">Monday through Sunday</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Unassigned days are rest days. Workouts stay reusable and
            independent from weekdays.
          </p>
        </div>
        <div className="mt-5 space-y-3">
          {weekdays.map((day) => {
            const workout = schedule[day]
              ? data.workouts[schedule[day]!]
              : undefined;
            return (
              <Surface className="p-4" key={day}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {dayLabel(day)}
                    </p>
                    <h2
                      className={`mt-1 truncate font-semibold ${workout ? "text-white" : "text-slate-400"}`}
                    >
                      {workout?.name ?? "Rest day"}
                    </h2>
                    {schedule[day] && !workout && (
                      <p className="mt-1 text-xs text-amber-300">
                        Referenced workout is unavailable
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <ActionButton
                      type="button"
                      size="icon-lg"
                      aria-label={`${workout ? "Replace" : "Assign"} workout for ${dayLabel(day)}`}
                      title={workout ? "Replace workout" : "Assign workout"}
                      className="rounded-xl border border-(--profile-border)"
                      onClick={() => setSelecting(day)}
                    >
                      {workout ? (
                        <RefreshCw aria-hidden="true" />
                      ) : (
                        <Plus aria-hidden="true" />
                      )}
                    </ActionButton>
                    {schedule[day] && (
                      <ActionButton
                        tone="ghost"
                        type="button"
                        size="icon-lg"
                        aria-label={`Remove workout assignment for ${dayLabel(day)}`}
                        title="Remove assignment"
                        className="rounded-xl border border-red-300/20 text-red-200 hover:bg-red-300/10"
                        onClick={() =>
                          setSchedule((current) => ({
                            ...current,
                            [day]: null,
                          }))
                        }
                      >
                        <X aria-hidden="true" />
                      </ActionButton>
                    )}
                  </div>
                </div>
              </Surface>
            );
          })}
        </div>
        <div className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#080b12]/95 px-3 pt-3 backdrop-blur sm:px-4">
          <div className="mx-auto grid max-w-md grid-cols-1 gap-2 min-[360px]:grid-cols-2 sm:gap-3">
            <ActionButton
              disabled={!name.trim()}
              type="submit"
            >
              Save
            </ActionButton>
            <ActionButton
              tone="primary"
              disabled={!name.trim()}
              type="button"
              onClick={(e) => submit(e as unknown as FormEvent, true)}
            >
              Save & activate
            </ActionButton>
          </div>
        </div>
      </form>
      <Sheet
        open={Boolean(selecting)}
        onOpenChange={(open) => !open && setSelecting(null)}
      >
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="profile-overlay h-dvh max-h-dvh overflow-y-auto border-(--profile-border) bg-(--profile-background) px-4 py-5 text-white"
        >
          {selecting && (
          <div className="mx-auto w-full max-w-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="eyebrow">{dayLabel(selecting)}</p>
                <SheetTitle className="mt-1 text-xl font-semibold text-white">
                  Assign workout
                </SheetTitle>
              </div>
              <ActionButton
                onClick={() => setSelecting(null)}
              >
                Close
              </ActionButton>
            </div>
            <div className="mt-6 space-y-3">
              {workouts.map((workout) => (
                <ActionButton
                  tone="ghost"
                  key={workout.id}
                  className="panel flex min-h-16 w-full items-center justify-between px-4 text-left"
                  onClick={() => choose(workout.id)}
                >
                  <span>
                    <span className="block font-semibold">{workout.name}</span>
                    <span className="mt-1 block text-xs text-slate-500">
                      {workout.exercises.length} exercises
                    </span>
                  </span>
                  <span>→</span>
                </ActionButton>
              ))}
            </div>
            <Surface className="mt-6 p-4">
              <h3 className="font-semibold">Create a new workout</h3>
              <p className="mt-1 text-sm text-slate-400">
                Create it now, then add exercises from the workout library.
              </p>
              <label className="field mt-4">
                <span>Workout name</span>
                <AppInput
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Iron Forge"
                />
              </label>
              <ActionButton
                tone="primary"
                disabled={!newName.trim()}
                onClick={create}
                className="mt-3"
              >
                Create and assign
              </ActionButton>
            </Surface>
            {schedule[selecting] && (
              <ActionButton
                tone="danger"
                onClick={() => choose(null)}
                className="mt-4 w-full"
              >
                Make this a rest day
              </ActionButton>
            )}
          </div>
          )}
        </SheetContent>
      </Sheet>
    </PageShell>
  );
}
