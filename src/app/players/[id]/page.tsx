import { PlayerProfile } from "@/components/player/PlayerProfile";

export const metadata = { title: "Player" };

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PlayerProfile playerId={id} />;
}
