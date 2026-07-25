import { WorkoutEditor } from "@/features/workouts/workout-editor";
export default async function Page({
  params,
}: PageProps<"/profiles/[profileId]/workouts/[workoutId]/edit">) {
  const { profileId, workoutId } = await params;
  return <WorkoutEditor profileId={profileId} workoutId={workoutId} />;
}
