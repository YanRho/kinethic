import { TodayScreen } from "@/features/today/today-screen";

export default async function Page({
  params,
}: PageProps<"/today/[profileId]">) {
  const { profileId } = await params;

  return <TodayScreen profileId={profileId} />;
}
