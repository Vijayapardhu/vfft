"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useMemo } from "react";
import { CountUp } from "@/components/fx/CountUp";
import { MagneticButton } from "@/components/fx/MagneticButton";
import { FutPlayerCard } from "@/components/home/FutPlayerCard";
import { useActiveSeason } from "@/hooks/useActiveSeason";
import { useHomeContent } from "@/hooks/useHomeContent";
import { usePlayers } from "@/hooks/usePlayers";
import { useTeams } from "@/hooks/useTeams";
import { useMatches } from "@/hooks/useMatches";
import { usePlayerStandings } from "@/hooks/useLeaderboard";
import { useSettings } from "@/hooks/useSettings";

const lineVariants = {
  hidden: { opacity: 0, y: 40, filter: "blur(12px)" },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.8, delay: 0.15 + i * 0.1, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

export function CinematicHero() {
  const { data: home } = useHomeContent();
  const { data: settings } = useSettings();
  const { data: players } = usePlayers();
  const { data: teams } = useTeams();
  const { data: matches } = useMatches();
  const { season } = useActiveSeason();
  const { standings } = usePlayerStandings();

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 50, damping: 20 });
  const sy = useSpring(my, { stiffness: 50, damping: 20 });
  const cardX = useTransform(sx, [-0.5, 0.5], [16, -16]);
  const cardY = useTransform(sy, [-0.5, 0.5], [12, -12]);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  }

  const titleLines = useMemo(() => {
    const t = home?.heroTitle?.trim();
    if (t) return t.split("\n").filter(Boolean);
    return ["Where", "Village", "Legends", "Rise"];
  }, [home?.heroTitle]);

  const subtitle =
    home?.heroSubtitle ??
    "A franchise-based Free Fire league — auctions, live matches, and a permanent record of every legend.";
  const seasonName = season?.name ?? settings?.seasonName ?? "Velangi Free Fire Tournament";

  // Only APPROVED players are ever surfaced publicly.
  const approvedPlayers = useMemo(
    () => players.filter((p) => p.status === "approved"),
    [players],
  );

  const mvpId = useMemo(() => {
    if (home?.featuredPlayerIds?.[0]) return home.featuredPlayerIds[0];
    const ranked = [...standings].sort((a, b) => b.mvpAwards - a.mvpAwards || b.kills - a.kills);
    return ranked[0]?.playerId ?? approvedPlayers[0]?.id ?? null;
  }, [home?.featuredPlayerIds, standings, approvedPlayers]);

  const stats = [
    { label: "Players", value: approvedPlayers.length },
    { label: "Franchises", value: teams.length },
    { label: "Matches", value: matches.length },
  ];

  return (
    <section
      onMouseMove={onMove}
      className="bg-grid relative grid min-h-[calc(100dvh-4rem)] items-center gap-10 overflow-hidden px-5 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:px-12"
    >
      {/* LEFT */}
      <div className="relative z-10 max-w-2xl">
        <motion.span
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-7 inline-block rotate-[-2deg] rounded-full border-4 border-ink bg-vred px-5 py-1.5 text-sm font-bold uppercase tracking-wide shadow-brutal-sm"
        >
          {seasonName}
        </motion.span>

        <h1 className="text-6xl leading-[0.85] sm:text-7xl lg:text-8xl">
          {titleLines.map((line, i) => (
            <motion.span
              key={i}
              custom={i}
              variants={lineVariants}
              initial="hidden"
              animate="show"
              className={`block ${i === titleLines.length - 1 ? "text-vred" : "text-ink"}`}
            >
              {line}
            </motion.span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.7 }}
          className="mt-7 max-w-md text-lg font-medium text-ink/70"
        >
          {subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.95, duration: 0.6 }}
          className="mt-8 flex flex-wrap items-center gap-4"
        >
          <MagneticButton href="/login" variant="yellow">
            Enter the Arena
          </MagneticButton>
          <MagneticButton href="/teams" variant="cream">
            Explore Teams
          </MagneticButton>
        </motion.div>

        {/* Live stats — brutalist */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.6 }}
          className="mt-10 inline-flex flex-wrap overflow-hidden rounded-2xl border-4 border-ink bg-cream shadow-brutal-sm"
        >
          {stats.map((s, i) => (
            <div key={s.label} className={`px-5 py-3 ${i > 0 ? "border-l-4 border-ink" : ""}`}>
              <div className="text-2xl font-bold sm:text-3xl">
                <CountUp value={s.value} />
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-ink/55">{s.label}</div>
            </div>
          ))}
          <div className="border-l-4 border-ink bg-vgreen px-5 py-3">
            <div className="inline-flex items-center gap-1.5 text-lg font-bold sm:text-xl">
              <span className="h-2 w-2 animate-pulse rounded-full bg-ink" />
              {season?.status === "active" ? "Live" : season ? "Soon" : "Off"}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-ink/70">Season</div>
          </div>
        </motion.div>
      </div>

      {/* RIGHT — MVP showcase card with a gentle drift + mouse parallax */}
      <div className="relative z-10 flex justify-center">
        {mvpId ? (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
            style={{ x: cardX, y: cardY }}
          >
            <div className="animate-drift">
              <FutPlayerCard playerId={mvpId} size="lg" />
            </div>
            <div className="mt-4 text-center text-[11px] font-bold uppercase tracking-[0.3em] text-ink/40">
              Season MVP
            </div>
          </motion.div>
        ) : (
          <div className="aspect-[3/4] w-64 overflow-hidden rounded-3xl border-4 border-ink bg-cream shadow-brutal-md">
            {home?.heroImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={home.heroImage} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center text-sm font-bold uppercase text-ink/40">
                Season Showcase
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
