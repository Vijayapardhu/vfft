"use client";

import { motion } from "framer-motion";
import { Gavel, UserRound, Volume2, VolumeX, Zap } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AuctionAdminPanel } from "@/components/auction/AuctionAdminPanel";
import { AuctionSummary } from "@/components/auction/AuctionSummary";
import { BidFeed } from "@/components/auction/BidFeed";
import { Confetti } from "@/components/auction/Confetti";
import { SoldBoard } from "@/components/auction/SoldBoard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { FullScreenLoader } from "@/components/ui/spinner";
import { PLAYER_ROLE_LABELS } from "@/constants/app";
import { useCurrentAuction } from "@/hooks/useAuction";
import { useAuth } from "@/hooks/useAuth";
import { useTeam } from "@/hooks/useTeams";
import { formatNumber } from "@/lib/format";
import { sound } from "@/lib/sound";
import { cn } from "@/lib/utils";
import { autoExpireAuction, submitBid } from "@/services/auctionService";

function fmtClock(seconds: number | null): string {
  if (seconds === null) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AuctionRoom() {
  const { data: auction, loading } = useCurrentAuction();
  const { role, isAuthenticated, user } = useAuth();
  const { data: myTeam } = useTeam(user?.teamId ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [customBid, setCustomBid] = useState("");
  const [optimisticBid, setOptimisticBid] = useState<number | null>(null);
  const [outbid, setOutbid] = useState(false);

  const expiredRef = useRef<Record<string, number>>({});
  const beepRef = useRef<number>(-1);
  const soldRef = useRef<string | null>(null);
  const activeRef = useRef<string | null>(null);
  const prevBidRef = useRef<number | null>(null);

  const auctionId = auction?.auctionId ?? null;
  const status = auction?.status ?? null;
  const endsAt = auction?.endsAt ?? null;
  const currentBid = optimisticBid ?? auction?.currentBid ?? 0;

  // Soft blip whenever the highest bid rises (skip the initial value).
  // If the new leader is NOT our team, play the outbid alert.
  useEffect(() => {
    if (prevBidRef.current !== null && currentBid > prevBidRef.current) {
      if (myTeam && auction?.highestTeamId && auction.highestTeamId !== myTeam.id) {
        sound.outbid();
        setOutbid(true);
        setTimeout(() => setOutbid(false), 2000);
      } else {
        sound.placedBid();
      }
    }
    prevBidRef.current = currentBid;
  }, [currentBid]);

  // Clear optimistic bid once RTDB confirms the new value
  useEffect(() => {
    if (auction?.currentBid !== undefined) {
      setOptimisticBid(null);
    }
  }, [auction?.currentBid]);

  // Countdown ticker → 3·2·1 beeps + server-validated auto-close at zero.
  // Retries every 3 s if the server says "not expired yet" (handles clock skew).
  useEffect(() => {
    if (!auctionId || status !== "active" || endsAt === null) {
      setSecondsLeft(null);
      beepRef.current = -1;
      return;
    }
    const update = () => {
      const s = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setSecondsLeft(s);
      if (s !== beepRef.current) {
        beepRef.current = s;
        if (s <= 10 && s > 3) { sound.warn(s); sound.thump(s); }
        if (s <= 3 && s > 0) { sound.tick(s); sound.thump(s); }
      }
      if (s <= 0) {
        const last = expiredRef.current[auctionId] ?? 0;
        if (Date.now() - last > 3000) {
          expiredRef.current[auctionId] = Date.now();
          void autoExpireAuction(auctionId);
        }
      }
    };
    update();
    const id = setInterval(update, 200);
    return () => clearInterval(id);
  }, [auctionId, status, endsAt]);

  // Fanfare when a new player enters the auction block.
  useEffect(() => {
    if (auctionId && status === "active" && activeRef.current !== auctionId) {
      activeRef.current = auctionId;
      sound.fanfare();
    }
  }, [auctionId, status]);

  // Dramatic gavel "SOLD" sound + unsound effect on close.
  useEffect(() => {
    if (auctionId && soldRef.current !== auctionId) {
      if (status === "sold") {
        soldRef.current = auctionId;
        sound.hammer();
      } else if (status === "unsold") {
        soldRef.current = auctionId;
        sound.unsold();
      }
    }
  }, [status, auctionId]);

  function toggleMute() {
    sound.unlock();
    setMuted((m) => {
      sound.setMuted(!m);
      return !m;
    });
  }

  async function act(fn: () => Promise<unknown>) {
    sound.unlock();
    setError(null);
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <FullScreenLoader />;

  const isAdmin = role === "admin";
  const canBid =
    isAuthenticated && (role === "teamLeader" || role === "franchiseOwner");

  if (!auction) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <EmptyState
          icon={Gavel}
          title="No player up right now"
          message={
            isAdmin
              ? "Pick a player below and press Start Bidding to open the auction."
              : "Hang tight — the next player will go up for auction soon!"
          }
        />
        {isAdmin && <AuctionAdminPanel auction={null} />}
        <div className="mt-6">
          <AuctionSummary />
        </div>
      </div>
    );
  }

  const roleLabel =
    PLAYER_ROLE_LABELS[auction.playerRole as keyof typeof PLAYER_ROLE_LABELS] ??
    auction.playerRole;
  const bidOptions =
    auction.currentBid > 0
      ? [auction.currentBid + 50, auction.currentBid + 100, auction.currentBid + 250]
      : [auction.basePrice, auction.basePrice + 50, auction.basePrice + 100];
  const showHammer =
    auction.status === "active" && secondsLeft !== null && secondsLeft <= 3 && secondsLeft > 0;
  const minBid = auction.currentBid > 0 ? auction.currentBid + 1 : auction.basePrice;
  const hammerText =
    secondsLeft === 3 ? "GOING ONCE" : secondsLeft === 2 ? "GOING TWICE" : "LAST CALL!";

  // Plain-language status + what-to-do hint (friendly for first-timers).
  const statusPill =
    auction.status === "sold"
      ? { text: "SOLD!", cls: "bg-vgreen" }
      : auction.status === "unsold"
        ? { text: "Unsold", cls: "bg-vred text-cream" }
        : showHammer
          ? { text: hammerText, cls: "bg-vyellow" }
          : { text: "🔴 Live — bidding open", cls: "bg-vred text-cream" };
  const hint = isAdmin
    ? "You're the auctioneer — press 🔨 Hammer when you're ready to sell."
    : canBid
      ? "Tap a BID button to raise the bid. Keep an eye on your coins!"
      : isAuthenticated
        ? "Only team captains can place bids — enjoy the show!"
        : "Sign in as a team captain to join the bidding.";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="relative overflow-hidden rounded-3xl border-4 border-ink bg-cream shadow-brutal-lg">
        {auction.status === "sold" && <Confetti />}

        {/* Sound toggle */}
        <button
          type="button"
          onClick={toggleMute}
          aria-label={muted ? "Unmute" : "Mute"}
          className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-xl border-4 border-ink bg-cream shadow-brutal-xs"
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>

        <div className="bg-grid p-6">
          {/* Status + plain-language hint */}
          <div className="mb-4 flex flex-col items-center gap-2 text-center">
            <span
              className={cn(
                "rounded-full border-4 border-ink px-4 py-1 text-sm font-bold uppercase shadow-brutal-xs",
                statusPill.cls,
              )}
            >
              {statusPill.text}
            </span>
            <p className="max-w-xs text-xs font-bold text-ink/60">{hint}</p>
          </div>

          {/* Player on the block */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="relative h-40 w-40 overflow-hidden rounded-3xl border-4 border-ink bg-vpurple/40 shadow-brutal">
              {auction.playerPhotoURL ? (
                <Image src={auction.playerPhotoURL} alt={auction.playerIgn} fill className="object-cover" sizes="160px" />
              ) : (
                <div className="grid h-full place-items-center">
                  <UserRound className="h-20 w-20 text-ink/30" />
                </div>
              )}

              {/* "Going once / going twice" hammer overlay */}
              {showHammer && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-ink/70 text-center">
                  <span className="text-base font-bold uppercase tracking-widest text-vyellow">
                    {hammerText}
                  </span>
                  <motion.span
                    key={secondsLeft}
                    initial={{ scale: 2.5, opacity: 0, y: -40 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: "easeOut", type: "spring", stiffness: 120, damping: 12 }}
                    className="text-6xl font-bold text-cream"
                  >
                    {secondsLeft}
                  </motion.span>
                </div>
              )}
            </div>
            <Badge variant="purple">{roleLabel}</Badge>
            <h1 className="truncate text-4xl">{auction.playerIgn}</h1>
            <div className="text-sm font-bold text-ink/60">
              Base price {formatNumber(auction.basePrice)} coins
            </div>
          </div>

          {/* Current bid + timer */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-2xl border-4 border-ink bg-vyellow p-4 text-center shadow-brutal">
              <div className="text-xs font-bold uppercase text-ink/60">Current Bid</div>
              <motion.div
                key={currentBid}
                initial={{ scale: 1.5, y: -20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ duration: 0.35, type: "spring", stiffness: 200, damping: 14 }}
                className="text-3xl font-bold"
              >
                {formatNumber(currentBid)}
              </motion.div>
              <div className="truncate text-xs font-bold text-ink/60">
                {auction.highestTeamName ?? "No bids yet"}
              </div>
            </div>
            <div
              className={cn(
                "rounded-2xl border-4 border-ink bg-cream p-4 text-center shadow-brutal transition-colors duration-500",
                secondsLeft !== null && secondsLeft <= 10 && secondsLeft > 0 && "border-vred",
                secondsLeft !== null && secondsLeft <= 3 && secondsLeft > 0 && "animate-pulse",
              )}
            >
              <div className="text-xs font-bold uppercase text-ink/60">
                {auction.endsAt === null ? "Mode" : "Time Left"}
              </div>
              <div
                className={cn(
                  "text-3xl font-bold tabular-nums",
                  secondsLeft !== null && secondsLeft <= 10 && secondsLeft > 0 && "text-vred",
                )}
              >
                {auction.endsAt === null ? "MANUAL" : fmtClock(secondsLeft)}
              </div>
              {secondsLeft !== null && auction.endsAt !== null && (
                <div className="mt-2 h-2 overflow-hidden rounded-full border-2 border-ink bg-cream">
                  <motion.div
                    className="h-full bg-vred"
                    animate={{ width: `${Math.min(100, (secondsLeft / 60) * 100)}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Outbid alert */}
          {outbid && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 flex items-center justify-center gap-2 rounded-2xl border-4 border-vred bg-vred/10 p-3 text-center font-bold text-vred shadow-brutal-xs"
            >
              <Zap className="h-5 w-5" /> YOU&apos;VE BEEN OUTBID!
            </motion.div>
          )}

          {/* Outcome */}
          {auction.status === "sold" && (
            <div className="relative mt-6 animate-bounce rounded-2xl border-4 border-ink bg-vgreen p-4 text-center shadow-brutal-md motion-reduce:animate-none">
              <div className="text-3xl font-bold">SOLD! 🎉</div>
              <div className="font-bold">
                {auction.highestTeamName} · {formatNumber(auction.soldPrice ?? auction.currentBid)} coins
              </div>
            </div>
          )}
          {auction.status === "unsold" && (
            <div className="mt-6 rounded-2xl border-4 border-ink bg-vred p-4 text-center font-bold shadow-brutal-md">
              UNSOLD
            </div>
          )}

          {/* Bidding */}
          {auction.status === "active" && (
            <div className="mt-6">
              {canBid && myTeam && (
                <p className="mb-3 text-center text-sm font-bold">
                  💰 You have {formatNumber(myTeam.remainingPurse)} coins to spend
                </p>
              )}
              {canBid ? (
                <>
                  <div className="flex flex-wrap justify-center gap-3">
                    {bidOptions.map((amount) => (
                      <Button
                        key={amount}
                        variant="red"
                        size="lg"
                        disabled={busy}
                        onClick={() => {
                          sound.click();
                          setOptimisticBid(amount);
                          act(() => submitBid(auction.auctionId, amount)).catch(() => setOptimisticBid(null));
                        }}
                      >
                        Bid {formatNumber(amount)}
                      </Button>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={minBid}
                      value={customBid}
                      onChange={(e) => setCustomBid(e.target.value)}
                      placeholder={`Min ${formatNumber(minBid)}`}
                      className="w-40"
                    />
                    <Button
                      variant="ink"
                      disabled={busy || !customBid || Number(customBid) < minBid}
                      onClick={() => {
                        const amt = Number(customBid);
                        setOptimisticBid(amt);
                        act(async () => {
                          await submitBid(auction.auctionId, amt);
                          setCustomBid("");
                        }).catch(() => setOptimisticBid(null));
                      }}
                    >
                      Bid
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-center text-sm font-bold text-ink/60">
                  {isAuthenticated
                    ? "Only team leaders & owners can bid."
                    : "Sign in as a team leader to bid."}
                </p>
              )}
              {error && (
                <p className="mt-3 text-center text-sm font-bold text-vred">{error}</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {auction.status === "active" && <BidFeed />}
        <SoldBoard />
      </div>
      <div className="mt-4">
        <AuctionSummary />
      </div>

      {isAdmin && <AuctionAdminPanel auction={auction} />}
    </div>
  );
}
