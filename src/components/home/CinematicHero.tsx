"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useMemo } from "react";
import { MagneticButton } from "@/components/fx/MagneticButton";
import { FutPlayerCard } from "@/components/home/FutPlayerCard";
import { useActiveSeason } from "@/hooks/useActiveSeason";
import { useHomeContent } from "@/hooks/useHomeContent";
import { usePlayers } from "@/hooks/usePlayers";
import { usePlayerStandings } from "@/hooks/useLeaderboard";
import { useSettings } from "@/hooks/useSettings";

const lineVariants = {
  hidden: { opacity: 0, y: 40, filter: "blur(14px)" },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.9, delay: 0.15 + i * 0.12, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

export function CinematicHero() {
  const { data: home } = useHomeContent();
  const { data: settings } = useSettings();
  const { data: players } = usePlayers();
  const { season } = useActiveSeason();
  const { standings } = usePlayerStandings();

  // Light, slow mouse parallax on the background wash.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 40, damping: 20 });
  const sy = useSpring(my, { stiffness: 40, damping: 20 });
  const washX = useTransform(sx, [-0.5, 0.5], [-26, 26]);
  const washY = useTransform(sy, [-0.5, 0.5], [-20, 20]);

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

  // Showcase card subject: top player (MVP, then kills), else featured, else first.
  const mvpId = useMemo(() => {
    if (home?.featuredPlayerIds?.[0]) return home.featuredPlayerIds[0];
    const ranked = [...standings].sort(
      (a, b) => b.mvpAwards - a.mvpAwards || b.kills - a.kills,
    );
    return ranked[0]?.playerId ?? players[0]?.id ?? null;
  }, [home?.featuredPlayerIds, standings, players]);

  return (
    <section
      onMouseMove={onMove}
      className="relative grid min-h-[calc(100dvh-4rem)] items-center gap-10 overflow-hidden px-6 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:px-12"
    >
      {/* Background — spotlight + fine grid + vignette (no particles) */}
      <motion.div style={{ x: washX, y: washY }} className="bg-spotlight absolute inset-0 -z-10" />
      <div className="bg-grid-fine absolute inset-0 -z-10" />
      <div className="bg-vignette pointer-events-none absolute inset-0 -z-10" />

      {/* LEFT — headline */}
      <div className="relative z-10 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-7 inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/40 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/70 backdrop-blur"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-vred" />
          {seasonName}
        </motion.div>

        <h1 className="select-none">
          {titleLines.map((line, i) => (
            <motion.span
              key={i}
              custom={i}
              variants={lineVariants}
              initial="hidden"
              animate="show"
              className={`block text-[12vw] font-extralight uppercase leading-[0.86] tracking-tight sm:text-7xl lg:text-8xl ${
                i === titleLines.length - 1 ? "text-ink" : "text-ink/90"
              }`}
            >
              {line}
            </motion.span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.8 }}
          className="mt-8 max-w-md text-base font-light leading-relaxed text-ink/60 sm:text-lg"
        >
          {subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.05, duration: 0.7 }}
          className="mt-9 flex flex-wrap items-center gap-3"
        >
          <MagneticButton href="/login" variant="primary">
            Enter the Arena
          </MagneticButton>
          <MagneticButton href="/teams" variant="ghost">
            Explore Teams
          </MagneticButton>
        </motion.div>
      </div>

      {/* RIGHT — slow 3D MVP showcase card */}
      <div className="relative z-10 flex justify-center">
        {mvpId ? (
          <div className="relative [perspective:1400px]">
            <div className="absolute -inset-10 -z-10 rounded-full bg-gold/15 blur-3xl" />
            <motion.div
              animate={{ rotateY: [-7, 7, -7], y: [-6, 6, -6] }}
              transition={{ duration: 11, ease: "easeInOut", repeat: Infinity }}
              style={{ transformStyle: "preserve-3d" }}
            >
              <FutPlayerCard playerId={mvpId} size="lg" />
            </motion.div>
            <div className="mt-5 text-center text-[11px] font-semibold uppercase tracking-[0.3em] text-ink/40">
              Season MVP
            </div>
          </div>
        ) : (
          <div className="card-premium relative aspect-[3/4] w-72 overflow-hidden rounded-[1.75rem]">
            {home?.heroImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={home.heroImage} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center text-sm font-medium text-ink/40">
                Season showcase
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
