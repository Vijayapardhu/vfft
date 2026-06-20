"use client";

import { onValue, ref } from "firebase/database";
import { Dices, Sparkles, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { isFirebaseConfigured } from "@/firebase/config";
import { rtdb } from "@/firebase/rtdb";
import { sound } from "@/lib/sound";
import { cn } from "@/lib/utils";
import type { AuctionSpinState } from "@/types";

/** How long the winner card lingers after the reel locks (ms). */
const REVEAL_MS = 2400;

/**
 * Full-screen, synchronized "random player" reveal. Every client (admin,
 * spectators, captains) reads the same RTDB `auction/spin` node and animates the
 * slot reel to land on the winner at the same instant — with sound + haptics.
 * Renders nothing when no fresh spin is active.
 */
export function AuctionSpinner() {
  const [spin, setSpin] = useState<AuctionSpinState | null>(null);
  const [phase, setPhase] = useState<"idle" | "rolling" | "won">("idle");
  const [display, setDisplay] = useState("");
  const timersRef = useRef<number[]>([]);

  // Subscribe to the shared reel state.
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const node = ref(rtdb, "auction/spin");
    const unsub = onValue(node, (snap) => setSpin((snap.val() as AuctionSpinState) ?? null));
    return () => unsub();
  }, []);

  // Drive the animation whenever a new spin arrives.
  useEffect(() => {
    const clearTimers = () => {
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current = [];
    };
    clearTimers();

    if (!spin?.spinId || !spin.names?.length || !spin.startedAt) {
      setPhase("idle");
      return clearTimers;
    }

    const now = Date.now();
    const rollEnd = spin.startedAt + spin.durationMs;
    const hideAt = rollEnd + REVEAL_MS;
    if (now >= hideAt) {
      setPhase("idle");
      return clearTimers; // stale reel — ignore
    }

    // Auto-hide once the reveal window passes.
    timersRef.current.push(
      window.setTimeout(() => setPhase("idle"), Math.max(0, hideAt - now)),
    );

    // Joined after the reel already landed — show the winner straight away.
    if (now >= rollEnd) {
      setDisplay(spin.winnerIgn);
      setPhase("won");
      sound.spinWin();
      return clearTimers;
    }

    setPhase("rolling");
    let i = Math.floor(Math.random() * spin.names.length);

    const step = () => {
      const elapsed = Date.now() - spin.startedAt;
      if (elapsed >= spin.durationMs) {
        setDisplay(spin.winnerIgn);
        setPhase("won");
        sound.spinWin();
        return;
      }
      i = (i + 1) % spin.names.length;
      setDisplay(spin.names[i] ?? spin.winnerIgn);
      sound.spinTick();
      // Ease-out: flicks start fast (~45ms) and slow toward the lock.
      const frac = elapsed / spin.durationMs;
      timersRef.current.push(window.setTimeout(step, 45 + 250 * frac * frac));
    };
    step();

    return clearTimers;
    // Intentionally keyed on spinId only — a fresh spin id is the single signal
    // to (re)start the reel; the rest of `spin` is read from the same snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spin?.spinId]);

  if (phase === "idle" || !spin) return null;

  const won = phase === "won";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border-4 border-ink bg-cream shadow-brutal-lg">
        {/* Header */}
        <div
          className={cn(
            "flex items-center justify-center gap-2 border-b-4 border-ink px-5 py-3 transition-colors",
            won ? "bg-vgreen" : "bg-vyellow",
          )}
        >
          {won ? <Sparkles className="h-5 w-5" /> : <Dices className="h-5 w-5 animate-spin" />}
          <span className="text-sm font-bold uppercase tracking-widest">
            {won ? "Up Next!" : "Selecting Next Player"}
          </span>
        </div>

        <div className="bg-grid p-6">
          {won ? (
            /* Winner reveal */
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="relative h-28 w-28 overflow-hidden rounded-2xl border-4 border-ink bg-vpurple/20 shadow-brutal-sm">
                {spin.winnerPhotoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={spin.winnerPhotoURL} alt={spin.winnerIgn} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center">
                    <UserRound className="h-12 w-12 text-ink/30" />
                  </div>
                )}
              </div>
              <h2 className="text-3xl font-bold leading-tight">{spin.winnerIgn}</h2>
              {spin.winnerRole && (
                <span className="rounded-xl border-2 border-ink bg-vblue px-3 py-1 text-xs font-bold uppercase">
                  {spin.winnerRole}
                </span>
              )}
              <p className="mt-1 text-sm font-bold uppercase tracking-wide text-ink/50">
                Going to auction…
              </p>
            </div>
          ) : (
            /* Rolling reel */
            <div className="flex flex-col items-center gap-4">
              <p className="text-xs font-bold uppercase tracking-widest text-ink/40">
                Who&apos;s up next?
              </p>
              <div className="relative grid h-24 w-full place-items-center overflow-hidden rounded-2xl border-4 border-ink bg-vyellow/30">
                {/* slot glare lines */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-ink/15 to-transparent" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-ink/15 to-transparent" />
                <span
                  key={display}
                  className="px-3 text-center text-2xl font-bold leading-tight"
                  style={{ animation: "spinFlick 90ms ease-out" }}
                >
                  {display || "…"}
                </span>
              </div>
              <p className="text-[11px] font-medium text-ink/40">Randomly drawing a player…</p>
            </div>
          )}
        </div>
      </div>

      {/* tiny keyframe for the per-flick pop (scoped, no global CSS needed) */}
      <style>{`
        @keyframes spinFlick {
          0% { transform: translateY(-40%); opacity: 0.2; }
          100% { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
