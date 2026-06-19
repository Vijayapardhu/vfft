import { TeamProfile } from "@/components/team/TeamProfile";

export const metadata = { title: "Team" };

export default async function TeamProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TeamProfile teamId={id} />;
}
