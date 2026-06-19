"use client";

import { Shield } from "lucide-react";
import { createContext, useContext } from "react";
import { TeamBanner } from "@/components/team/TeamBanner";
import { EmptyState } from "@/components/ui/empty-state";
import { FullScreenLoader } from "@/components/ui/spinner";
import { useMyFranchise } from "@/hooks/useMyFranchise";
import type { Team, WithId } from "@/types";
import { TeamLeaderNav } from "./TeamLeaderNav";

const TeamLeaderContext = createContext<WithId<Team> | null>(null);

export function useTeamLeaderTeam(): WithId<Team> {
  const team = useContext(TeamLeaderContext);
  if (!team) throw new Error("useTeamLeaderTeam must be used within TeamLeaderShell.");
  return team;
}

export function TeamLeaderShell({ children }: { children: React.ReactNode }) {
  const { team, loading, canView } = useMyFranchise();

  if (loading) return <FullScreenLoader />;
  if (!canView) {
    return (
      <EmptyState
        icon={Shield}
        title="Team area"
        message="This area is for franchise owners and team leaders."
      />
    );
  }
  if (!team) {
    return (
      <EmptyState
        icon={Shield}
        title="No team linked"
        message="An admin hasn't assigned you to a franchise yet."
      />
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <TeamBanner team={team} />
      <TeamLeaderNav />
      <TeamLeaderContext.Provider value={team}>
        {children}
      </TeamLeaderContext.Provider>
    </div>
  );
}
