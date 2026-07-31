"use client";

import { CSSProperties, FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  Check,
  Dumbbell,
  LockKeyhole,
  TimerReset,
  TrendingUp,
} from "lucide-react";
import { ProfileBadge, getProfileThemeStyle } from "@/app/_components/ui";
import { ProfileThemeProvider } from "@/components/profile-theme-context";
import { useKinEthicData, useKinEthicHydrated } from "@/lib/kinethic/hooks";
import { repository } from "@/lib/kinethic/repository";
import { Sex, ageFromBirthDate } from "@/lib/kinethic/domain";
import { ActionButton, AppInput } from "@/components/kinethic-ui";
import {
  ResponsiveDoubleWheelField,
  ResponsiveTripleWheelField,
  ResponsiveWheelField,
} from "@/components/responsive-wheel-picker";
import {
  birthDateParts,
  birthDateFromParts,
  birthYearWheelOptions,
  dayWheelOptions,
  feetWheelOptions,
  formatBirthDate,
  sexWheelOptions,
  inchesWheelOptions,
  initialSexWheelOptions,
  initialWeightWheelOptions,
  monthWheelOptions,
  weightWheelOptions,
} from "@/lib/kinethic/profile-wheel-options";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const accents = [
  "from-cyan-300 via-blue-400 to-indigo-500",
  "from-rose-300 via-fuchsia-400 to-violet-500",
  "from-emerald-300 via-teal-400 to-cyan-500",
  "from-amber-200 via-orange-300 to-rose-400",
];

const neutralProfileThemeStyle = {
  "--profile-accent": "#cbd5e1",
  "--profile-accent-strong": "#94a3b8",
  "--profile-background": "#080b12",
  "--profile-panel": "#10151d",
  "--profile-panel-strong": "#171d27",
  "--profile-border": "rgba(255, 255, 255, 0.1)",
  "--profile-muted": "#94a3b8",
  "--profile-primary-text": "#080b12",
  "--profile-accent-soft": "rgba(203, 213, 225, 0.1)",
  "--profile-accent-border": "rgba(203, 213, 225, 0.28)",
} as CSSProperties;

export function ProfileHome({ landingPage = false }: { landingPage?: boolean }) {
  const data = useKinEthicData();
  const hydrated = useKinEthicHydrated();
  const profiles = Object.values(data.profiles);
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [sex, setSex] = useState<Sex | "">("");
  const [weightLb, setWeightLb] = useState("");
  const [heightFeet, setHeightFeet] = useState("");
  const [heightInches, setHeightInches] = useState("");
  const [accent, setAccent] = useState<string | null>(null);
  const creationThemeStyle = accent
    ? getProfileThemeStyle(accent)
    : neutralProfileThemeStyle;
  const showingCreator = creating;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const parsedAge = ageFromBirthDate(birthDate);
    const parsedWeight = Number(weightLb);
    const parsedFeet = Number(heightFeet);
    const parsedInches = Number(heightInches);
    if (
      !name.trim() ||
      !sex ||
      !accent ||
      parsedAge === null ||
      parsedAge < 13 ||
      parsedAge > 120 ||
      !Number.isFinite(parsedWeight) ||
      parsedWeight < 33 ||
      parsedWeight > 1400 ||
      !Number.isInteger(parsedFeet) ||
      parsedFeet < 1 ||
      parsedFeet > 8 ||
      !Number.isInteger(parsedInches) ||
      parsedInches < 0 ||
      parsedInches > 11
    ) {
      return;
    }
    const profile = repository.createProfile({
      name,
      accent,
      birthDate,
      sex,
      weightLb: parsedWeight,
      heightIn: parsedFeet * 12 + parsedInches,
    });
    router.replace(`/profiles/${profile.id}/splits/new`);
  };
  return (
    <ProfileThemeProvider style={creationThemeStyle}>
      <main className="safe-page min-h-dvh overflow-x-hidden bg-[#080b12] px-3 text-white sm:px-5">
      <div className="mx-auto flex min-h-[calc(100dvh-3rem)] min-w-0 max-w-6xl flex-col">
        <header className="flex min-h-14 items-center justify-between gap-4 pt-1">
          {landingPage ? (
            <div className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
              Kin<span className="text-cyan-300">Ethic</span>
            </div>
          ) : (
            <Link
              href="/"
              aria-label="KinEthic landing page"
              className="font-heading rounded-lg text-xl font-semibold tracking-tight outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-cyan-300 sm:text-2xl"
            >
              Kin<span className="text-cyan-300">Ethic</span>
            </Link>
          )}
          {landingPage && (
            <ActionButton
              tone="ghost"
              onClick={() => router.push("/profiles")}
              className="rounded-xl px-3 text-sm font-semibold text-slate-300 sm:px-4"
            >
              Get started
            </ActionButton>
          )}
        </header>
        <section className="flex flex-1 items-center py-8 sm:py-10">
          {landingPage ? (
            <div className="w-full py-6 sm:py-10">
              <div className="grid items-center gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/8 px-3 py-1.5 text-xs font-semibold text-cyan-200">
                    <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
                    Private by design · stored on your device
                  </div>
                  <h1 className="font-heading mt-6 text-4xl leading-[1.02] font-semibold tracking-[-0.04em] text-balance sm:text-6xl lg:text-7xl">
                    Train with intent.
                    <span className="block bg-linear-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                      Progress with proof.
                    </span>
                  </h1>
                  <p className="mt-6 max-w-xl text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">
                    Build smarter workout plans, log every set, and use your
                    training history to make the next session better than the
                    last.
                  </p>
                  <div className="mt-8 flex flex-col gap-3 min-[420px]:flex-row">
                    <ActionButton
                      tone="primary"
                      onClick={() => router.push("/profiles")}
                      className="group min-[420px]:w-auto min-[420px]:px-6"
                    >
                      Start training
                      <ArrowRight
                        className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1"
                        aria-hidden="true"
                      />
                    </ActionButton>
                    <a
                      href="#how-it-works"
                      className="muted-button min-[420px]:px-6"
                    >
                      See how it works
                    </a>
                  </div>
                  <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500 sm:text-sm">
                    {["No account", "No cloud upload"].map(
                      (benefit) => (
                        <span key={benefit} className="flex items-center gap-2">
                          <Check
                            className="h-4 w-4 text-emerald-300"
                            aria-hidden="true"
                          />
                          {benefit}
                        </span>
                      ),
                    )}
                  </div>
                </div>

                <div className="relative mx-auto w-full max-w-xl lg:mx-0">
                  <div className="absolute -inset-8 -z-10 rounded-full bg-cyan-400/10 blur-3xl" />
                  <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#0c1420] p-3 shadow-2xl shadow-cyan-950/30 sm:p-5">
                    <div className="flex items-center justify-between px-1 pb-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">
                          Today · Push strength
                        </p>
                        <p className="mt-2 font-heading text-xl font-semibold">
                          Push A
                        </p>
                      </div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950">
                        <Dumbbell className="h-5 w-5" aria-hidden="true" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="rounded-2xl border border-cyan-300/25 bg-cyan-300/8 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs text-cyan-200">Exercise 1 of 4</p>
                            <p className="mt-1 font-semibold">Barbell bench press</p>
                          </div>
                          <div className="shrink-0">
                            <span className="block rounded-full bg-cyan-300/15 px-2.5 py-1 text-center text-xs text-cyan-200">
                              Paused
                            </span>
                            <div className="mt-1 text-right">
                              <p className="text-[10px] uppercase tracking-wider text-slate-500">
                                Workout time
                              </p>
                              <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums">
                                12:20
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="mt-5 grid grid-cols-3 gap-2">
                          {[
                            ["Sets", "3"],
                            ["Weight", "185 lb"],
                            ["Target", "8–10"],
                          ].map(([label, value]) => (
                            <div
                              key={label}
                              className="rounded-xl bg-black/20 px-2 py-3 text-center"
                            >
                              <p className="text-[10px] uppercase tracking-wider text-slate-500">
                                {label}
                              </p>
                              <p className="mt-1 text-sm font-semibold text-white">
                                {value}
                              </p>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/8 px-3 py-2.5">
                          <TimerReset
                            className="h-4 w-4 text-cyan-300"
                            aria-hidden="true"
                          />
                          <span className="text-xs text-slate-400">Rest timer</span>
                          <span className="ml-auto font-mono text-sm">01:24</span>
                        </div>
                      </div>
                      {["Incline dumbbell press", "Cable lateral raise"].map(
                        (exercise, index) => (
                          <div
                            key={exercise}
                            className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/3 px-4 py-3.5"
                          >
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-xs text-slate-400">
                              0{index + 2}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-sm font-medium">
                              {exercise}
                            </span>
                            <span className="text-xs text-slate-500">3 sets</span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div
                id="how-it-works"
                className="scroll-mt-8 pt-24 sm:pt-32"
              >
                <div className="max-w-xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                    Built for the work
                  </p>
                  <h2 className="font-heading mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                    Everything you need between warm-up and last set.
                  </h2>
                </div>
                <div className="mt-8 grid gap-3 md:grid-cols-3">
                  {[
                    {
                      icon: Dumbbell,
                      title: "Plan your training",
                      body: "Create reusable workouts and organize them into a split that fits your week.",
                    },
                    {
                      icon: BarChart3,
                      title: "Log without friction",
                      body: "Track weight, reps, duration, rest, and notes without breaking focus.",
                    },
                    {
                      icon: TrendingUp,
                      title: "Progress with context",
                      body: "See your previous performance and get useful targets for the next session.",
                    },
                  ].map(({ icon: Icon, title, body }, index) => (
                    <div
                      key={title}
                      className="rounded-3xl border border-white/10 bg-white/3 p-5 sm:p-6"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-300">
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <span className="font-mono text-xs text-slate-600">
                          0{index + 1}
                        </span>
                      </div>
                      <h3 className="mt-6 text-lg font-semibold">{title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        {body}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : !hydrated ? (
            <div
              aria-busy="true"
              aria-label="Loading local profiles"
              className="w-full text-center text-sm text-slate-400"
            >
              Loading profiles…
            </div>
          ) : !showingCreator ? (
            <div className="w-full text-center">
              <h1 className="text-2xl font-semibold sm:text-3xl">
                Who&apos;s training today?
              </h1>
              <div className="mx-auto mt-8 grid max-w-2xl grid-cols-2 gap-x-2 gap-y-5 sm:flex sm:max-w-4xl sm:flex-wrap sm:justify-center sm:gap-x-5 sm:gap-y-8">
                {profiles.map((profile) => (
                  <button
                    type="button"
                    key={profile.id}
                    onClick={() => router.push(`/today/${profile.id}`)}
                    className="group flex h-auto min-h-0 min-w-0 flex-col items-center justify-start gap-3 whitespace-normal border-0 bg-transparent p-0 text-center shadow-none outline-none ring-0 sm:w-36 sm:shrink-0"
                  >
                    <span className="block rounded-full ring-2 ring-transparent transition duration-200 ease-out group-hover:scale-105 group-hover:ring-white/60 group-hover:shadow-[0_0_30px_rgba(255,255,255,0.22)] group-focus-visible:scale-105 group-focus-visible:ring-white/70 group-focus-visible:shadow-[0_0_30px_rgba(255,255,255,0.22)]">
                      <ProfileBadge profile={profile} size="lg" />
                    </span>
                    <span className="block w-full break-words text-base font-semibold leading-6 text-slate-200 sm:text-lg">
                      {profile.name}
                    </span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setAccent(null);
                    setSex("");
                    setCreating(true);
                  }}
                  className="group flex h-auto min-h-0 min-w-0 flex-col items-center justify-start gap-3 whitespace-normal border-0 bg-transparent p-0 text-center text-slate-300 shadow-none outline-none ring-0 sm:w-36 sm:shrink-0"
                >
                  <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-white/15 bg-white/5 text-4xl font-light transition duration-200 ease-out group-hover:scale-105 group-hover:border-white/60 group-hover:bg-white/10 group-hover:shadow-[0_0_30px_rgba(255,255,255,0.18)] group-focus-visible:scale-105 group-focus-visible:border-white/70 group-focus-visible:shadow-[0_0_30px_rgba(255,255,255,0.18)] sm:h-28 sm:w-28">
                    +
                  </span>
                  <span className="block w-full break-words text-base font-semibold leading-6 sm:text-lg">
                    Add profile
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={submit}
              className="profile-theme panel mx-auto w-full max-w-md p-4 sm:p-6"
              style={{
                ...creationThemeStyle,
                backgroundColor: "var(--profile-panel)",
                backgroundImage: "none",
              }}
            >
              <h1 className="text-2xl font-semibold">Create a local profile</h1>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                This profile and its workout data stay in this browser.
              </p>
              <label className="field mt-6">
                <span>Name</span>
                <AppInput
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter a name"
                />
              </label>
              <div className="mt-5">
                <p className="text-sm font-medium text-slate-300">
                  Profile color
                </p>
                <div className="mt-3 flex gap-3">
                  {accents.map((option) => (
                    <ActionButton
                      tone="ghost"
                      aria-label="Choose profile color"
                      type="button"
                      key={option}
                      onClick={() => setAccent(option)}
                      className={`h-11 w-11 rounded-full bg-linear-to-br ${option} ${accent === option ? "ring-2 ring-white ring-offset-2 ring-offset-[#080b12]" : "opacity-70"}`}
                    />
                  ))}
                </div>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="field">
                  <span>Birthdate</span>
                  <ResponsiveTripleWheelField
                    title="Birthdate"
                    labels={["Month", "Day", "Year"]}
                    values={[
                      birthDateParts(birthDate).month,
                      birthDateParts(birthDate).day,
                      birthDateParts(birthDate).year,
                    ]}
                    options={[
                      monthWheelOptions,
                      dayWheelOptions,
                      birthYearWheelOptions,
                    ]}
                    displayValue={formatBirthDate(birthDate)}
                    onValueChange={(month, day, year) =>
                      setBirthDate(birthDateFromParts(month, day, year))
                    }
                    style={creationThemeStyle}
                  >
                    <AppInput
                      required
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                    />
                  </ResponsiveTripleWheelField>
                </label>
                <label className="field">
                  <span>Sex</span>
                  <ResponsiveWheelField
                    title="Sex"
                    value={sex}
                    options={sex ? sexWheelOptions : initialSexWheelOptions}
                    onValueChange={(value) => setSex(value as Sex)}
                    style={creationThemeStyle}
                  >
                    <Select
                      value={sex}
                      onValueChange={(value) => setSex(value as Sex)}
                    >
                      <SelectTrigger className="mt-2 min-h-12 w-full rounded-2xl border-white/10 bg-[#080b12]">
                        <SelectValue placeholder="Choose sex" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="male">Male</SelectItem>
                      </SelectContent>
                    </Select>
                  </ResponsiveWheelField>
                </label>
              </div>
              <label className="field mt-4">
                <span>Weight (lb)</span>
                <ResponsiveWheelField
                  title="Weight (lb)"
                  value={weightLb}
                  options={
                    weightLb
                      ? weightWheelOptions
                      : initialWeightWheelOptions
                  }
                  onValueChange={(value) => setWeightLb(String(value))}
                  style={creationThemeStyle}
                >
                  <AppInput
                    required
                    type="number"
                    min="33"
                    max="1400"
                    step="0.1"
                    inputMode="decimal"
                    value={weightLb}
                    onChange={(e) => setWeightLb(e.target.value)}
                    placeholder="Weight"
                  />
                </ResponsiveWheelField>
              </label>
              <fieldset className="mt-4">
                <legend className="text-sm font-medium text-slate-300">
                  Height
                </legend>
                <ResponsiveDoubleWheelField
                  title="Height"
                  leftLabel="Feet"
                  rightLabel="Inches"
                  leftValue={heightFeet}
                  rightValue={heightInches}
                  leftOptions={feetWheelOptions}
                  rightOptions={inchesWheelOptions}
                  displayValue={
                    heightFeet
                      ? `${heightFeet} ft ${heightInches || 0} in`
                      : "Choose height"
                  }
                  onValueChange={(feet, inches) => {
                    setHeightFeet(feet);
                    setHeightInches(inches);
                  }}
                  style={creationThemeStyle}
                >
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <label className="field">
                      <span className="sr-only">Height in feet</span>
                      <AppInput
                        required
                        type="number"
                        min="1"
                        max="8"
                        inputMode="numeric"
                        value={heightFeet}
                        onChange={(e) => setHeightFeet(e.target.value)}
                        placeholder="Feet"
                      />
                    </label>
                    <label className="field">
                      <span className="sr-only">Additional height in inches</span>
                      <AppInput
                        required
                        type="number"
                        min="0"
                        max="11"
                        inputMode="numeric"
                        value={heightInches}
                        onChange={(e) => setHeightInches(e.target.value)}
                        placeholder="Inches"
                      />
                    </label>
                  </div>
                </ResponsiveDoubleWheelField>
              </fieldset>
              <div className="mt-7 grid gap-3">
                <ActionButton
                  tone="primary"
                  type="submit"
                  disabled={!sex || !accent}
                >
                  Create profile
                </ActionButton>
                <ActionButton
                  type="button"
                  onClick={() => setCreating(false)}
                >
                  Cancel
                </ActionButton>
              </div>
            </form>
          )}
        </section>
      </div>
      </main>
    </ProfileThemeProvider>
  );
}
