"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: React.ReactNode;
  content: React.ReactNode;
}

/** Lightweight controlled tabs used by team, match and leaderboard pages. */
export function Tabs({ tabs, initial }: { tabs: TabItem[]; initial?: string }) {
  const [active, setActive] = useState(initial ?? tabs[0]?.id);
  const current = tabs.find((t) => t.id === active) ?? tabs[0];

  return (
    <div>
      <div
        role="tablist"
        className="mb-5 flex flex-wrap gap-2 overflow-x-auto"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active === t.id}
            onClick={() => setActive(t.id)}
            className={cn(
              "min-h-9 shrink-0 rounded-xl border-2 border-ink px-4 py-1.5 text-sm font-bold uppercase tracking-wide transition-colors",
              active === t.id ? "bg-ink text-cream" : "bg-cream hover:bg-vyellow",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel">{current?.content}</div>
    </div>
  );
}
