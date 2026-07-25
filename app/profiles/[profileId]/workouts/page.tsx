import { WorkoutListScreen } from "@/features/workouts/workout-list-screen";

export default async function Page({
  params,
}: PageProps<"/profiles/[profileId]/workouts">) {
  const { profileId } = await params;

  return <WorkoutListScreen profileId={profileId} />;
}
