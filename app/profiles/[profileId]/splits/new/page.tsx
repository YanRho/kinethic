import { SplitEditor } from "@/features/splits/split-editor";
export default async function Page({
  params,
}: PageProps<"/profiles/[profileId]/splits/new">) {
  const { profileId } = await params;
  return <SplitEditor profileId={profileId} />;
}
