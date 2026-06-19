"use client";

import React, { createContext, useContext } from "react";
import Image from "next/image";
import { Shield, Coins, Users } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { FullScreenLoader } from "@/components/ui/spinner";
import { useMyFranchise } from "@/hooks/useMyFranchise";
import { MAX_SQUAD_SIZE } from "@/constants/app";
import { FranchiseSidebar, FranchiseMobileNav } from "./FranchiseSidebar";
import type { Team, WithId } from "@/types";

function Stat({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-xl border-2 border-white/30 bg-white/10 px-3 py-1.5 text-sm font-bold text-white backdrop-blur-sm">
      {icon}
      {label}
    </div>
  );
}

const FranchiseTeamContext = createContext<WithId<Team> | null>(null);

/** Read the franchise team inside the /franchise area (always non-null there). */
export function useFranchiseTeam(): WithId<Team> {
  const team = useContext(FranchiseTeamContext);
  if (!team) throw new Error("useFranchiseTeam must be used within FranchiseShell.");
  return team;
}

/** Full Franchise HQ shell — hero banner + sidebar (desktop) / scroll-nav (mobile). */
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

  const brand = team.primaryColor ?? "#4f46e5";
  const brand2 = team.secondaryColor ?? "#f59e0b";

  return (
    <FranchiseTeamContext.Provider value={team}>
      <div
        className="min-h-dvh"
        style={{ "--hq-brand": brand, "--hq-brand2": brand2 } as React.CSSProperties}
      >
        {/* ── Hero banner ─────────────────────────────────────────── */}
        <div className="relative overflow-hidden border-b-4 border-ink" style={{ minHeight: 200, background: brand }}>
          {team.bannerUrl && (
            <Image src={team.bannerUrl} alt="" fill className="object-cover opacity-25 pointer-events-none" sizes="100vw" />
          )}
          <div className="relative mx-auto flex max-w-7xl items-end gap-5 px-4 pb-6 pt-8 lg:px-8">
            {/* Logo */}
            <div className="hidden sm:grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-2xl border-4 border-ink bg-cream shadow-brutal">
              {team.logoUrl ? (
                <Image src={team.logoUrl} alt={team.name} fill className="object-cover" sizes="96px" />
              ) : (
                <Shield className="h-10 w-10 text-ink/40" />
              )}
            </div>
            {/* Info */}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-0.5">Franchise HQ</p>
              <h1 className="truncate text-4xl font-bold text-white drop-shadow-md leading-tight">{team.name}</h1>
              {team.slogan && (
                <p className="mt-0.5 text-sm font-bold text-white/70 italic">&ldquo;{team.slogan}&rdquo;</p>
              )}
              <div className="mt-3 flex flex-wrap gap-3">
                <Stat icon={<Coins className="h-3.5 w-3.5" />} label={`${(team.remainingPurse ?? 0).toLocaleString()} coins`} />
                <Stat icon={<Users className="h-3.5 w-3.5" />} label={`${team.squad?.length ?? 0}/${MAX_SQUAD_SIZE} players`} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Body: sidebar + content ──────────────────────────────── */}
        <div className="flex min-h-[calc(100dvh-200px)]">
          {/* Desktop sidebar */}
          <aside className="hidden lg:flex lg:w-56 shrink-0 flex-col border-r-4 border-ink bg-ink">
            <FranchiseSidebar />
          </aside>

          {/* Content */}
          <div className="min-w-0 flex-1">
            {/* Mobile nav */}
            <div className="lg:hidden border-b-4 border-ink bg-cream px-4 py-3">
              <FranchiseMobileNav />
            </div>

            <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 lg:px-8">
              {children}
            </main>
          </div>
        </div>
      </div>
    </FranchiseTeamContext.Provider>
  );
}
