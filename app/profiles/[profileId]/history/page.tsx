import { WorkoutHistoryScreen } from "@/features/history/workout-history-screen";

export default async function Page({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await params;

  return <WorkoutHistoryScreen profileId={profileId} />;
}
