"use client";

import { FRANCHISE_BUDGET, MAX_SQUAD_SIZE } from "@/constants/app";
import { useTeams } from "@/hooks/useTeams";
import { formatNumber } from "@/lib/format";

/** Live per-team spend, slots filled and remaining purse (updates on every sale). */
export function AuctionSummary() {
  const { data: teams } = useTeams();
  if (teams.length === 0) return null;

  const sorted = [...teams].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="rounded-3xl border-4 border-ink bg-cream p-4 shadow-brutal">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide">Team Purses</h2>
      <ul className="space-y-2">
        {sorted.map((t) => {
          const budget = t.purse || FRANCHISE_BUDGET;
          const remaining = t.remainingPurse ?? budget;
          const spent = budget - remaining;
          const slots = t.squad?.length ?? 0;
          const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
          return (
            <li key={t.id} className="rounded-xl border-2 border-ink p-2">
              <div className="flex items-center justify-between text-sm font-bold uppercase">
                <span className="truncate">{t.name}</span>
                <span>
                  {slots}/{MAX_SQUAD_SIZE}
                </span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full border-2 border-ink bg-cream">
                <div className="h-full bg-vred" style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-1 flex justify-between text-xs font-bold text-ink/60">
                <span>Spent {formatNumber(spent)}</span>
                <span>Left {formatNumber(remaining)}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
