"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Gavel } from "lucide-react";
import { useAuctionFeed } from "@/hooks/useAuction";
import { formatNumber } from "@/lib/format";

/** Live, newest-first ticker of bids on the current lot. */
export function BidFeed() {
  const feed = useAuctionFeed();
  if (feed.length === 0) return null;

  return (
    <div className="rounded-3xl border-4 border-ink bg-cream p-4 shadow-brutal">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide">
        <Gavel className="h-4 w-4" /> Live Bids
      </h2>
      <ul className="space-y-2">
        <AnimatePresence initial={false}>
          {feed.map((bid) => (
            <motion.li
              key={`${bid.ts}-${bid.teamId}`}
              layout
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between rounded-xl border-2 border-ink bg-cream px-3 py-1.5"
            >
              <span className="truncate text-sm font-bold uppercase">
                {bid.teamName}
              </span>
              <span className="text-sm font-bold text-vred">
                {formatNumber(bid.amount)}
              </span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
