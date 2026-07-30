"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Dumbbell,
  LockKeyhole,
  LogOut,
  Settings,
  TimerReset,
  Trash2,
} from "lucide-react";
import {
  Brand,
  EmptyState,
  ProfileBadge,
  getProfileThemeStyle,
} from "@/app/_components/ui";
import { ProfileThemeProvider } from "@/components/profile-theme-context";
import {
  Gender,
  ageFromBirthDate,
  dayLabel,
  localDay,
  weekdays,
} from "@/lib/kinethic/domain";
import { useKinEthicData } from "@/lib/kinethic/hooks";
import { repository } from "@/lib/kinethic/repository";
import { getPersonalRecordWeight } from "@/lib/kinethic/workout-history";
import {
  formatTimer,
  useElapsedWorkoutSeconds,
} from "@/features/workout-sessions/use-session-timers";
import {
  calculateBmi,
  getBmiCategory,
  getHealthyWeightRange,
} from "@/lib/kinethic/bmi";
import { resolveToday } from "@/features/today/resolve-today";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ActionButton, AppInput, Surface } from "@/components/kinethic-ui";
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
  genderWheelOptions,
  inchesWheelOptions,
  includeCurrentWheelValue,
  monthWheelOptions,
  weightWheelOptions,
} from "@/lib/kinethic/profile-wheel-options";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const bmiGradient = (bmi: number) => {
  if (bmi < 18.5) return "from-sky-500 via-cyan-500 to-blue-600";
  if (bmi < 25) return "from-emerald-400 via-green-500 to-teal-600";
  if (bmi < 30) return "from-amber-400 via-orange-500 to-amber-600";
  if (bmi < 35) return "from-orange-500 via-rose-500 to-red-600";
  if (bmi < 40) return "from-rose-500 via-red-600 to-red-800";
  return "from-fuchsia-600 via-purple-700 to-red-800";
};

function PausedWorkoutTime({
  sessionId,
  startedAt,
  pausedAt,
  accumulatedPausedSeconds,
}: {
  sessionId: string;
  startedAt: string;
  pausedAt?: string | null;
  accumulatedPausedSeconds?: number;
}) {
  useEffect(() => {
    repository.pauseWorkoutSession(sessionId);
  }, [sessionId]);

  const elapsedSeconds = useElapsedWorkoutSeconds(
    startedAt,
    pausedAt ?? null,
    accumulatedPausedSeconds ?? 0,
  );

  return (
    <div className="mt-1 text-right">
      <p className="text-[10px] uppercase tracking-wider text-slate-500">
        Workout time
      </p>
      <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums">
        {formatTimer(elapsedSeconds)}
      </p>
    </div>
  );
}

export function TodayScreen({ profileId }: { profileId: string }) {
  const data = useKinEthicData();
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBirthDate, setEditBirthDate] = useState("");
  const [editGender, setEditGender] =
    useState<Gender>("prefer_not_to_say");
  const [editWeightLb, setEditWeightLb] = useState("");
  const [editHeightFeet, setEditHeightFeet] = useState("");
  const [editHeightInches, setEditHeightInches] = useState("");
  const profile = data.profiles[profileId];
  const experience = resolveToday(data, profileId);
  const today = localDay();
  if (!profile) {
    return (
      <main className="grid min-h-dvh place-items-center bg-[#080b12] px-5 text-white">
        <div className="max-w-sm">
          <EmptyState
            eyebrow="Profile not found"
            title="This profile is not on this device"
            body="Profiles are stored locally in each browser."
            action={
              <ActionButton asChild tone="primary">
                <Link href="/profiles">Back to profiles</Link>
              </ActionButton>
            }
          />
        </div>
      </main>
    );
  }

  const split = profile.activeSplitId
    ? data.splits[profile.activeSplitId]
    : undefined;
  const workout =
    experience.kind === "workout"
      ? data.workouts[experience.workoutId]
      : undefined;
  const activeWorkoutSession = workout
    ? Object.values(data.workoutSessions)
        .filter(
          (session) =>
            session.profileId === profileId &&
            session.workoutId === workout.id &&
            !session.completedAt,
        )
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0]
    : undefined;
  const workoutInProgress = Boolean(activeWorkoutSession);
  const currentWorkoutExerciseIndex = workout
    ? Math.min(
        activeWorkoutSession?.currentExerciseIndex ?? 0,
        Math.max(0, workout.exercises.length - 1),
      )
    : 0;
  const displayedWorkoutExercises = workout
    ? workout.exercises
        .map((item, index) => ({ item, index }))
        .slice(currentWorkoutExerciseIndex)
    : [];
  const deleteProfile = () => {
    repository.deleteProfile(profile.id);
    router.replace("/profiles");
  };
  const openProfileEditor = () => {
    setEditName(profile.name);
    setEditBirthDate(profile.birthDate ?? "");
    setEditGender(profile.gender ?? "prefer_not_to_say");
    setEditWeightLb(profile.weightLb?.toString() ?? "");
    setEditHeightFeet(
      profile.heightIn ? Math.floor(profile.heightIn / 12).toString() : "",
    );
    setEditHeightInches(
      profile.heightIn ? (profile.heightIn % 12).toString() : "",
    );
    setProfileDialogOpen(true);
  };
  const saveProfile = () => {
    const age = ageFromBirthDate(editBirthDate);
    const weightLb = Number(editWeightLb);
    const heightFeet = Number(editHeightFeet);
    const heightInches = Number(editHeightInches);
    const heightIn = heightFeet * 12 + heightInches;
    if (
      !editName.trim() ||
      age === null ||
      age < 13 ||
      age > 120 ||
      !Number.isFinite(weightLb) ||
      weightLb < 33 ||
      weightLb > 1400 ||
      !Number.isInteger(heightFeet) ||
      heightFeet < 1 ||
      heightFeet > 8 ||
      !Number.isInteger(heightInches) ||
      heightInches < 0 ||
      heightInches > 11
    ) {
      return;
    }
    repository.updateProfile(profile.id, {
      name: editName,
      birthDate: editBirthDate,
      gender: editGender,
      weightLb,
      heightIn,
    });
    setProfileDialogOpen(false);
  };
  const bmi =
    profile.weightLb && profile.heightIn
      ? calculateBmi(profile.weightLb, profile.heightIn)
      : null;
  const profileAge = profile.birthDate
    ? ageFromBirthDate(profile.birthDate)
    : null;
  const healthyWeightRange = profile.heightIn
    ? getHealthyWeightRange(profile.heightIn)
    : null;
  const startWorkout = () => {
    if (!workout || workout.exercises.length === 0) {
      return;
    }

    if (activeWorkoutSession) {
      repository.resumeWorkoutSession(activeWorkoutSession.id);
      router.push(
        `/profiles/${profileId}/workout-sessions/${activeWorkoutSession.id}`,
      );
      return;
    }

    const session = repository.startWorkoutSession(profileId, workout.id);

    if (session) {
      router.push(`/profiles/${profileId}/workout-sessions/${session.id}`);
    }
  };
  return (
    <ProfileThemeProvider style={getProfileThemeStyle(profile.accent)}>
      <main
        className="profile-theme safe-page min-h-dvh overflow-x-hidden bg-[#080b12] px-3 text-white sm:px-4"
        style={getProfileThemeStyle(profile.accent)}
      >
      <div className="mx-auto max-w-md">
        <header className="flex items-center justify-between">
          <Link href="/profiles">
            <Brand />
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <ActionButton
                type="button"
                className="h-12 w-12 p-0"
                aria-label="Profile settings"
                title="Profile settings"
              >
                <Settings aria-hidden="true" className="h-5 w-5" />
              </ActionButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="min-w-52 border border-(--profile-border) bg-(--profile-panel-strong) p-2 text-white"
              style={getProfileThemeStyle(profile.accent)}
            >
              <DropdownMenuLabel>{profile.name}</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-(--profile-border)" />
              <DropdownMenuItem asChild className="min-h-11 px-3 py-2">
                <Link href="/profiles" replace>
                  <LogOut aria-hidden="true" />
                  Switch profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                className="min-h-11 px-3 py-2"
                onSelect={() => setDeleteDialogOpen(true)}
              >
                <Trash2 aria-hidden="true" />
                Delete profile
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <section className="pt-10">
          <div className="flex items-center gap-3 sm:gap-4">
            <ProfileBadge profile={profile} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-slate-400">Welcome back,</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="theme-accent-text min-w-0 truncate rounded-md text-left text-2xl font-semibold underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4"
                  onClick={openProfileEditor}
                  aria-label={`Edit ${profile.name}'s profile`}
                >
                  {profile.name}
                </button>
                {bmi && profileAge !== null ? (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className={`rounded-full bg-linear-to-r px-2.5 py-1 text-xs font-bold text-white shadow-sm ${profileAge >= 20 ? bmiGradient(bmi) : "from-indigo-500 via-violet-500 to-purple-600"}`}
                        aria-label={`BMI ${bmi.toFixed(1)}${profileAge >= 20 ? `, ${getBmiCategory(bmi)}` : ""}`}
                      >
                        BMI {bmi.toFixed(1)}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      align="start"
                      style={getProfileThemeStyle(profile.accent)}
                      className="profile-theme w-[min(20rem,calc(100vw-2rem))] border border-(--profile-border) bg-(--profile-panel-strong) p-4 text-white"
                    >
                      <p className="font-semibold">
                        {profileAge >= 20
                          ? getBmiCategory(bmi)
                          : "Age-specific guidance"}
                      </p>
                      {profileAge >= 20 && healthyWeightRange ? (
                        <p className="text-sm leading-6 text-slate-400">
                          The WHO healthy adult BMI range of 18.5–24.9 is about{" "}
                          {Math.round(healthyWeightRange.minLb)}–
                          {Math.round(healthyWeightRange.maxLb)} lb at your
                          height.
                        </p>
                      ) : (
                        <p className="text-sm leading-6 text-slate-400">
                          For people under 20, WHO uses age- and sex-specific
                          growth references instead of adult categories.
                        </p>
                      )}
                      <p className="text-xs leading-5 text-slate-500">
                        BMI is a screening measure, not a diagnosis or
                        personalized target.
                      </p>
                      <a
                        className="theme-accent-text text-xs font-semibold underline underline-offset-4"
                        href="https://www.who.int/europe/news-room/fact-sheets/item/nutrition---maintaining-a-healthy-lifestyle"
                        target="_blank"
                        rel="noreferrer"
                      >
                        WHO adult BMI guidance
                      </a>
                    </PopoverContent>
                  </Popover>
                ) : (
                  <button
                    type="button"
                    className="rounded-full border border-(--profile-border) px-2.5 py-1 text-xs font-semibold text-slate-400"
                    onClick={openProfileEditor}
                  >
                    Add BMI
                  </button>
                )}
              </div>
            </div>
          </div>
          <p className="mt-10 text-sm font-medium text-slate-500">
            {new Intl.DateTimeFormat(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            }).format(new Date())}
          </p>
          <Surface className="mt-4 overflow-hidden p-3 shadow-2xl shadow-black/30 sm:p-5">
            {experience.kind === "workout" && workout ? (
              <>
                <div className="flex items-start justify-between gap-4 px-1 pb-4">
                  <div className="min-w-0">
                    <p className="eyebrow">Today · {split?.name}</p>
                    <h2 className="mt-2 break-words text-xl font-semibold sm:text-2xl">
                      {workout.name}
                    </h2>
                  </div>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-(--profile-accent) text-(--profile-primary-text)">
                    <Dumbbell className="h-5 w-5" aria-hidden="true" />
                  </div>
                </div>
                <div className="space-y-3">
                  {displayedWorkoutExercises.map(
                    ({ item, index }, displayIndex) => {
                      const exercise = data.exercises[item.exerciseId];
                      const trackingType =
                        item.trackingType ??
                        exercise?.trackingType ??
                        "weight_reps";
                      const target =
                        trackingType === "duration"
                          ? `${item.durationSeconds ?? 0}s`
                          : item.reps.kind === "exact"
                            ? `${item.reps.reps}`
                            : `${item.reps.min}–${item.reps.max}`;
                      const personalRecordWeight =
                        trackingType === "weight_reps"
                          ? getPersonalRecordWeight(
                              Object.values(data.workoutSessions),
                              profileId,
                              item.exerciseId,
                              item.weightUnit ?? "lb",
                            )
                          : undefined;
                      const measure =
                        trackingType === "weight_reps"
                          ? personalRecordWeight !== undefined ||
                            item.weight !== undefined
                            ? `${personalRecordWeight ?? item.weight} ${item.weightUnit ?? "lb"}`
                            : "—"
                          : trackingType === "duration"
                            ? "Timed"
                            : "Reps";

                      if (displayIndex > 0) {
                        return (
                          <div
                            key={item.id}
                            className="rounded-2xl border border-(--profile-border) bg-(--profile-panel-strong) px-4 py-3.5"
                          >
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 text-xs text-slate-400">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            <div className="min-w-0 flex-1">
                              <h3 className="truncate text-sm font-semibold">
                                {exercise?.name ?? "Unavailable exercise"}
                              </h3>
                              {item.notes && (
                                <p className="mt-0.5 truncate text-xs text-slate-500">
                                  {item.notes}
                                </p>
                              )}
                            </div>
                            <span className="shrink-0 text-xs text-slate-500">
                              {item.sets} sets
                            </span>
                          </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={item.id}
                          className="theme-accent-surface rounded-2xl border p-4"
                        >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="theme-accent-text text-xs">
                              Exercise {index + 1} of {workout.exercises.length}
                            </p>
                            <h3 className="mt-1 break-words font-semibold">
                              {exercise?.name ?? "Unavailable exercise"}
                            </h3>
                          </div>
                          <div className="shrink-0">
                            <span className="theme-accent-surface theme-accent-text block rounded-full border-0 px-2.5 py-1 text-center text-xs">
                              {workoutInProgress ? "Paused" : "Up first"}
                            </span>
                            {activeWorkoutSession && (
                              <PausedWorkoutTime
                                sessionId={activeWorkoutSession.id}
                                startedAt={activeWorkoutSession.startedAt}
                                pausedAt={activeWorkoutSession.pausedAt}
                                accumulatedPausedSeconds={
                                  activeWorkoutSession.accumulatedPausedSeconds
                                }
                              />
                            )}
                          </div>
                        </div>
                        <div className="mt-5 grid grid-cols-3 gap-2">
                          {[
                            ["Sets", String(item.sets)],
                            [
                              trackingType === "weight_reps"
                                ? "Weight"
                                : "Mode",
                              measure,
                            ],
                            ["Target", target],
                          ].map(([label, value]) => (
                            <div
                              key={label}
                              className="rounded-xl bg-black/20 px-2 py-3 text-center"
                            >
                              <p className="text-[10px] uppercase tracking-wider text-slate-500">
                                {label}
                              </p>
                              <p className="mt-1 truncate text-sm font-semibold">
                                {value}
                              </p>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 flex items-center gap-3 rounded-xl border border-(--profile-border) px-3 py-2.5">
                          <TimerReset
                            className="theme-accent-text h-4 w-4"
                            aria-hidden="true"
                          />
                          <span className="text-xs text-slate-400">Rest timer</span>
                          <span className="ml-auto font-mono text-sm">
                            {Math.floor(item.restSeconds / 60)
                              .toString()
                              .padStart(2, "0")}
                            :{(item.restSeconds % 60)
                              .toString()
                              .padStart(2, "0")}
                          </span>
                        </div>
                        {item.notes && (
                          <p className="mt-3 text-xs leading-5 text-slate-500">
                            {item.notes}
                          </p>
                        )}
                        </div>
                      );
                    },
                  )}
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <ActionButton
                    tone="primary"
                    disabled={workout.exercises.length === 0}
                    onClick={startWorkout}
                  >
                    {workoutInProgress ? "Resume Workout" : "Start Workout"}
                  </ActionButton>
                  {workoutInProgress ? (
                    <ActionButton
                      type="button"
                      disabled
                      title="Finish the active workout before editing its exercises"
                    >
                      <LockKeyhole className="mr-2 h-4 w-4" aria-hidden="true" />
                      Edit exercises
                    </ActionButton>
                  ) : (
                    <ActionButton asChild>
                      <Link
                        href={`/profiles/${profileId}/workouts/${workout.id}/edit`}
                      >
                        Edit exercises
                      </Link>
                    </ActionButton>
                  )}
                </div>
              </>
            ) : experience.kind === "rest" ? (
              <>
                <p className="eyebrow text-slate-400">
                  Recovery · {split?.name}
                </p>
                <h2 className="mt-4 text-2xl font-semibold sm:text-3xl">
                  Rest day
                </h2>
                <p className="mt-3 leading-7 text-slate-400">
                  No workout is assigned today. Rest, recover, or move however
                  feels good.
                </p>
              </>
            ) : (
              <>
                <p className="eyebrow">Setup needed</p>
                <h2 className="mt-4 text-2xl font-semibold sm:text-3xl">
                  {experience.kind === "no-active-split"
                    ? "Choose an active split"
                    : experience.kind === "invalid-split"
                      ? "Active split unavailable"
                      : "Workout unavailable"}
                </h2>
                <p className="mt-3 leading-7 text-slate-400">
                  {experience.kind === "missing-workout"
                    ? "Today references a workout that no longer exists. Edit the split to replace or remove it."
                    : "Create a workout split or choose one as active to see today’s training."}
                </p>
                <ActionButton asChild tone="primary" className="mt-6">
                  <Link href={`/profiles/${profileId}/splits`}>
                    Manage splits
                  </Link>
                </ActionButton>
              </>
            )}
          </Surface>
          {split && (
            <section className="mt-9">
              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-slate-400">This week</p>
                  <h2 className="mt-1 truncate text-xl font-semibold">
                    {split.name}
                  </h2>
                </div>
                <Link
                  className="theme-accent-text text-sm font-semibold"
                  href={`/profiles/${profileId}/splits/${split.id}/edit`}
                >
                  Edit
                </Link>
              </div>
              <div className="mt-4 space-y-2">
                {weekdays.map((day) => {
                  const assigned = split.schedule[day]
                    ? data.workouts[split.schedule[day]!]
                    : undefined;
                  return (
                    <div
                      key={day}
                      className={`flex min-h-14 items-center justify-between gap-3 rounded-2xl border px-3 sm:px-4 ${day === today ? "theme-accent-surface" : "border-white/10 bg-white/2.5"}`}
                    >
                      <span className="text-sm font-medium">
                        {dayLabel(day)}
                      </span>
                      <span
                        className={`min-w-0 truncate text-right text-sm ${assigned ? "text-slate-300" : "text-slate-600"}`}
                      >
                        {assigned?.name ?? "Rest"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
          <nav className="mt-8 grid grid-cols-1 gap-2 min-[360px]:grid-cols-2 sm:gap-3">
            <ActionButton asChild>
              <Link href={`/profiles/${profileId}/splits`}>
                Workout splits
              </Link>
            </ActionButton>
            <ActionButton asChild>
              <Link href={`/profiles/${profileId}/workouts`}>Workouts</Link>
            </ActionButton>
          </nav>
        </section>
      </div>
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent
          className="profile-theme max-h-[calc(100dvh-2rem)] overflow-y-auto border-(--profile-border) bg-(--profile-panel) text-white sm:max-w-md"
          style={getProfileThemeStyle(profile.accent)}
        >
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>
              Update your personal details and BMI inputs.
            </DialogDescription>
          </DialogHeader>
          <label className="field">
            <span>Name</span>
            <AppInput
              value={editName}
              onChange={(event) => setEditName(event.target.value)}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field">
              <span>Birthdate</span>
              <ResponsiveTripleWheelField
                title="Birthdate"
                labels={["Month", "Day", "Year"]}
                values={[
                  birthDateParts(editBirthDate).month,
                  birthDateParts(editBirthDate).day,
                  birthDateParts(editBirthDate).year,
                ]}
                options={[
                  monthWheelOptions,
                  dayWheelOptions,
                  birthYearWheelOptions,
                ]}
                displayValue={formatBirthDate(editBirthDate)}
                onValueChange={(month, day, year) =>
                  setEditBirthDate(birthDateFromParts(month, day, year))
                }
                style={getProfileThemeStyle(profile.accent)}
              >
                <AppInput
                  type="date"
                  value={editBirthDate}
                  onChange={(event) => setEditBirthDate(event.target.value)}
                />
              </ResponsiveTripleWheelField>
            </label>
            <label className="field">
              <span>Gender</span>
              <ResponsiveWheelField
                title="Gender"
                value={editGender}
                options={genderWheelOptions}
                onValueChange={(value) => setEditGender(value as Gender)}
                style={getProfileThemeStyle(profile.accent)}
              >
                <Select
                  value={editGender}
                  onValueChange={(value) => setEditGender(value as Gender)}
                >
                  <SelectTrigger className="mt-2 min-h-12 w-full rounded-2xl border-(--profile-border) bg-(--profile-background)">
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
              </ResponsiveWheelField>
            </label>
          </div>
          <label className="field">
            <span>Weight (lb)</span>
            <ResponsiveWheelField
              title="Weight (lb)"
              value={editWeightLb}
              options={includeCurrentWheelValue(
                weightWheelOptions,
                editWeightLb,
              )}
              onValueChange={(value) => setEditWeightLb(String(value))}
              style={getProfileThemeStyle(profile.accent)}
            >
              <AppInput
                type="number"
                min="33"
                max="1400"
                step="0.1"
                inputMode="decimal"
                value={editWeightLb}
                onChange={(event) => setEditWeightLb(event.target.value)}
              />
            </ResponsiveWheelField>
          </label>
          <fieldset>
            <legend className="text-sm font-medium text-slate-300">
              Height
            </legend>
            <ResponsiveDoubleWheelField
              title="Height"
              leftLabel="Feet"
              rightLabel="Inches"
              leftValue={editHeightFeet}
              rightValue={editHeightInches}
              leftOptions={feetWheelOptions}
              rightOptions={inchesWheelOptions}
              displayValue={`${editHeightFeet} ft ${editHeightInches} in`}
              onValueChange={(feet, inches) => {
                setEditHeightFeet(feet);
                setEditHeightInches(inches);
              }}
              style={getProfileThemeStyle(profile.accent)}
            >
              <div className="mt-2 grid grid-cols-1 gap-3 min-[360px]:grid-cols-2">
                <label className="field">
                  <span className="sr-only">Height in feet</span>
                  <AppInput
                    type="number"
                    min="1"
                    max="8"
                    inputMode="numeric"
                    placeholder="Feet"
                    value={editHeightFeet}
                    onChange={(event) => setEditHeightFeet(event.target.value)}
                  />
                </label>
                <label className="field">
                  <span className="sr-only">Additional height in inches</span>
                  <AppInput
                    type="number"
                    min="0"
                    max="11"
                    inputMode="numeric"
                    placeholder="Inches"
                    value={editHeightInches}
                    onChange={(event) =>
                      setEditHeightInches(event.target.value)
                    }
                  />
                </label>
              </div>
            </ResponsiveDoubleWheelField>
          </fieldset>
          <DialogFooter>
            <ActionButton type="button" onClick={() => setProfileDialogOpen(false)}>
              Cancel
            </ActionButton>
            <ActionButton tone="primary" type="button" onClick={saveProfile}>
              Save changes
            </ActionButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {profile.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the profile and all of its local workout
              data from this browser.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white"
              onClick={deleteProfile}
            >
              Delete profile
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </main>
    </ProfileThemeProvider>
  );
}
