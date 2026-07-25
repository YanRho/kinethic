import { SplitEditor } from "@/features/splits/split-editor";
export default async function Page({
  params,
}: PageProps<"/profiles/[profileId]/splits/[splitId]/edit">) {
  const { profileId, splitId } = await params;
  return <SplitEditor profileId={profileId} splitId={splitId} />;
}
