"use client";

import { Shield } from "lucide-react";
import { TeamProfile } from "./TeamProfile";
import { EmptyState } from "@/components/ui/empty-state";
import { FullScreenLoader } from "@/components/ui/spinner";
import { useTeamBySlug } from "@/hooks/useTeams";

export function TeamProfileBySlug({ slug }: { slug: string }) {
  const { data: teams, loading } = useTeamBySlug(slug);

  if (loading) return <FullScreenLoader />;

  const team = teams[0];
  if (!team) {
    return (
      <EmptyState
        icon={Shield}
        title="Team not found"
        message="No franchise found at this URL."
      />
    );
  }

  return <TeamProfile teamId={team.id} />;
}
