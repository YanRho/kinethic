"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut, Settings, Trash2 } from "lucide-react";
import {
  Brand,
  EmptyState,
  ProfileBadge,
  getProfileThemeStyle,
} from "@/app/_components/ui";
import {
  TrackingType,
  Gender,
  WorkoutExercise,
  dayLabel,
  localDay,
  weekdays,
} from "@/lib/kinethic/domain";
import { useKinEthicData } from "@/lib/kinethic/hooks";
import { repository } from "@/lib/kinethic/repository";
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

const repText = (
  reps:
    | { kind: "exact"; reps: number }
    | { kind: "range"; min: number; max: number },
) =>
  reps.kind === "exact" ? `${reps.reps} reps` : `${reps.min}–${reps.max} reps`;

const bmiGradient = (bmi: number) => {
  if (bmi < 18.5) return "from-sky-500 via-cyan-500 to-blue-600";
  if (bmi < 25) return "from-emerald-400 via-green-500 to-teal-600";
  if (bmi < 30) return "from-amber-400 via-orange-500 to-amber-600";
  if (bmi < 35) return "from-orange-500 via-rose-500 to-red-600";
  if (bmi < 40) return "from-rose-500 via-red-600 to-red-800";
  return "from-fuchsia-600 via-purple-700 to-red-800";
};

function workoutExerciseText(
  item: WorkoutExercise,
  trackingType: TrackingType,
) {
  if (trackingType === "duration") {
    return `${item.sets} sets · ${item.durationSeconds ?? 0}s · ${item.restSeconds}s rest`;
  }

  return `${item.sets} sets · ${repText(item.reps)} · ${item.restSeconds}s rest${trackingType === "weight_reps" && item.weight !== undefined ? ` · ${item.weight} ${item.weightUnit ?? "lb"}` : ""}`;
}
export function TodayScreen({ profileId }: { profileId: string }) {
  const data = useKinEthicData();
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAge, setEditAge] = useState("");
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
                <Link href="/">Back to profiles</Link>
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
  const deleteProfile = () => {
    repository.deleteProfile(profile.id);
    router.replace("/");
  };
  const openProfileEditor = () => {
    setEditName(profile.name);
    setEditAge(profile.age?.toString() ?? "");
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
    const age = Number(editAge);
    const weightLb = Number(editWeightLb);
    const heightFeet = Number(editHeightFeet);
    const heightInches = Number(editHeightInches);
    const heightIn = heightFeet * 12 + heightInches;
    if (
      !editName.trim() ||
      !Number.isInteger(age) ||
      age < 13 ||
      age > 120 ||
      !Number.isFinite(weightLb) ||
      weightLb <= 0 ||
      weightLb > 1500 ||
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
      age,
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
  const healthyWeightRange = profile.heightIn
    ? getHealthyWeightRange(profile.heightIn)
    : null;
  const startWorkout = () => {
    if (!workout || workout.exercises.length === 0) {
      return;
    }

    const session = repository.startWorkoutSession(profileId, workout.id);

    if (session) {
      router.push(`/profiles/${profileId}/workout-sessions/${session.id}`);
    }
  };
  return (
    <main
      className="profile-theme safe-page min-h-dvh overflow-x-hidden bg-[#080b12] px-3 text-white sm:px-4"
      style={getProfileThemeStyle(profile.accent)}
    >
      <div className="mx-auto max-w-md">
        <header className="flex items-center justify-between">
          <Link href="/">
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
                <Link href="/" replace>
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
                {bmi && profile.age !== undefined ? (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className={`rounded-full bg-linear-to-r px-2.5 py-1 text-xs font-bold text-white shadow-sm ${profile.age >= 20 ? bmiGradient(bmi) : "from-indigo-500 via-violet-500 to-purple-600"}`}
                        aria-label={`BMI ${bmi.toFixed(1)}${profile.age >= 20 ? `, ${getBmiCategory(bmi)}` : ""}`}
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
                        {profile.age >= 20
                          ? getBmiCategory(bmi)
                          : "Age-specific guidance"}
                      </p>
                      {profile.age >= 20 && healthyWeightRange ? (
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
          <Surface className="mt-4 overflow-hidden p-6 shadow-2xl shadow-black/30">
            {experience.kind === "workout" && workout ? (
              <>
                <p className="eyebrow">Scheduled today · {split?.name}</p>
                <h2 className="mt-4 break-words text-2xl font-semibold sm:text-3xl">
                  {workout.name}
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  {workout.exercises.length}{" "}
                  {workout.exercises.length === 1 ? "exercise" : "exercises"}
                </p>
                <div className="mt-6 space-y-3">
                  {workout.exercises.map((item, index) => {
                    const exercise = data.exercises[item.exerciseId];
                    const trackingType =
                      item.trackingType ??
                      exercise?.trackingType ??
                      "weight_reps";
                    return (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-white/10 bg-black/20 p-4"
                      >
                        <div className="flex gap-3">
                          <span className="text-sm text-slate-500">
                            {index + 1}
                          </span>
                          <div>
                            <h3 className="font-semibold">
                              {exercise?.name ?? "Unavailable exercise"}
                            </h3>
                            <p className="mt-1 text-sm text-slate-400">
                              {workoutExerciseText(item, trackingType)}
                            </p>
                            {item.notes && (
                              <p className="mt-2 text-sm leading-6 text-slate-500">
                                {item.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <ActionButton
                    tone="primary"
                    disabled={workout.exercises.length === 0}
                    onClick={startWorkout}
                  >
                    Start Workout
                  </ActionButton>
                  <ActionButton asChild>
                    <Link
                      href={`/profiles/${profileId}/workouts/${workout.id}/edit`}
                    >
                      Edit template
                    </Link>
                  </ActionButton>
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
              <span>Age</span>
              <AppInput
                type="number"
                min="13"
                max="120"
                inputMode="numeric"
                value={editAge}
                onChange={(event) => setEditAge(event.target.value)}
              />
            </label>
            <label className="field">
              <span>Gender</span>
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
            </label>
          </div>
          <label className="field">
            <span>Weight (lb)</span>
            <AppInput
              type="number"
              min="1"
              max="1500"
              step="0.1"
              inputMode="decimal"
              value={editWeightLb}
              onChange={(event) => setEditWeightLb(event.target.value)}
            />
          </label>
          <fieldset>
            <legend className="text-sm font-medium text-slate-300">
              Height
            </legend>
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
                  onChange={(event) => setEditHeightInches(event.target.value)}
                />
              </label>
            </div>
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
  );
}
