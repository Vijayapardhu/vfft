"use client";

import { Award, Crown, Crosshair, Megaphone, Shield, Skull, Star, Swords, Trophy, ArrowRight, Zap } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { MatchCard } from "@/components/cards/MatchCard";
import { BannerCarousel } from "@/components/home/BannerCarousel";
import { EnableNotifications } from "@/components/notifications/EnableNotifications";
import { StatCard } from "@/components/cards/StatCard";
import { TeamBanner } from "@/components/team/TeamBanner";
import { Badge } from "@/components/ui/badge";
import { buttonVariants, Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FullScreenLoader } from "@/components/ui/spinner";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/hooks/useAuth";
import { useMyPlayer, usePlayer, usePlayerSeasonStats } from "@/hooks/usePlayers";
import { useTeam, useTeams, useTeamSeasonStats } from "@/hooks/useTeams";
import { useHallOfFame } from "@/hooks/useHallOfFame";
import { useAchievements } from "@/hooks/useAchievements";
import { useMatches } from "@/hooks/useMatches";
import { useNews } from "@/hooks/useNews";
import { cn } from "@/lib/utils";
import type { HallOfFameEntry, Achievement, WithId } from "@/types";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 text-2xl">{title}</h2>
      {children}
    </section>
  );
}

function Placeholder({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border-4 border-dashed border-ink/30 p-6 text-center font-medium text-ink/50">
      {children}
    </div>
  );
}

export function Dashboard() {
  const { user, firebaseUser } = useAuth();
  const { player, loading: playerLoading } = useMyPlayer();
  const { data: team } = useTeam(player?.teamId ?? null);
  const { data: playerStats } = usePlayerSeasonStats(player?.id ?? null);
  const { data: teamStats } = useTeamSeasonStats(player?.teamId ?? null);

  const { data: hallOfFameEntries } = useHallOfFame();
  const { data: achievements } = useAchievements();
  const { data: matches } = useMatches();
  const { data: teams } = useTeams();
  const { data: news } = useNews();

  const teamById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);
  const nextMatch = useMemo(() => {
    const tid = player?.teamId;
    if (!tid) return null;
    return (
      matches
        .filter((m) => (m.team1Id === tid || m.team2Id === tid) && m.status !== "completed")
        .sort((a, b) => (a.scheduledAt?.toMillis?.() ?? 0) - (b.scheduledAt?.toMillis?.() ?? 0))[0] ?? null
    );
  }, [matches, player?.teamId]);

  const fullName = user?.displayName ?? firebaseUser?.displayName ?? "Legend";
  const firstName = fullName.split(" ")[0] ?? "Legend";

  if (playerLoading) return <FullScreenLoader />;

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold uppercase tracking-wide text-ink/50">Welcome back</p>
          <h1 className="text-4xl">{firstName} 🔥</h1>
        </div>
        <EnableNotifications />
      </div>

      {/* Admin-managed banner carousel */}
      <BannerCarousel />

      {/* Not registered yet */}
      {!player && (
        <div className="rounded-3xl border-4 border-ink bg-vyellow p-6 shadow-brutal-md">
          <h2 className="text-2xl">Join the league</h2>
          <p className="mt-1 font-medium text-ink/70">
            Register as a player to enter the auction pool and get drafted by a
            franchise.
          </p>
          <Link
            href={ROUTES.register}
            className={cn(buttonVariants({ variant: "ink", size: "lg" }), "mt-4")}
          >
            Register Now
          </Link>
        </div>
      )}

      {/* Registered but awaiting approval */}
      {player && player.status !== "approved" && (
        <div className="rounded-3xl border-4 border-ink bg-cream p-5 shadow-brutal">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold">Registration status:</span>
            <Badge variant="yellow">{player.status}</Badge>
          </div>
          <p className="mt-1 text-sm font-medium text-ink/60">
            An admin will review your profile <strong>{player.ign}</strong>{" "}
            shortly.
          </p>
        </div>
      )}

      {/* Team banner */}
      {player && (
        <Section title="Your Team">
          {team ? (
            <TeamBanner team={team} />
          ) : (
            <Placeholder>
              You haven&apos;t been signed to a franchise yet — you&apos;ll be
              picked in the auction.
            </Placeholder>
          )}
        </Section>
      )}

      {/* Personal stats */}
      {player && (
        <Section title="Your Stats">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Matches" value={playerStats?.matchesPlayed ?? 0} icon={Swords} variant="blue" />
            <StatCard label="Kills" value={playerStats?.kills ?? 0} icon={Skull} variant="red" />
            <StatCard label="Headshots" value={playerStats?.headshots ?? 0} icon={Crosshair} variant="green" />
            <StatCard label="MVP" value={playerStats?.mvpAwards ?? 0} icon={Star} variant="yellow" />
          </div>
        </Section>
      )}

      <div className="grid gap-8 md:grid-cols-2">
        <Section title="Next Match">
          {nextMatch ? (
            <MatchCard
              match={nextMatch}
              team1={teamById.get(nextMatch.team1Id)}
              team2={teamById.get(nextMatch.team2Id)}
            />
          ) : (
            <Placeholder>No upcoming matches scheduled yet.</Placeholder>
          )}
        </Section>
        <Section title="Team Position">
          {team && teamStats ? (
            <div className="grid grid-cols-2 gap-4">
              <StatCard label="Points" value={teamStats.points} icon={Trophy} variant="yellow" />
              <StatCard label="Wins" value={teamStats.wins} icon={Shield} variant="green" />
            </div>
          ) : (
            <Placeholder>Standings appear once results are in (Phase 3).</Placeholder>
          )}
        </Section>
      </div>

      <Section title="Announcements">
        {news.length > 0 ? (
          <div className="space-y-2">
            {news.slice(0, 3).map((a) => (
              <Link
                key={a.id}
                href={`/news/${a.slug}`}
                className="block rounded-2xl border-4 border-ink bg-cream p-3 shadow-brutal-sm transition-transform hover:-translate-y-0.5 hover:bg-vyellow motion-reduce:transition-none"
              >
                <div className="font-bold">{a.title}</div>
                {a.excerpt && (
                  <div className="truncate text-sm font-medium text-ink/60">{a.excerpt}</div>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <Placeholder>
            <span className="inline-flex items-center gap-2">
              <Megaphone className="h-5 w-5" /> No announcements yet.
            </span>
          </Placeholder>
        )}
      </Section>

      {hallOfFameEntries.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl">
              <Crown className="mr-2 inline h-6 w-6 text-vyellow" />
              Hall of Fame
            </h2>
            <Link href={ROUTES.hallOfFame} className="flex items-center gap-1 text-sm font-bold uppercase text-ink/50 hover:text-ink">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-ink/20" style={{ scrollSnapType: "x mandatory" }}>
            {hallOfFameEntries.map((entry) => (
              <Link key={entry.id} href={ROUTES.hallOfFame} className="group shrink-0" style={{ scrollSnapAlign: "start" }}>
                <HoFMiniCard entry={entry} />
              </Link>
            ))}
          </div>
        </section>
      )}

      {achievements.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl">
              <Award className="mr-2 inline h-6 w-6 text-vyellow" />
              Achievements
            </h2>
            <Link href={ROUTES.achievements} className="flex items-center gap-1 text-sm font-bold uppercase text-ink/50 hover:text-ink">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-ink/20" style={{ scrollSnapType: "x mandatory" }}>
            {achievements.map((a) => (
              <Link key={a.id} href={ROUTES.achievements} className="group shrink-0" style={{ scrollSnapAlign: "start" }}>
                <AchievementMiniCard achievement={a} />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function HoFMiniCard({ entry }: { entry: WithId<HallOfFameEntry> }) {
  const { data: champion } = useTeam(entry.championTeamId);
  const { data: mvp } = usePlayer(entry.mvpPlayerId);
  return (
    <Card className="w-64 transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5">
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 shrink-0 text-vyellow" />
          <p className="truncate text-sm font-bold uppercase">{entry.seasonName}</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Shield className="h-3.5 w-3.5 shrink-0 text-ink/50" />
          <span className="truncate font-medium">{champion?.name ?? "—"}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Zap className="h-3.5 w-3.5 shrink-0 text-vred" />
          <span className="truncate font-medium">{mvp?.ign ?? "—"}</span>
        </div>
        <p className="text-xs font-bold text-ink/40 uppercase tracking-wide">
          {entry.highestKills ? `${entry.highestKills} Kills` : "—"}
        </p>
      </CardContent>
    </Card>
  );
}

function AchievementMiniCard({ achievement }: { achievement: WithId<Achievement> }) {
  const { data: player } = usePlayer(achievement.playerId);
  const label = achievement.type.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
  return (
    <Card className="w-48 transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5">
      <CardContent className="flex flex-col items-center gap-3 p-4">
        <div className="aspect-square w-full overflow-hidden rounded-2xl border-4 border-ink bg-vpurple/40">
          <img
            src={player?.photoURL ?? "/placeholder-player.svg"}
            alt={player?.ign ?? "Player"}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex w-full flex-col items-center gap-1 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-vyellow">{label}</p>
          <p className="truncate text-sm font-bold">{player?.ign ?? "Unknown"}</p>
        </div>
      </CardContent>
    </Card>
  );
}
