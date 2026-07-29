"use client";

import { FormEvent, useState } from "react";
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
import { ProfileBadge } from "@/app/_components/ui";
import { useKinEthicData, useKinEthicHydrated } from "@/lib/kinethic/hooks";
import { repository } from "@/lib/kinethic/repository";
import { Gender } from "@/lib/kinethic/domain";
import { ActionButton, AppInput } from "@/components/kinethic-ui";
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

export function ProfileHome({ landingPage = false }: { landingPage?: boolean }) {
  const data = useKinEthicData();
  const hydrated = useKinEthicHydrated();
  const profiles = Object.values(data.profiles);
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<Gender>("prefer_not_to_say");
  const [weightLb, setWeightLb] = useState("");
  const [heightFeet, setHeightFeet] = useState("");
  const [heightInches, setHeightInches] = useState("");
  const [accent, setAccent] = useState(accents[0]);
  const showingCreator = creating;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const parsedAge = Number(age);
    const parsedWeight = Number(weightLb);
    const parsedFeet = Number(heightFeet);
    const parsedInches = Number(heightInches);
    if (
      !name.trim() ||
      !Number.isInteger(parsedAge) ||
      parsedAge < 13 ||
      parsedAge > 120 ||
      !Number.isFinite(parsedWeight) ||
      parsedWeight <= 0 ||
      parsedWeight > 1500 ||
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
      age: parsedAge,
      gender,
      weightLb: parsedWeight,
      heightIn: parsedFeet * 12 + parsedInches,
    });
    router.replace(`/profiles/${profile.id}/splits/new`);
  };
  return (
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
                    {["No account", "No subscription", "No cloud upload"].map(
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
                          Today
                        </p>
                        <p className="mt-1 font-heading text-xl font-semibold">
                          Push strength
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
                          <span className="rounded-full bg-cyan-300/15 px-2.5 py-1 text-xs text-cyan-200">
                            In progress
                          </span>
                        </div>
                        <div className="mt-5 grid grid-cols-3 gap-2">
                          {[
                            ["Set", "03"],
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
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-xs text-slate-400">
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
              <div className="mt-8 grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 sm:grid-cols-3 sm:gap-4">
                {profiles.map((profile) => (
                  <ActionButton
                    tone="ghost"
                    key={profile.id}
                    onClick={() => router.push(`/today/${profile.id}`)}
                    className="panel flex min-h-44 flex-col items-center justify-center p-4 transition hover:border-white/20 hover:bg-white/7"
                  >
                    <ProfileBadge profile={profile} />
                    <span className="mt-4 font-semibold">{profile.name}</span>
                    <span className="mt-1 text-xs text-slate-500">
                      {profile.activeSplitId
                        ? (data.splits[profile.activeSplitId]?.name ??
                          "Set up split")
                        : "Set up split"}
                    </span>
                  </ActionButton>
                ))}
                <ActionButton
                  tone="ghost"
                  onClick={() => {
                    setAccent(accents[profiles.length % accents.length]);
                    setCreating(true);
                  }}
                  className="panel flex min-h-44 flex-col items-center justify-center border-dashed p-4 text-slate-300"
                >
                  <span className="text-4xl font-light">+</span>
                  <span className="mt-4 font-semibold">Add profile</span>
                </ActionButton>
              </div>
            </div>
          ) : (
            <form
              onSubmit={submit}
              className="panel mx-auto w-full max-w-md p-4 sm:p-6"
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
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="field">
                  <span>Age</span>
                  <AppInput
                    required
                    type="number"
                    min="13"
                    max="120"
                    inputMode="numeric"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="Age"
                  />
                </label>
                <label className="field">
                  <span>Gender</span>
                  <Select
                    value={gender}
                    onValueChange={(value) => setGender(value as Gender)}
                  >
                    <SelectTrigger className="mt-2 min-h-12 w-full rounded-2xl border-white/10 bg-[#080b12]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="woman">Woman</SelectItem>
                      <SelectItem value="man">Man</SelectItem>
                      <SelectItem value="nonbinary">Non-binary</SelectItem>
                      <SelectItem value="prefer_not_to_say">
                        Prefer not to say
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </label>
              </div>
              <label className="field mt-4">
                <span>Weight (lb)</span>
                <AppInput
                  required
                  type="number"
                  min="1"
                  max="1500"
                  step="0.1"
                  inputMode="decimal"
                  value={weightLb}
                  onChange={(e) => setWeightLb(e.target.value)}
                  placeholder="Weight"
                />
              </label>
              <fieldset className="mt-4">
                <legend className="text-sm font-medium text-slate-300">
                  Height
                </legend>
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
              </fieldset>
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
                      className={`h-11 w-11 rounded-full bg-linear-to-br ${option} ${accent === option ? "ring-2 ring-cyan-300 ring-offset-2 ring-offset-[#080b12]" : "opacity-70"}`}
                    />
                  ))}
                </div>
              </div>
              <div className="mt-7 grid gap-3">
                <ActionButton tone="primary" type="submit">
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
  );
}
