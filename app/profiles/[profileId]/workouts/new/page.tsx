import { WorkoutEditor } from "@/features/workouts/workout-editor";
export default async function Page({
  params,
}: PageProps<"/profiles/[profileId]/workouts/new">) {
  const { profileId } = await params;
  return <WorkoutEditor profileId={profileId} />;
}
