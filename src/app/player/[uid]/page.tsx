import { PlayerProfileByUid } from "@/components/player/PlayerProfileByUid";

export const dynamic = "force-dynamic";
export const metadata = { title: "Player Profile" };

export default async function PublicPlayerPage({
  params,
}: {
  params: Promise<{ uid: string }>;
}) {
  const { uid } = await params;
  return <PlayerProfileByUid uid={uid} />;
}
