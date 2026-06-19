"use client";

import { CheckCircle2 } from "lucide-react";
import { useSoldBoard } from "@/hooks/useAuction";
import { formatNumber } from "@/lib/format";

/** "Recently sold" board for the auction session. */
export function SoldBoard() {
  const sold = useSoldBoard();
  if (sold.length === 0) return null;

  return (
    <div className="rounded-3xl border-4 border-ink bg-cream p-4 shadow-brutal">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide">
        <CheckCircle2 className="h-4 w-4 text-vgreen" /> Recently Sold
      </h2>
      <ul className="space-y-2">
        {sold.map((s) => (
          <li
            key={`${s.ts}-${s.playerId}`}
            className="flex items-center justify-between gap-2 rounded-xl border-2 border-ink bg-vgreen/30 px-3 py-1.5"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold uppercase">{s.ign}</span>
              <span className="block truncate text-xs font-medium text-ink/60">
                {s.teamName}
              </span>
            </span>
            <span className="shrink-0 text-sm font-bold">{formatNumber(s.price)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
