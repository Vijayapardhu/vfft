"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Crown,
  Home,
  Image,
  Megaphone,
  Menu,
  Newspaper,
  Settings,
  Sparkles,
  TicketCheck,
  X,
  Users,
  Swords,
  Gavel,
  ClipboardList,
  Trophy,
  Medal,
  Calendar,
  UserMinus,
  ArrowLeftRight,
  BookUser,
  FileText,
  TrendingUp,
  Gamepad2,
} from "lucide-react";
import { useState } from "react";

interface SidebarSection {
  label: string;
  links: { label: string; href: string; icon: React.ReactNode }[];
}

const sections: SidebarSection[] = [
  {
    label: "Management",
    links: [
      { label: "Dashboard", href: "/admin", icon: <BarChart3 className="h-4 w-4" /> },
      { label: "Players", href: "/admin/players", icon: <Users className="h-4 w-4" /> },
      { label: "Teams", href: "/admin/teams", icon: <Swords className="h-4 w-4" /> },
      { label: "Auction", href: "/admin/auction", icon: <Gavel className="h-4 w-4" /> },
      { label: "Matches", href: "/admin/matches", icon: <Gamepad2 className="h-4 w-4" /> },
      { label: "Results", href: "/admin/results", icon: <ClipboardList className="h-4 w-4" /> },
    ],
  },
  {
    label: "Competition",
    links: [
      { label: "Stats", href: "/admin/stats", icon: <BarChart3 className="h-4 w-4" /> },
      { label: "Standings", href: "/admin/standings", icon: <Trophy className="h-4 w-4" /> },
      { label: "Season", href: "/admin/seasons", icon: <Calendar className="h-4 w-4" /> },
      { label: "Achievements", href: "/admin/achievements", icon: <Medal className="h-4 w-4" /> },
      { label: "Transfers", href: "/admin/transfers", icon: <ArrowLeftRight className="h-4 w-4" /> },
      { label: "Substitutions", href: "/admin/substitutions", icon: <UserMinus className="h-4 w-4" /> },
    ],
  },
  {
    label: "Content",
    links: [
      { label: "News", href: "/admin/news", icon: <Newspaper className="h-4 w-4" /> },
      { label: "Gallery", href: "/admin/gallery", icon: <Image className="h-4 w-4" /> },
      { label: "Hall of Fame", href: "/admin/hall-of-fame", icon: <Crown className="h-4 w-4" /> },
      { label: "Home Content", href: "/admin/home", icon: <Home className="h-4 w-4" /> },
      { label: "Marquee", href: "/admin/marquee", icon: <TicketCheck className="h-4 w-4" /> },
      { label: "Sponsors", href: "/admin/sponsors", icon: <Sparkles className="h-4 w-4" /> },
      { label: "Weapons", href: "/admin/weapons", icon: <Swords className="h-4 w-4" /> },
    ],
  },
  {
    label: "System",
    links: [
      { label: "Notifications", href: "/admin/notifications", icon: <Megaphone className="h-4 w-4" /> },
      { label: "Disputes", href: "/admin/disputes", icon: <UserMinus className="h-4 w-4" /> },
      { label: "Settings", href: "/admin/settings", icon: <Settings className="h-4 w-4" /> },
      { label: "Users", href: "/admin/users", icon: <BookUser className="h-4 w-4" /> },
      { label: "Audit", href: "/admin/audit", icon: <FileText className="h-4 w-4" /> },
      { label: "Analytics", href: "/admin/analytics", icon: <TrendingUp className="h-4 w-4" /> },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-50 grid h-10 w-10 place-items-center rounded-2xl border-4 border-ink bg-vyellow shadow-brutal-sm lg:hidden"
        aria-label="Open sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-ink/20 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r-4 border-ink bg-cream shadow-brutal-md transition-transform duration-200 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b-4 border-ink px-5 py-4">
          <Link href="/admin" className="text-xl font-bold uppercase tracking-tight">
            VFFT <span className="text-vred">Admin</span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="grid h-8 w-8 place-items-center rounded-xl border-2 border-ink lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          {sections.map((section) => (
            <div key={section.label} className="mb-4">
              <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-widest text-ink/40">
                {section.label}
              </p>
              {section.links.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-4 py-2 text-sm font-bold uppercase tracking-wide transition-colors",
                      isActive
                        ? "bg-ink text-cream"
                        : "text-ink hover:bg-vyellow",
                    )}
                  >
                    {link.icon}
                    {link.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="border-t-4 border-ink p-4 text-center text-xs font-bold text-ink/40">
          VFFT v0.1
        </div>
      </aside>
    </>
  );
}
