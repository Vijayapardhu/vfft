"use client";

import { Shield } from "lucide-react";
import { createContext, useContext } from "react";
import { TeamBanner } from "@/components/team/TeamBanner";
import { EmptyState } from "@/components/ui/empty-state";
import { FullScreenLoader } from "@/components/ui/spinner";
import { useMyFranchise } from "@/hooks/useMyFranchise";
import type { Team, WithId } from "@/types";
import { FranchiseNav } from "./FranchiseNav";

const FranchiseTeamContext = createContext<WithId<Team> | null>(null);

/** Read the franchise team inside the /franchise area (always non-null there). */
export function useFranchiseTeam(): WithId<Team> {
  const team = useContext(FranchiseTeamContext);
  if (!team) throw new Error("useFranchiseTeam must be used within FranchiseShell.");
  return team;
}

/** Guards + chrome (banner + sub-nav) for the read-only franchise owner area. */
export function FranchiseShell({ children }: { children: React.ReactNode }) {
  const { team, loading, canView } = useMyFranchise();

  if (loading) return <FullScreenLoader />;
  if (!canView) {
    return (
      <EmptyState
        icon={Shield}
        title="Franchise area"
        message="This dashboard is for franchise owners and team leaders managing a team."
      />
    );
  }
  if (!team) {
    return (
      <EmptyState
        icon={Shield}
        title="No team linked yet"
        message="An admin hasn't assigned you to a franchise. Once they do, your team appears here."
      />
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <TeamBanner team={team} />
      <FranchiseNav />
      <FranchiseTeamContext.Provider value={team}>
        {children}
      </FranchiseTeamContext.Provider>
    </div>
  );
}
