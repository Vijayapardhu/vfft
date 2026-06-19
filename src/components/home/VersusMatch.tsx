"use client";

import { motion } from "framer-motion";
import { MapPin, Shield } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useMatch } from "@/hooks/useMatches";
import { useTeam } from "@/hooks/useTeams";
import { cn } from "@/lib/utils";

function useTimeLeft(targetMs: number | null) {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (!targetMs) return;
    const tick = () => setLeft(Math.max(0, targetMs - Date.now()));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [targetMs]);
  return left;
}

function fmt(ms: number) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return d > 0 ? `${d}d ${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

function Crest({ name, logo, side }: { name?: string; logo?: string | null; side: "l" | "r" }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: side === "l" ? -30 : 30, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, ease: [0.2, 0.65, 0.3, 0.9] }}
      className="flex min-w-0 flex-1 flex-col items-center gap-3"
    >
      <div className="relative grid h-20 w-20 place-items-center overflow-hidden rounded-2xl border border-white/15 bg-white/5 sm:h-28 sm:w-28">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt={name} className="h-full w-full object-cover" />
        ) : (
          <Shield className="h-10 w-10 text-cream/30" />
        )}
      </div>
      <span className="truncate text-center text-sm font-semibold uppercase tracking-wide sm:text-lg">
        {name ?? "TBD"}
      </span>
    </motion.div>
  );
}

/** Premium featured-match banner (Valorant Champions Tour vibe). */
export function VersusMatch({ matchId }: { matchId: string }) {
  const { data: match } = useMatch(matchId);
  const { data: team1 } = useTeam(match?.team1Id ?? null);
  const { data: team2 } = useTeam(match?.team2Id ?? null);
  const left = useTimeLeft(match?.scheduledAt?.toMillis?.() ?? null);

  if (!match) return null;
  const live = match.status === "live";
  const done = match.status === "completed";

  return (
    <Link href={`/matches/${matchId}`} className="block">
      <div className="relative overflow-hidden rounded-[2rem] bg-ink text-cream shadow-soft-lg">
        <div className="bg-spotlight absolute inset-0 opacity-80" />
        <div className="bg-grid-fine absolute inset-0 opacity-[0.07]" />
        <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />

        <div className="relative p-6 sm:p-10">
          <div className="mb-6 flex items-center justify-center gap-3">
            <span className="rounded-full border border-white/15 bg-white/5 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-cream/70">
              {match.name || "Featured Match"}
            </span>
            {live && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-vred px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> Live
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 sm:gap-8">
            <Crest name={team1?.name} logo={team1?.logoUrl} side="l" />
            <div className="flex flex-col items-center">
              <span className="bg-gradient-to-b from-cream to-cream/40 bg-clip-text text-4xl font-extralight italic tracking-tight text-transparent sm:text-6xl">
                VS
              </span>
              <div className="mt-3 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-center font-mono text-sm tracking-wide sm:text-base">
                {done ? "FINAL" : live ? "IN PROGRESS" : left > 0 ? fmt(left) : "STARTING"}
              </div>
            </div>
            <Crest name={team2?.name} logo={team2?.logoUrl} side="r" />
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-[11px] font-semibold uppercase tracking-wider text-cream/55">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4" /> {match.map || "Map TBD"}
            </span>
            <span>{(match.teamSize ?? 4)} v {(match.teamSize ?? 4)}</span>
            <span className={cn(done ? "text-vgreen" : live ? "text-vred" : "text-gold")}>{match.status}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
