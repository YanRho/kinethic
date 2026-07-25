import { WorkoutSessionScreen } from "@/features/workout-sessions/workout-session-screen";

export default async function Page({
  params,
}: PageProps<"/profiles/[profileId]/workout-sessions/[sessionId]">) {
  const { profileId, sessionId } = await params;

  return <WorkoutSessionScreen profileId={profileId} sessionId={sessionId} />;
}
