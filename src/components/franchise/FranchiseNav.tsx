"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Overview", href: ROUTES.franchise },
  { label: "Squad", href: ROUTES.franchisePlayers },
  { label: "Statistics", href: ROUTES.franchiseStatistics },
  { label: "History", href: ROUTES.franchiseHistory },
];

export function FranchiseNav() {
  const pathname = usePathname();
  return (
    <div className="flex flex-wrap gap-2">
      {TABS.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={cn(
            "min-h-9 rounded-xl border-2 border-ink px-4 py-1.5 text-sm font-bold uppercase tracking-wide transition-colors",
            pathname === t.href ? "bg-ink text-cream" : "bg-cream hover:bg-vyellow",
          )}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
