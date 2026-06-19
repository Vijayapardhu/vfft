"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart2,
  Clock,
  Gavel,
  LayoutDashboard,
  Palette,
  Settings,
  Swords,
  Users,
} from "lucide-react";
import { ROUTES, AUCTION_ROUTE } from "@/constants/routes";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Overview", href: ROUTES.franchise, icon: LayoutDashboard, exact: true },
  { label: "Brand", href: ROUTES.franchiseBrand, icon: Palette },
  { label: "Squad", href: ROUTES.franchiseSquad, icon: Users },
  { label: "Auction Room", href: AUCTION_ROUTE, icon: Gavel, external: true },
  { label: "Matches", href: ROUTES.franchiseMatches, icon: Swords },
  { label: "Analytics", href: ROUTES.franchiseStatistics, icon: BarChart2 },
  { label: "History", href: ROUTES.franchiseHistory, icon: Clock },
  { label: "Settings", href: ROUTES.franchiseSettings, icon: Settings },
];

export function FranchiseSidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col h-full py-4">
      {NAV.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-5 py-3 text-sm font-bold uppercase tracking-wide transition-all duration-150",
              active
                ? "bg-[var(--hq-brand,#6366f1)] text-ink border-r-4 border-ink"
                : "text-cream/60 hover:text-cream hover:bg-white/10",
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}

      <div className="mt-auto px-4 pb-2">
        <Link
          href={ROUTES.dashboard}
          className="flex items-center gap-2 rounded-xl border-2 border-cream/30 px-3 py-2.5 text-xs font-bold uppercase text-cream/50 transition-colors hover:border-cream/60 hover:text-cream"
        >
          <LayoutDashboard className="h-3.5 w-3.5" />
          Player Dashboard →
        </Link>
      </div>
    </nav>
  );
}

/** Horizontal scrollable nav for mobile screens */
export function FranchiseMobileNav() {
  const pathname = usePathname();
  return (
    <div className="flex overflow-x-auto gap-1 pb-0.5 scrollbar-none">
      {NAV.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-xl border-2 border-ink px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors",
              active ? "bg-ink text-cream" : "bg-cream/90 text-ink hover:bg-vyellow",
            )}
          >
            <item.icon className="h-3.5 w-3.5" />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
