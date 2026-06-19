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
  dark = false,
}: {
  eyebrow?: string;
  title: string;
  href?: string;
  dark?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="mb-8 flex items-end justify-between gap-4"
    >
      <div>
        {eyebrow && (
          <p className={`mb-2 text-[11px] font-semibold uppercase tracking-[0.3em] ${dark ? "text-cream/40" : "text-ink/40"}`}>
            {eyebrow}
          </p>
        )}
        <h2 className={`text-3xl font-light uppercase tracking-tight sm:text-4xl ${dark ? "text-cream" : "text-ink"}`}>
          {title}
        </h2>
      </div>
      {href && (
        <Link
          href={href}
          className={`group inline-flex shrink-0 items-center gap-1 text-xs font-semibold uppercase tracking-wider transition-colors ${dark ? "text-cream/50 hover:text-cream" : "text-ink/45 hover:text-ink"}`}
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
      initial={{ opacity: 0, y: 60, filter: "blur(16px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

const HallOfFameCard = ({ entry }: { entry: WithId<HallOfFameEntry> }) => {
  const { data: champion } = useTeamById(entry.championTeamId);
  const { data: mvp } = usePlayer(entry.mvpPlayerId);
  return (
    <TiltCard className="w-72 shrink-0" max={9}>
      <div className="glass-dark relative overflow-hidden rounded-[1.5rem] p-6">
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gold/20 blur-2xl" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gold">{entry.seasonName}</p>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 shrink-0 text-cream/40" />
            <span className="truncate font-light">{champion?.name ?? "—"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 shrink-0 text-gold" />
            <span className="truncate font-light">{mvp?.ign ?? "—"}</span>
          </div>
        </div>
        <p className="mt-5 text-3xl font-extralight text-cream">
          {entry.highestKills ?? "—"}
          <span className="ml-1 text-xs uppercase tracking-widest text-cream/40">kills</span>
        </p>
      </div>
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
        <div className="card-premium overflow-hidden rounded-[1.5rem]">
          <div className="relative grid h-32 place-items-center overflow-hidden bg-spotlight">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={name} className="h-20 w-20 rounded-2xl object-cover shadow-soft" />
            ) : (
              <Shield className="h-12 w-12 text-ink/20" />
            )}
          </div>
          <div className="p-5">
            <p className="truncate text-lg font-medium uppercase tracking-tight">{name}</p>
            <div className="mt-3 flex gap-4 text-sm">
              <span className="text-ink/50">
                <span className="font-semibold text-ink">{wins}</span> W
              </span>
              <span className="text-ink/50">
                <span className="font-semibold text-ink">{points}</span> Pts
              </span>
            </div>
          </div>
        </div>
      </TiltCard>
    </Link>
  );
}

const HomeSkeleton = () => (
  <div className="bg-grid-fine relative min-h-[calc(100dvh-4rem)] overflow-hidden px-6 py-16">
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
    { label: "Players", value: players.length },
    { label: "Franchises", value: teams.length },
    { label: "Matches", value: matches.length },
    { label: "Honours", value: hallOfFameEntries.length },
  ];

  return (
    <div className="overflow-hidden">
      <CinematicHero />

      {/* BANNER CAROUSEL */}
      <section className="mx-auto max-w-6xl px-6 pt-6">
        <BannerCarousel />
      </section>

      {/* MARQUEE — slim */}
      {marqueeItems.length > 0 && (
        <div className="mt-10 overflow-hidden border-y border-ink/10 py-3">
          <div className="flex w-max animate-marquee whitespace-nowrap text-xs font-semibold uppercase tracking-[0.2em] text-ink/55">
            {[...marqueeItems, ...marqueeItems].map((item, i) => (
              <span key={i} className="mx-7 inline-flex items-center gap-2.5">
                <Zap className="h-3.5 w-3.5 text-gold" /> {item.text}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* SEASON OVERVIEW */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <Reveal>
          <div className="glass grid grid-cols-2 overflow-hidden rounded-[1.75rem] sm:grid-cols-4">
            {overview.map((s, i) => (
              <div key={s.label} className={`px-6 py-8 ${i > 0 ? "border-l border-ink/8" : ""}`}>
                <div className="text-4xl font-extralight tracking-tight sm:text-5xl">
                  <CountUp value={s.value} />
                </div>
                <div className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/45">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* UPCOMING MATCH */}
      {upcomingMatchId && (
        <section className="mx-auto max-w-5xl px-6 py-10">
          <SectionHeading eyebrow="Next up" title="Upcoming Match" href={ROUTES.matches} />
          <Reveal>
            <VersusMatch matchId={upcomingMatchId} />
          </Reveal>
        </section>
      )}

      {/* TOP TEAMS */}
      {topTeams.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-10">
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

      {/* TOP PLAYERS — FUT cards */}
      {featuredPlayerIds.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-10">
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
        <section className="mx-auto max-w-4xl px-6 py-10">
          <SectionHeading eyebrow="Standings" title="Live Leaderboard" href={ROUTES.leaderboard} />
          <Reveal>
            <div className="card-premium overflow-hidden rounded-[1.5rem]">
              {teamStandings.slice(0, 6).map((t, i) => (
                <Link
                  key={t.teamId}
                  href={ROUTES.team(t.teamId)}
                  className="flex items-center gap-4 border-b border-ink/8 px-5 py-4 transition-colors last:border-0 hover:bg-ink/[0.03]"
                >
                  <span className={`w-6 text-center text-lg font-light ${i === 0 ? "text-gold" : "text-ink/40"}`}>
                    {t.rank}
                  </span>
                  {t.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.logoUrl} alt="" className="h-9 w-9 rounded-xl object-cover" />
                  ) : (
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink/5">
                      <Shield className="h-4 w-4 text-ink/30" />
                    </span>
                  )}
                  <span className="flex-1 truncate font-medium uppercase tracking-tight">{t.teamName}</span>
                  <span className="hidden text-sm text-ink/50 sm:block">{t.wins} W</span>
                  <span className="w-14 text-right text-lg font-light">{t.points}</span>
                </Link>
              ))}
            </div>
          </Reveal>
        </section>
      )}

      {/* RECENT RESULTS */}
      {recentResults.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-10">
          <SectionHeading eyebrow="Scores" title="Recent Results" href={ROUTES.matches} />
          <div className="grid gap-4 sm:grid-cols-2">
            {recentResults.map((m, i) => {
              const t1 = teams.find((t) => t.id === m.team1Id);
              const t2 = teams.find((t) => t.id === m.team2Id);
              return (
                <Reveal key={m.id} delay={i * 0.05}>
                  <Link href={ROUTES.match(m.id)} className="card-premium flex items-center justify-between rounded-2xl px-5 py-4 transition-transform hover:-translate-y-0.5">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="truncate font-medium uppercase tracking-tight">{t1?.name ?? "TBD"}</span>
                      <span className="text-xs font-light text-ink/40">vs</span>
                      <span className="truncate font-medium uppercase tracking-tight">{t2?.name ?? "TBD"}</span>
                    </div>
                    <span className="ml-3 shrink-0 rounded-full border border-ink/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink/50">
                      Final
                    </span>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </section>
      )}

      {/* HALL OF FAME — cinematic dark */}
      {hallOfFameEntries.length > 0 && (
        <section className="relative my-10 overflow-hidden bg-ink py-20">
          <div className="bg-spotlight absolute inset-0 opacity-70" />
          <div className="bg-grid-fine absolute inset-0 opacity-[0.06]" />
          <div className="relative mx-auto max-w-6xl px-6">
            <SectionHeading eyebrow="Legacy" title="Hall of Fame" href={ROUTES.hallOfFame} dark />
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

      {/* NEWS — magazine */}
      {news.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-12">
          <SectionHeading eyebrow="Stories" title="Latest News" href={ROUTES.news} />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {news.slice(0, 6).map((a, i) => (
              <Reveal key={a.id} delay={i * 0.06}>
                <Link href={`/news/${a.slug}`} className="group block">
                  <div className="card-premium overflow-hidden rounded-[1.5rem] transition-transform duration-500 hover:-translate-y-1">
                    {a.coverImage && (
                      <div className="aspect-[16/10] overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={a.coverImage} alt={a.title} className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-105" />
                      </div>
                    )}
                    <div className="p-5">
                      <p className="text-lg font-medium leading-snug">{a.title}</p>
                      {a.excerpt && <p className="mt-2 line-clamp-2 text-sm font-light text-ink/55">{a.excerpt}</p>}
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* SPONSORS */}
      {sponsors.length > 0 && (
        <section className="mx-auto max-w-4xl px-6 py-16">
          <p className="mb-8 text-center text-[11px] font-semibold uppercase tracking-[0.3em] text-ink/35">
            Our Partners
          </p>
          <div className="flex flex-wrap items-center justify-center gap-10">
            {sponsors.map((s) => (
              <a key={s.id} href={s.website} target="_blank" rel="noopener noreferrer" className="opacity-50 grayscale transition hover:opacity-100 hover:grayscale-0">
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
