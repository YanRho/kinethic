"use client";

import { FormEvent, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";

type DayKey =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

type ScheduleType = "rest" | "workout" | "optional";

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
};

const storageKey = "kinethic:profiles";
const storageChangeEvent = "kinethic:profiles-changed";

const dayLabels: { key: DayKey; label: string }[] = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

const accentOptions = [
  "from-cyan-300 via-blue-400 to-indigo-500",
  "from-rose-300 via-fuchsia-400 to-violet-500",
  "from-emerald-300 via-teal-400 to-cyan-500",
  "from-amber-200 via-orange-300 to-rose-400",
];

const emptySchedule = (): Record<DayKey, ScheduleDay> => ({
  monday: {
    title: "",
    detail: "",
    type: "rest",
  },
  tuesday: {
    title: "",
    detail: "",
    type: "rest",
  },
  wednesday: {
    title: "",
    detail: "",
    type: "rest",
  },
  thursday: {
    title: "",
    detail: "",
    type: "rest",
  },
  friday: {
    title: "",
    detail: "",
    type: "rest",
  },
  saturday: {
    title: "",
    detail: "",
    type: "rest",
  },
  sunday: {
    title: "",
    detail: "",
    type: "rest",
  },
});

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

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

function ProfileBadge({ profile }: { profile: Profile }) {
  return (
    <div
      className={`flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br ${profile.accent} p-0.5`}
    >
      <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-950 text-lg font-semibold text-white">
        {profile.initials}
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const profiles = useStoredProfiles();
  const hasProfiles = profiles.length > 0;
  const [step, setStep] = useState<"name" | "schedule">("name");
  const [showCreator, setShowCreator] = useState(false);
  const [isSelectorExiting, setIsSelectorExiting] = useState(false);
  const [name, setName] = useState("");
  const [accent, setAccent] = useState(accentOptions[0]);
  const [schedule, setSchedule] =
    useState<Record<DayKey, ScheduleDay>>(emptySchedule);

  const trimmedName = name.trim();
  const mainWorkoutCount = useMemo(
    () =>
      dayLabels.filter((day) => schedule[day.key].type === "workout").length,
    [schedule],
  );

  const handleScheduleChange = (
    day: DayKey,
    field: keyof ScheduleDay,
    value: string,
  ) => {
    setSchedule((currentSchedule) => {
      const currentDay = currentSchedule[day];
      const nextDay: ScheduleDay =
        field === "type"
          ? { ...currentDay, type: value as ScheduleType }
          : field === "title"
            ? { ...currentDay, title: value }
            : { ...currentDay, detail: value };

      return {
        ...currentSchedule,
        [day]: nextDay,
      };
    });
  };

  const handleNameSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (trimmedName) {
      setStep("schedule");
    }
  };

  const handleStartNewProfile = () => {
    setName("");
    setAccent(accentOptions[profiles.length % accentOptions.length]);
    setSchedule(emptySchedule());
    setStep("name");
    setIsSelectorExiting(true);

    window.setTimeout(() => {
      setShowCreator(true);
      setIsSelectorExiting(false);
    }, 280);
  };

  const handleCancelCreateProfile = () => {
    setName("");
    setSchedule(emptySchedule());
    setStep("name");
    setShowCreator(false);
    setIsSelectorExiting(false);
  };

  const handleCreateProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!trimmedName) {
      setStep("name");
      return;
    }

    const profile: Profile = {
      id: crypto.randomUUID(),
      name: trimmedName,
      initials: getInitials(trimmedName) || trimmedName[0].toUpperCase(),
      accent,
      schedule,
    };

    saveProfiles([...profiles, profile]);
    setName("");
    setAccent(accentOptions[(profiles.length + 1) % accentOptions.length]);
    setSchedule(emptySchedule());
    setStep("name");
    setShowCreator(false);
    router.push(`/today/${profile.id}`);
  };

  const shouldShowCreator = !hasProfiles || showCreator;
  const shouldShowSelector = hasProfiles && !showCreator;

  return (
    <main className="min-h-dvh bg-[#080b12] px-5 py-6 text-white">
      <div className="mx-auto flex min-h-[calc(100dvh-3rem)] max-w-5xl flex-col">
        <header className="pt-3 text-center">
          <p className="text-2xl font-semibold tracking-tight">
            Kin<span className="text-cyan-300">Ethic</span>
          </p>
        </header>

        <section
          className={`grid flex-1 gap-8 py-10 ${
            shouldShowCreator ? "place-items-center" : "items-center"
          }`}
        >
          {shouldShowSelector && (
            <div
              className={`profile-selector-panel mx-auto w-full max-w-3xl text-center ${
                isSelectorExiting ? "profile-selector-panel-exit" : ""
              }`}
            >
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Who&apos;s training today?
              </h1>

              <div className="mx-auto mt-8 grid max-w-2xl grid-cols-2 justify-center gap-4 sm:grid-cols-3">
                {profiles.map((profile) => (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => router.push(`/today/${profile.id}`)}
                    className="group flex min-h-44 flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/[0.035] p-4 text-center transition hover:border-white/20 hover:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-4 focus:ring-offset-[#080b12]"
                  >
                    <div className="transition duration-200 group-hover:scale-105">
                      <ProfileBadge profile={profile} />
                    </div>
                    <span className="mt-4">
                      <span className="block text-base font-semibold tracking-tight">
                        {profile.name}
                      </span>
                      <span className="mt-1 block text-sm text-slate-400">
                        {profile.schedule
                          ? `${Object.values(profile.schedule).filter((day) => day.type === "workout").length} scheduled workouts`
                          : "Custom workout split"}
                      </span>
                    </span>
                  </button>
                ))}

                <button
                  type="button"
                  onClick={handleStartNewProfile}
                  className="group flex min-h-44 flex-col items-center justify-center rounded-3xl border border-dashed border-white/15 bg-white/[0.025] p-4 text-center transition hover:border-cyan-300/40 hover:bg-cyan-300/[0.06] focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-4 focus:ring-offset-[#080b12]"
                >
                  <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-4xl font-light leading-none text-slate-300 transition group-hover:border-cyan-300/40 group-hover:text-cyan-100">
                    +
                  </span>
                  <span className="mt-4 text-base font-semibold tracking-tight text-slate-200">
                    Add profile
                  </span>
                </button>
              </div>
            </div>
          )}

          {shouldShowCreator && step === "name" ? (
            <form
              onSubmit={handleNameSubmit}
              className="profile-creator-panel w-full max-w-md rounded-4xl border border-white/10 bg-white/[0.035] p-5 shadow-2xl shadow-black/30 sm:p-7"
            >
              <h2 className="text-2xl font-semibold tracking-tight">
                What&apos;s your name?
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Add the person who will use this workout split.
              </p>

              <label className="mt-6 block">
                <span className="text-sm font-medium text-slate-300">Name</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Enter a name"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-base text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300"
                />
              </label>

              <div
                className={`mt-6 grid gap-3 ${hasProfiles ? "sm:grid-cols-2" : ""}`}
              >
                {hasProfiles && (
                  <button
                    type="button"
                    onClick={handleCancelCreateProfile}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-base font-semibold text-slate-200 transition hover:bg-white/[0.08] active:scale-[0.99]"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="rounded-2xl bg-white px-5 py-4 text-base font-semibold text-slate-950 transition hover:bg-cyan-100 active:scale-[0.99]"
                >
                  Continue to schedule
                </button>
              </div>
            </form>
          ) : shouldShowCreator ? (
            <form
              onSubmit={handleCreateProfile}
              className="profile-creator-panel w-full max-w-2xl rounded-4xl border border-white/10 bg-white/[0.035] p-5 shadow-2xl shadow-black/30 sm:p-7"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight">
                    Build {trimmedName}&apos;s split
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Choose what happens each day and name the workouts to match
                    the split.
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-100">
                  {mainWorkoutCount} workouts
                </span>
              </div>

              <div className="mt-5">
                <p className="text-sm font-medium text-slate-300">
                  Profile color
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {accentOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setAccent(option)}
                      aria-label="Choose profile color"
                      className={`h-10 w-10 rounded-full bg-gradient-to-br ${option} ${
                        accent === option
                          ? "ring-2 ring-cyan-300 ring-offset-2 ring-offset-[#080b12]"
                          : "opacity-80"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-7 space-y-4">
                {dayLabels.map((day) => {
                  const selectedDay = schedule[day.key];
                  const isRestDay = selectedDay.type === "rest";

                  return (
                    <div
                      key={day.key}
                      className="rounded-3xl border border-white/10 bg-black/20 p-4"
                    >
                      <div className="grid gap-3 sm:grid-cols-[0.7fr_1fr]">
                        <label>
                          <span className="text-sm font-semibold text-slate-200">
                            {day.label}
                          </span>
                          <select
                            value={selectedDay.type}
                            onChange={(event) =>
                              handleScheduleChange(
                                day.key,
                                "type",
                                event.target.value,
                              )
                            }
                            className="mt-2 w-full rounded-2xl border border-white/10 bg-[#080b12] px-3 py-3 text-sm text-white outline-none focus:border-cyan-300"
                          >
                            <option value="rest">Rest</option>
                            <option value="workout">Workout</option>
                            <option value="optional">Optional</option>
                          </select>
                        </label>

                        <label>
                          <span className="text-sm font-medium text-slate-400">
                            {isRestDay ? "Day label" : "Workout name"}
                          </span>
                          <input
                            value={selectedDay.title}
                            onChange={(event) =>
                              handleScheduleChange(
                                day.key,
                                "title",
                                event.target.value,
                              )
                            }
                            placeholder={
                              isRestDay
                                ? "Rest Day"
                                : "Upper A, Push, Full Body..."
                            }
                            className="mt-2 w-full rounded-2xl border border-white/10 bg-[#080b12] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-300"
                          />
                        </label>
                      </div>

                      <label className="mt-3 block">
                        <span className="text-sm font-medium text-slate-400">
                          Notes
                        </span>
                        <input
                          value={selectedDay.detail}
                          onChange={(event) =>
                            handleScheduleChange(
                              day.key,
                              "detail",
                              event.target.value,
                            )
                          }
                          placeholder={
                            isRestDay
                              ? "Recovery, stretching, or an easy walk"
                              : "Main lifts, muscle groups, or workout goal"
                          }
                          className="mt-2 w-full rounded-2xl border border-white/10 bg-[#080b12] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-300"
                        />
                      </label>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep("name");
                  }}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-base font-semibold text-slate-200 transition hover:bg-white/[0.08] active:scale-[0.99]"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="rounded-2xl bg-white px-5 py-4 text-base font-semibold text-slate-950 transition hover:bg-cyan-100 active:scale-[0.99]"
                >
                  Save profile
                </button>
              </div>
            </form>
          ) : null}
        </section>

        <footer className="pb-2 text-center text-xs text-slate-600">
          KinEthic
        </footer>
      </div>
    </main>
  );
}
