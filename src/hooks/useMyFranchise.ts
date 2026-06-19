"use client";

import { useAuth } from "./useAuth";
import { useTeam } from "./useTeams";

/**
 * The franchise (team) linked to the current account. Owners + team leaders
 * (and admins) can view it; everyone else is denied.
 */
export function useMyFranchise() {
  const { user, role, isLoading } = useAuth();
  const teamId = user?.teamId ?? null;
  const canView =
    role === "franchiseOwner" || role === "teamLeader" || role === "admin";
  const { data: team, loading: teamLoading } = useTeam(canView ? teamId : null);

  return {
    teamId,
    team,
    role,
    canView,
    loading: isLoading || (canView && !!teamId && teamLoading),
  };
}
