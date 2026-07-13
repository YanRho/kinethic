"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useMemo, useSyncExternalStore } from "react";

type DayKey =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

type ScheduleType = "rest" | "workout" | "optional";
type CompletionStatus = "done" | "skipped" | "unset";

type ScheduleDay = {
  title: string;
  detail: string;
  type: ScheduleType;
};

type Profile = {
  id: string;
  name: string;
  initials: string;
  accent: string;
  schedule: Record<DayKey, ScheduleDay>;
  completions?: Partial<Record<DayKey, CompletionStatus>>;
};

const storageKey = "kinethic:profiles";
const storageChangeEvent = "kinethic:profiles-changed";

const dayLabels: { key: DayKey; label: string }[] = [
  { key: "monday", label: "Mon" },
  { key: "tuesday", label: "Tue" },
  { key: "wednesday", label: "Wed" },
  { key: "thursday", label: "Thu" },
  { key: "friday", label: "Fri" },
  { key: "saturday", label: "Sat" },
  { key: "sunday", label: "Sun" },
];

function parseProfiles(snapshot: string) {
  try {
    const parsedProfiles = JSON.parse(snapshot);

    return Array.isArray(parsedProfiles) ? (parsedProfiles as Profile[]) : [];
  } catch {
    return [];
  }
}

function getProfilesSnapshot() {
  if (typeof window === "undefined") {
    return "[]";
  }

  return window.localStorage.getItem(storageKey) ?? "[]";
}

function subscribeToProfiles(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === storageKey) {
      onStoreChange();
    }
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(storageChangeEvent, onStoreChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(storageChangeEvent, onStoreChange);
  };
}

function useStoredProfiles() {
  const snapshot = useSyncExternalStore(
    subscribeToProfiles,
    getProfilesSnapshot,
    () => "[]",
  );

  return useMemo(() => parseProfiles(snapshot), [snapshot]);
}

function saveProfiles(profiles: Profile[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(profiles));
  window.dispatchEvent(new Event(storageChangeEvent));
}

function getNextStatus(status: CompletionStatus) {
  if (status === "unset") {
    return "done";
  }

  if (status === "done") {
    return "skipped";
  }

  return "unset";
}

function getTodayKey() {
  const weekday = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: "America/Los_Angeles",
  })
    .format(new Date())
    .toLowerCase();

  return weekday as DayKey;
}

export default function TodayPage({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = use(params);
  const router = useRouter();
  const profiles = useStoredProfiles();
  const todayKey = useMemo(() => getTodayKey(), []);
  const profile =
    profiles.find((storedProfile) => storedProfile.id === profileId) ?? null;

  const formattedDate = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        timeZone: "America/Los_Angeles",
      }).format(new Date()),
    [],
  );

  if (!profile) {
    return (
      <main className="grid min-h-dvh place-items-center bg-[#080b12] px-5 text-white">
        <div className="max-w-sm rounded-4xl border border-white/10 bg-white/[0.035] p-7 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
            Profile not found
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">
            Create a local profile first.
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Profiles are saved in this browser, so this device does not have a
            profile with that link.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-100"
          >
            Back to profiles
          </Link>
        </div>
      </main>
    );
  }

  const today = profile.schedule[todayKey];
  const isRestDay = today.type === "rest";
  const isOptionalDay = today.type === "optional";
  const todayTitle =
    today.title || (isRestDay ? "Rest Day" : "Untitled workout");
  const todayDetail =
    today.detail ||
    (isRestDay
      ? "No workout is scheduled today."
      : "No notes added yet.");
  const mainWorkoutCount = dayLabels.filter(
    (day) => profile.schedule[day.key].type === "workout",
  ).length;
  const handleDeleteProfile = () => {
    const shouldDelete = window.confirm(
      `Are you sure you want to delete ${profile.name}'s profile?`,
    );

    if (!shouldDelete) {
      return;
    }

    saveProfiles(
      profiles.filter((storedProfile) => storedProfile.id !== profile.id),
    );
    router.push("/");
  };
  const handleToggleDayStatus = (day: DayKey) => {
    const currentStatus = profile.completions?.[day] ?? "unset";
    const nextStatus = getNextStatus(currentStatus);

    saveProfiles(
      profiles.map((storedProfile) => {
        if (storedProfile.id !== profile.id) {
          return storedProfile;
        }

        return {
          ...storedProfile,
          completions: {
            ...storedProfile.completions,
            [day]: nextStatus,
          },
        };
      }),
    );
  };

  return (
    <main className="min-h-dvh bg-[#080b12] px-5 py-6 text-white">
      <div className="mx-auto flex min-h-[calc(100dvh-3rem)] max-w-md flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="text-xl font-semibold tracking-tight transition hover:text-cyan-200"
          >
            Kin<span className="text-cyan-300">Ethic</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDeleteProfile}
              className="rounded-full border border-red-300/20 bg-red-300/10 px-3 py-2 text-xs font-medium text-red-100 transition hover:border-red-300/40 hover:bg-red-300/20"
            >
              Delete
            </button>

            <Link
              href="/"
              className="rounded-full border border-white/10 bg-white/4 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/8 hover:text-white"
            >
              Switch profile
            </Link>
          </div>
        </header>

        <section className="flex-1 py-12">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-br ${profile.accent} p-0.5`}
            >
              <div className="flex h-full w-full items-center justify-center rounded-full bg-[#080b12] text-lg font-semibold">
                {profile.initials}
              </div>
            </div>

            <div>
              <p className="text-sm text-slate-400">Welcome back,</p>
              <h1 className="text-2xl font-semibold tracking-tight">
                {profile.name}
              </h1>
            </div>
          </div>

          <div className="mt-12">
            <p className="text-sm font-medium text-slate-500">{formattedDate}</p>

            <div className="mt-4 overflow-hidden rounded-4xl border border-white/10 bg-linear-to-br from-white/10 to-white/3 p-7 shadow-2xl shadow-black/30">
              <p
                className={`text-sm font-semibold uppercase tracking-[0.18em] ${
                  isRestDay
                    ? "text-slate-400"
                    : isOptionalDay
                      ? "text-amber-300"
                      : "text-cyan-300"
                }`}
              >
                {isRestDay
                  ? "Recovery"
                  : isOptionalDay
                    ? "Optional today"
                    : "Scheduled today"}
              </p>

              <h2 className="mt-4 text-4xl font-semibold tracking-tight">
                {todayTitle}
              </h2>

              <p className="mt-3 text-base leading-7 text-slate-400">
                {todayDetail}
              </p>

              {!isRestDay && (
                <button
                  type="button"
                  className="mt-8 w-full rounded-2xl bg-white px-5 py-4 text-base font-semibold text-slate-950 transition hover:bg-cyan-100 active:scale-[0.99]"
                >
                  Start Workout
                </button>
              )}

              {isRestDay && (
                <div className="mt-8">
                  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                    <p className="text-sm leading-6 text-slate-400">
                      No workout is scheduled today. Rest, stretch, or take an
                      easy walk if you feel like moving.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="mt-4 w-full rounded-2xl border border-cyan-300/30 bg-cyan-300/10 px-5 py-4 text-base font-semibold text-cyan-100 transition hover:bg-cyan-300/20 active:scale-[0.99]"
                  >
                    Start a workout anyway
                  </button>
                </div>
              )}
            </div>
          </div>

          <section className="mt-10">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">This week</p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight">
                  Your training rhythm
                </h2>
              </div>

              <span className="text-xs text-slate-500">
                {mainWorkoutCount} main workouts
              </span>
            </div>

            <div className="mt-5 grid grid-cols-7 gap-2">
              {dayLabels.map((day) => {
                const isToday = day.key === todayKey;
                const scheduledDay = profile.schedule[day.key];
                const status = profile.completions?.[day.key] ?? "unset";
                const statusLabel =
                  status === "done"
                    ? "completed"
                    : status === "skipped"
                      ? "skipped"
                      : "not set";

                return (
                  <div key={day.key} className="text-center">
                    <p className="mb-2 text-xs text-slate-500">{day.label}</p>

                    <button
                      type="button"
                      onClick={() => handleToggleDayStatus(day.key)}
                      title={scheduledDay.title || `${day.label}: ${statusLabel}`}
                      aria-label={`${day.label} workout status: ${statusLabel}. Click to change.`}
                      className={`flex aspect-square w-full items-center justify-center rounded-2xl border text-sm font-semibold transition active:scale-95 ${
                        status === "done"
                          ? "border-emerald-300 bg-emerald-300 text-slate-950"
                          : status === "skipped"
                            ? "border-red-300 bg-red-300 text-slate-950"
                            : isToday
                              ? "border-cyan-300 bg-cyan-300/10 text-cyan-100"
                              : scheduledDay.type === "rest"
                                ? "border-white/5 bg-white/2 text-slate-600"
                                : "border-white/10 bg-white/4 text-slate-300"
                      }`}
                    >
                      {status === "done"
                        ? "✓"
                        : status === "skipped"
                          ? "×"
                          : "-"}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        </section>

        <footer className="pb-2 text-center text-xs text-slate-600">
          KinEthic
        </footer>
      </div>
    </main>
  );
}
