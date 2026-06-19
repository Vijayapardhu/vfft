import { MatchDetail } from "@/components/match/MatchDetail";

export const metadata = { title: "Match" };

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MatchDetail matchId={id} />;
}
