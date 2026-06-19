"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Crown, Shield, Zap } from "lucide-react";
import { CinematicHero } from "@/components/home/CinematicHero";
import { BannerCarousel } from "@/components/home/BannerCarousel";
import { VersusMatch } from "@/components/home/VersusMatch";
import { FutPlayerCard } from "@/components/home/FutPlayerCard";
import { TiltCard } from "@/components/fx/TiltCard";
import { CountUp } from "@/components/fx/CountUp";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { FullScreenLoader } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/hooks/useAuth";
import { useHomeContent } from "@/hooks/useHomeContent";
import { useSponsors } from "@/hooks/useSponsors";
import { useMarqueeItems } from "@/hooks/useMarquee";
import { useHallOfFame } from "@/hooks/useHallOfFame";
import { useTeams, useTeam as useTeamById } from "@/hooks/useTeams";
import { usePlayers, usePlayer } from "@/hooks/usePlayers";
import { useNews } from "@/hooks/useNews";
import { useMatches } from "@/hooks/useMatches";
import { useTeamStandings, usePlayerStandings } from "@/hooks/useLeaderboard";
import type { HallOfFameEntry, WithId } from "@/types";

/* ----------------------------------------------------------------- helpers */

function SectionHeading({
  eyebrow,
  title,
  href,
}: {
  eyebrow?: string;
  title: string;
  href?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="mb-6 flex items-end justify-between gap-4"
    >
      <div>
        {eyebrow && (
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.25em] text-ink/45">
            {eyebrow}
          </p>
        )}
        <h2 className="text-3xl font-bold uppercase tracking-tight sm:text-4xl">{title}</h2>
      </div>
      {href && (
        <Link
          href={href}
          className="group inline-flex shrink-0 items-center gap-1 text-xs font-bold uppercase tracking-wider text-ink/50 transition-colors hover:text-ink"
        >
          View All
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </motion.div>
  );
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, filter: "blur(12px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

const HallOfFameCard = ({ entry }: { entry: WithId<HallOfFameEntry> }) => {
  const { data: champion } = useTeamById(entry.championTeamId);
  const { data: mvp } = usePlayer(entry.mvpPlayerId);
  return (
    <TiltCard className="w-64 shrink-0" max={9}>
      <Card className="overflow-hidden">
        <div className="border-b-4 border-ink bg-vyellow px-5 py-3">
          <p className="truncate text-sm font-bold uppercase tracking-wide">{entry.seasonName}</p>
        </div>
        <CardContent className="space-y-2 p-5 text-sm font-medium">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 shrink-0 text-ink/50" />
            <span className="truncate">{champion?.name ?? "—"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 shrink-0 text-vred" />
            <span className="truncate">{mvp?.ign ?? "—"}</span>
          </div>
          <p className="pt-1 text-2xl font-bold">
            {entry.highestKills ?? "—"}
            <span className="ml-1 text-[10px] font-bold uppercase tracking-widest text-ink/40">kills</span>
          </p>
        </CardContent>
      </Card>
    </TiltCard>
  );
};

function TeamTile({
  teamId,
  name,
  logoUrl,
  wins,
  points,
}: {
  teamId: string;
  name: string;
  logoUrl: string | null;
  wins: number;
  points: number;
}) {
  return (
    <Link href={ROUTES.team(teamId)} className="block shrink-0">
      <TiltCard className="w-56" max={11}>
        <Card className="overflow-hidden">
          <div className="bg-dots relative grid h-32 place-items-center border-b-4 border-ink bg-vpurple/40">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={name} className="h-20 w-20 rounded-2xl border-4 border-ink object-cover" />
            ) : (
              <Shield className="h-12 w-12 text-ink/30" />
            )}
          </div>
          <CardContent className="p-5">
            <p className="truncate text-lg font-bold uppercase">{name}</p>
            <div className="mt-3 flex gap-2 text-xs font-bold uppercase">
              <span className="rounded-lg border-2 border-ink bg-vgreen px-2 py-0.5">{wins} W</span>
              <span className="rounded-lg border-2 border-ink bg-vyellow px-2 py-0.5">{points} Pts</span>
            </div>
          </CardContent>
        </Card>
      </TiltCard>
    </Link>
  );
}

const HomeSkeleton = () => (
  <div className="bg-grid relative min-h-[calc(100dvh-4rem)] overflow-hidden px-6 py-16">
    <div className="mx-auto flex max-w-2xl flex-col gap-8 pt-10">
      <Skeleton className="h-8 w-56 rounded-full" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-6 w-80" />
    </div>
  </div>
);

/* -------------------------------------------------------------------- page */

export default function HomePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: home, loading } = useHomeContent();
  const { data: sponsors } = useSponsors();
  const { data: marqueeItems } = useMarqueeItems();
  const { data: hallOfFameEntries } = useHallOfFame();
  const { data: teams } = useTeams();
  const { data: players } = usePlayers();
  const { data: news } = useNews();
  const { data: matches } = useMatches();
  const { standings: teamStandings } = useTeamStandings();
  const { standings: playerStandings } = usePlayerStandings();

  if (authLoading) return <FullScreenLoader />;
  if (isAuthenticated) return <Dashboard />;
  if (loading) return <HomeSkeleton />;

  const upcomingMatchId =
    home?.featuredMatchId ??
    [...matches]
      .filter((m) => m.status === "upcoming" || m.status === "live")
      .sort((a, b) => (a.scheduledAt?.toMillis?.() ?? 0) - (b.scheduledAt?.toMillis?.() ?? 0))[0]?.id ??
    null;

  const topTeams =
    teamStandings.length > 0
      ? teamStandings.slice(0, 6).map((t) => ({ teamId: t.teamId, name: t.teamName, logoUrl: t.logoUrl, wins: t.wins, points: t.points }))
      : teams.slice(0, 6).map((t) => ({ teamId: t.id, name: t.name, logoUrl: t.logoUrl ?? null, wins: 0, points: 0 }));

  const featuredPlayerIds =
    home?.featuredPlayerIds && home.featuredPlayerIds.length > 0
      ? home.featuredPlayerIds
      : playerStandings.slice(0, 6).map((p) => p.playerId);

  const recentResults = [...matches]
    .filter((m) => m.status === "completed")
    .sort((a, b) => (b.scheduledAt?.toMillis?.() ?? 0) - (a.scheduledAt?.toMillis?.() ?? 0))
    .slice(0, 4);

  const overview = [
    { label: "Players", value: players.length, bg: "bg-vblue" },
    { label: "Franchises", value: teams.length, bg: "bg-vgreen" },
    { label: "Matches", value: matches.length, bg: "bg-vred" },
    { label: "Honours", value: hallOfFameEntries.length, bg: "bg-vyellow" },
  ];

  return (
    <div className="overflow-hidden">
      <CinematicHero />

      {/* BANNER CAROUSEL */}
      <section className="mx-auto max-w-6xl px-5 pt-6">
        <BannerCarousel />
      </section>

      {/* MARQUEE */}
      {marqueeItems.length > 0 && (
        <div className="mt-10 overflow-hidden border-y-4 border-ink bg-vyellow py-3">
          <div className="flex w-max animate-marquee whitespace-nowrap text-sm font-bold uppercase tracking-wide">
            {[...marqueeItems, ...marqueeItems].map((item, i) => (
              <span key={i} className="mx-6 inline-flex items-center gap-2.5">
                <Zap className="h-4 w-4" /> {item.text}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* SEASON OVERVIEW */}
      <section className="mx-auto max-w-6xl px-5 py-14">
        <SectionHeading eyebrow="At a glance" title="Season Overview" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {overview.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.05}>
              <div className={`rounded-3xl border-4 border-ink ${s.bg} p-5 shadow-brutal`}>
                <div className="text-4xl font-bold sm:text-5xl">
                  <CountUp value={s.value} />
                </div>
                <div className="mt-1 text-[11px] font-bold uppercase tracking-wide text-ink/70">{s.label}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* UPCOMING MATCH */}
      {upcomingMatchId && (
        <section className="mx-auto max-w-5xl px-5 py-10">
          <SectionHeading eyebrow="Next up" title="Upcoming Match" href={ROUTES.matches} />
          <Reveal>
            <VersusMatch matchId={upcomingMatchId} />
          </Reveal>
        </section>
      )}

      {/* TOP TEAMS */}
      {topTeams.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 py-10">
          <SectionHeading eyebrow="Franchises" title="Top Teams" href={ROUTES.teams} />
          <div className="flex gap-6 overflow-x-auto pb-4" style={{ scrollSnapType: "x mandatory" }}>
            {topTeams.map((t) => (
              <div key={t.teamId} style={{ scrollSnapAlign: "start" }}>
                <TeamTile {...t} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TOP PLAYERS */}
      {featuredPlayerIds.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 py-10">
          <SectionHeading eyebrow="Stars" title="Top Players" href={ROUTES.players} />
          <div className="flex gap-6 overflow-x-auto pb-4" style={{ scrollSnapType: "x mandatory" }}>
            {featuredPlayerIds.map((id) => (
              <div key={id} style={{ scrollSnapAlign: "start" }}>
                <FutPlayerCard playerId={id} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* LIVE LEADERBOARD */}
      {teamStandings.length > 0 && (
        <section className="mx-auto max-w-4xl px-5 py-10">
          <SectionHeading eyebrow="Standings" title="Live Leaderboard" href={ROUTES.leaderboard} />
          <Reveal>
            <div className="overflow-hidden rounded-3xl border-4 border-ink shadow-brutal-sm">
              <div className="grid grid-cols-[2.5rem_1fr_3rem_3.5rem] gap-2 border-b-4 border-ink bg-ink px-4 py-3 text-xs font-bold uppercase tracking-wide text-cream">
                <span>#</span><span>Team</span><span className="text-center">W</span><span className="text-right">Pts</span>
              </div>
              {teamStandings.slice(0, 6).map((t) => (
                <Link
                  key={t.teamId}
                  href={ROUTES.team(t.teamId)}
                  className="grid grid-cols-[2.5rem_1fr_3rem_3.5rem] items-center gap-2 border-b-2 border-ink/10 bg-cream px-4 py-3 transition-colors last:border-0 hover:bg-vyellow/40"
                >
                  <span className="text-lg font-bold">{t.rank}</span>
                  <span className="flex min-w-0 items-center gap-2 font-bold uppercase">
                    {t.logoUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.logoUrl} alt="" className="h-7 w-7 rounded-lg border-2 border-ink object-cover" />
                    )}
                    <span className="truncate">{t.teamName}</span>
                  </span>
                  <span className="text-center font-bold text-vgreen">{t.wins}</span>
                  <span className="text-right text-lg font-bold">{t.points}</span>
                </Link>
              ))}
            </div>
          </Reveal>
        </section>
      )}

      {/* RECENT RESULTS */}
      {recentResults.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 py-10">
          <SectionHeading eyebrow="Scores" title="Recent Results" href={ROUTES.matches} />
          <div className="grid gap-4 sm:grid-cols-2">
            {recentResults.map((m, i) => {
              const t1 = teams.find((t) => t.id === m.team1Id);
              const t2 = teams.find((t) => t.id === m.team2Id);
              return (
                <Reveal key={m.id} delay={i * 0.05}>
                  <Link href={ROUTES.match(m.id)} className="flex items-center justify-between rounded-2xl border-4 border-ink bg-cream px-5 py-4 shadow-brutal-sm transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="truncate font-bold uppercase">{t1?.name ?? "TBD"}</span>
                      <span className="text-xs font-bold text-ink/40">vs</span>
                      <span className="truncate font-bold uppercase">{t2?.name ?? "TBD"}</span>
                    </div>
                    <span className="ml-3 shrink-0 rounded-full border-2 border-ink bg-vgreen px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                      Final
                    </span>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </section>
      )}

      {/* HALL OF FAME */}
      {hallOfFameEntries.length > 0 && (
        <section className="bg-grid my-10 border-y-4 border-ink py-14">
          <div className="mx-auto max-w-6xl px-5">
            <SectionHeading eyebrow="Legacy" title="Hall of Fame" href={ROUTES.hallOfFame} />
            <div className="flex gap-6 overflow-x-auto pb-4" style={{ scrollSnapType: "x mandatory" }}>
              {hallOfFameEntries.map((entry) => (
                <div key={entry.id} style={{ scrollSnapAlign: "start" }}>
                  <HallOfFameCard entry={entry} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* NEWS */}
      {news.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 py-12">
          <SectionHeading eyebrow="Stories" title="Latest News" href={ROUTES.news} />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {news.slice(0, 6).map((a, i) => (
              <Reveal key={a.id} delay={i * 0.06}>
                <Link href={`/news/${a.slug}`} className="group block">
                  <Card className="overflow-hidden transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5">
                    {a.coverImage && (
                      <div className="aspect-[16/10] overflow-hidden border-b-4 border-ink">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={a.coverImage} alt={a.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      </div>
                    )}
                    <CardContent className="p-5">
                      <p className="text-lg font-bold leading-snug">{a.title}</p>
                      {a.excerpt && <p className="mt-2 line-clamp-2 text-sm font-medium text-ink/60">{a.excerpt}</p>}
                    </CardContent>
                  </Card>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* SPONSORS */}
      {sponsors.length > 0 && (
        <section className="mx-auto max-w-4xl px-5 py-16">
          <p className="mb-8 text-center text-[11px] font-bold uppercase tracking-[0.3em] text-ink/40">
            Our Partners
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            {sponsors.map((s) => (
              <a
                key={s.id}
                href={s.website}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl border-4 border-ink bg-cream p-3 shadow-brutal-xs transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.logoUrl} alt={s.name} className="h-10 w-auto object-contain" />
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
