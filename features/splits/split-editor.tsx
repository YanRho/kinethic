"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
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
      <PageShell backHref="/">
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
    router.push(`/profiles/${profileId}/splits`);
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
          <input
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
              <div className="panel p-4" key={day}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {dayLabel(day)}
                    </p>
                    <h2
                      className={`mt-1 font-semibold ${workout ? "text-white" : "text-slate-400"}`}
                    >
                      {workout?.name ?? "Rest day"}
                    </h2>
                    {schedule[day] && !workout && (
                      <p className="mt-1 text-xs text-amber-300">
                        Referenced workout is unavailable
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelecting(day)}
                    className="muted-button"
                  >
                    {workout ? "Replace" : "Assign"}
                  </button>
                </div>
                {schedule[day] && (
                  <button
                    type="button"
                    onClick={() => setSchedule((x) => ({ ...x, [day]: null }))}
                    className="mt-3 min-h-11 text-sm font-medium text-red-200"
                  >
                    Remove assignment
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <div className="fixed inset-x-0 bottom-0 border-t border-white/10 bg-[#080b12]/95 p-4 backdrop-blur">
          <div className="mx-auto grid max-w-md grid-cols-2 gap-3">
            <button
              disabled={!name.trim()}
              className="muted-button"
              type="submit"
            >
              Save
            </button>
            <button
              disabled={!name.trim()}
              className="primary-button"
              type="button"
              onClick={(e) => submit(e as unknown as FormEvent, true)}
            >
              Save & activate
            </button>
          </div>
        </div>
      </form>
      {selecting && (
        <div className="fixed inset-0 z-20 overflow-y-auto bg-[#080b12] px-4 py-5 text-white">
          <div className="mx-auto max-w-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="eyebrow">{dayLabel(selecting)}</p>
                <h2 className="mt-1 text-xl font-semibold">Assign workout</h2>
              </div>
              <button
                className="muted-button"
                onClick={() => setSelecting(null)}
              >
                Close
              </button>
            </div>
            <div className="mt-6 space-y-3">
              {workouts.map((workout) => (
                <button
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
                </button>
              ))}
            </div>
            <div className="panel mt-6 p-4">
              <h3 className="font-semibold">Create a new workout</h3>
              <p className="mt-1 text-sm text-slate-400">
                Create it now, then add exercises from the workout library.
              </p>
              <label className="field mt-4">
                <span>Workout name</span>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Upper A"
                />
              </label>
              <button
                disabled={!newName.trim()}
                onClick={create}
                className="primary-button mt-3"
              >
                Create and assign
              </button>
            </div>
            {schedule[selecting] && (
              <button
                onClick={() => choose(null)}
                className="danger-button mt-4 w-full"
              >
                Make this a rest day
              </button>
            )}
          </div>
        </div>
      )}
    </PageShell>
  );
}
