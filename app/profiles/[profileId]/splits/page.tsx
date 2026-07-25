import { SplitListScreen } from "@/features/splits/split-list-screen";

export default async function Page({
  params,
}: PageProps<"/profiles/[profileId]/splits">) {
  const { profileId } = await params;

  return <SplitListScreen profileId={profileId} />;
}
