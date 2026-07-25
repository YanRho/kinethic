import { Id, KinEthicData, localDay } from "@/lib/kinethic/domain";

export type TodayExperience =
  | { kind: "missing-profile" }
  | { kind: "no-active-split"; profileId: Id }
  | { kind: "invalid-split"; profileId: Id }
  | { kind: "rest"; profileId: Id; splitId: Id }
  | { kind: "missing-workout"; profileId: Id; splitId: Id }
  | { kind: "workout"; profileId: Id; splitId: Id; workoutId: Id };

export function resolveToday(
  data: KinEthicData,
  profileId: Id,
  date = new Date(),
): TodayExperience {
  const profile = data.profiles[profileId];
  if (!profile) {
    return { kind: "missing-profile" };
  }

  if (!profile.activeSplitId) {
    return { kind: "no-active-split", profileId };
  }
  const split = data.splits[profile.activeSplitId];
  if (!split || split.profileId !== profileId) {
    return { kind: "invalid-split", profileId };
  }

  const workoutId = split.schedule[localDay(date)];
  if (!workoutId) {
    return { kind: "rest", profileId, splitId: split.id };
  }
  const workout = data.workouts[workoutId];
  if (!workout || workout.profileId !== profileId) {
    return { kind: "missing-workout", profileId, splitId: split.id };
  }

  return { kind: "workout", profileId, splitId: split.id, workoutId };
}
