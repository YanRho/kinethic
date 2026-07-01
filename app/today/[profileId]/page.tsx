import Link from "next/link";
import { notFound } from "next/navigation";

type ProfileId = "bryan" | "darian"; 


type Profile = {
  id: ProfileId;
  name: string;
  initials: string;
  focus: string;
  accent: string;
};

const profiles: Record<ProfileId, Profile> = {
  bryan: {
    id: "bryan",
    name: "Bryan",
    initials: "B",
    focus: "Strength, consistency, and leaning out.",
    accent: "from-cyan-300 via-blue-400 to-indigo-500",
  },
  darian: {
    id: "darian",
    name: "Darian",
    initials: "D",
    focus: "Glute-focused training and steady progress.",
    accent: "from-rose-300 via-fuchsia-400 to-violet-500",
  },
};

const weeklySchedule = {
  bryan: {
    monday: { title: "Rest Day", detail: "Recovery is part of the plan.", type: "rest" },
    tuesday: { title: "Rest Day", detail: "Recovery is part of the plan.", type: "rest" },
    wednesday: { title: "Upper A", detail: "Balanced upper-body strength.", type: "workout" },
    thursday: { title: "Lower A", detail: "Balanced lower-body strength.", type: "workout" },
    friday: { title: "Cardio + Core", detail: "Optional movement day.", type: "optional" },
    saturday: { title: "Upper B", detail: "Shoulder and arm emphasis.", type: "workout" },
    sunday: { title: "Lower B", detail: "Posterior-chain focused lower body.", type: "workout" },
  },
  darian: {
    monday: { title: "Rest Day", detail: "Recovery is part of the plan.", type: "rest" },
    tuesday: { title: "Rest Day", detail: "Recovery is part of the plan.", type: "rest" },
    wednesday: { title: "Upper A", detail: "Upper-body strength and balance.", type: "workout" },
    thursday: { title: "Lower A", detail: "Glutes and hamstrings focus.", type: "workout" },
    friday: { title: "Cardio + Core", detail: "Optional movement day.", type: "optional" },
    saturday: { title: "Upper B", detail: "Upper-body strength and balance.", type: "workout" },
    sunday: { title: "Lower B", detail: "Glutes and quads focus.", type: "workout" },
  },
};

const dayLabels = [
  { key: "monday", label: "Mon" },
  { key: "tuesday", label: "Tue" },
  { key: "wednesday", label: "Wed" },
  { key: "thursday", label: "Thu" },
  { key: "friday", label: "Fri" },
  { key: "saturday", label: "Sat" },
  { key: "sunday", label: "Sun" },
] as const;

function isProfileId(value: string): value is ProfileId {
  return value === "bryan" || value === "darian";
}

function getTodayKey() {
  const weekday = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: "America/Los_Angeles",
  })
    .format(new Date())
    .toLowerCase();

  return weekday as keyof typeof weeklySchedule.bryan;
}

export default async function TodayPage({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await params;

  if (!isProfileId(profileId)) {
    notFound();
  }

  const profile = profiles[profileId];
  const todayKey = getTodayKey();
  const today = weeklySchedule[profileId][todayKey];

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "America/Los_Angeles",
  }).format(new Date());

  const isRestDay = today.type === "rest";
  const isOptionalDay = today.type === "optional";

  return (
    <main className="min-h-dvh bg-[#080b12] px-5 py-6 text-white">
      <div className="mx-auto flex min-h-[calc(100dvh-3rem)] max-w-md flex-col">
        <header className="flex items-center justify-between">
          <Link
            href="/"
            className="text-xl font-semibold tracking-tight transition hover:text-cyan-200"
          >
            Kin<span className="text-cyan-300">Ethic</span>
          </Link>

          <Link
            href="/"
            className="rounded-full border border-white/10 bg-white/4 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/8 hover:text-white"
          >
            Switch profile
          </Link>
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
                {today.title}
              </h2>

              <p className="mt-3 text-base leading-7 text-slate-400">
                {today.detail}
              </p>

              {!isRestDay && (
                <button
                  type="button"
                  className="mt-8 w-full rounded-2xl bg-white px-5 py-4 text-base font-semibold text-slate-950 transition active:scale-[0.99] hover:bg-cyan-100"
                >
                  Start Workout
                </button>
              )}

              {isRestDay && (
                <div className="mt-8">
                    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                        <p className="text-sm leading-6 text-slate-400">
                            No workout is scheduled today. Rest, stretch, or take an easy
                            walk if you feel like moving.
                        </p>
                    </div>
                    <button
                    type="button"
                    className="mt-4 w-full rounded-2xl border border-cyan-300/30 bg-cyan-300/10 px-5 py-4 text-base font-semibold text-cyan-100 transition active:scale-[0.99] hover:bg-cyan-300/20">
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

              <span className="text-xs text-slate-500">4 main workouts</span>
            </div>

            <div className="mt-5 grid grid-cols-7 gap-2">
              {dayLabels.map((day) => {
                const isToday = day.key === todayKey;
                const scheduledDay = weeklySchedule[profileId][day.key];

                return (
                  <div key={day.key} className="text-center">
                    <p className="mb-2 text-xs text-slate-500">{day.label}</p>

                    <div
                      className={`flex aspect-square items-center justify-center rounded-2xl border text-sm font-semibold ${
                        isToday
                          ? "border-cyan-300 bg-cyan-300 text-slate-950"
                          : scheduledDay.type === "rest"
                            ? "border-white/5 bg-white/2 text-slate-600"
                            : "border-white/10 bg-white/4 text-slate-300"
                      }`}
                    >
                      {scheduledDay.type === "rest"
                        ? "—"
                        : scheduledDay.type === "optional"
                          ? "○"
                          : "•"}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="mt-10 rounded-4xl border border-white/10 bg-white/[0.035] p-6">
            <p className="text-sm font-medium text-slate-400">Current focus</p>
            <p className="mt-2 text-base leading-7 text-slate-200">
              {profile.focus}
            </p>
          </section>
        </section>

        <footer className="pb-2 text-center text-xs text-slate-600">
          KinEthic
        </footer>
      </div>
    </main>
  );
}