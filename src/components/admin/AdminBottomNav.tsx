"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  PlusCircle,
  Radio,
  MoreHorizontal,
  UserPlus,
  Swords,
  BarChart3,
  Calendar,
  ClipboardList,
  ClipboardCheck,
  UserMinus,
  ArrowLeftRight,
  Newspaper,
  Image,
  Crown,
  Bell,
  Settings,
  Sparkles,
  BookUser,
  FileText,
  TrendingUp,
  Home,
  TicketCheck,
  Medal,
  Gamepad2,
  Send,
  Upload,
  Gavel,
} from "lucide-react";

interface SheetTab {
  id: string;
  label: string;
  icon: React.ReactNode;
  links: { label: string; href: string; icon: React.ReactNode }[];
}

const tabs: SheetTab[] = [
  {
    id: "manage",
    label: "Manage",
    icon: <Users className="h-5 w-5" />,
    links: [
      { label: "Players", href: "/admin/players", icon: <UserPlus className="h-4 w-4" /> },
      { label: "Teams", href: "/admin/teams", icon: <Swords className="h-4 w-4" /> },
      { label: "Matches", href: "/admin/matches", icon: <Gamepad2 className="h-4 w-4" /> },
      { label: "Results", href: "/admin/results", icon: <ClipboardList className="h-4 w-4" /> },
      { label: "Stats", href: "/admin/stats", icon: <BarChart3 className="h-4 w-4" /> },
      { label: "Seasons", href: "/admin/seasons", icon: <Calendar className="h-4 w-4" /> },
      { label: "Disputes", href: "/admin/disputes", icon: <UserMinus className="h-4 w-4" /> },
      { label: "Lineups", href: "/admin/lineups", icon: <ClipboardCheck className="h-4 w-4" /> },
      { label: "Transfers", href: "/admin/transfers", icon: <ArrowLeftRight className="h-4 w-4" /> },
      { label: "Substitutions", href: "/admin/substitutions", icon: <UserMinus className="h-4 w-4" /> },
    ],
  },
  {
    id: "create",
    label: "Create",
    icon: <PlusCircle className="h-5 w-5" />,
    links: [
      { label: "Create Match", href: "/admin/matches", icon: <Gamepad2 className="h-4 w-4" /> },
      { label: "Send Notification", href: "/admin/notifications", icon: <Send className="h-4 w-4" /> },
      { label: "Create News", href: "/admin/news", icon: <Newspaper className="h-4 w-4" /> },
      { label: "Upload Poster", href: "/admin/gallery", icon: <Upload className="h-4 w-4" /> },
      { label: "Start Auction", href: "/admin/auction", icon: <Gavel className="h-4 w-4" /> },
    ],
  },
  {
    id: "live",
    label: "Live",
    icon: <Radio className="h-5 w-5" />,
    links: [
      { label: "Live Matches", href: "/admin/matches", icon: <Radio className="h-4 w-4" /> },
      { label: "Active Auction", href: "/admin/auction", icon: <Gavel className="h-4 w-4" /> },
      { label: "Online Players", href: "/admin/analytics", icon: <Users className="h-4 w-4" /> },
    ],
  },
  {
    id: "more",
    label: "More",
    icon: <MoreHorizontal className="h-5 w-5" />,
    links: [
      { label: "News", href: "/admin/news", icon: <Newspaper className="h-4 w-4" /> },
      { label: "Gallery", href: "/admin/gallery", icon: <Image className="h-4 w-4" /> },
      { label: "Hall of Fame", href: "/admin/hall-of-fame", icon: <Crown className="h-4 w-4" /> },
      { label: "Notifications", href: "/admin/notifications", icon: <Bell className="h-4 w-4" /> },
      { label: "Achievements", href: "/admin/achievements", icon: <Medal className="h-4 w-4" /> },
      { label: "Sponsors", href: "/admin/sponsors", icon: <Sparkles className="h-4 w-4" /> },
      { label: "Settings", href: "/admin/settings", icon: <Settings className="h-4 w-4" /> },
      { label: "Users", href: "/admin/users", icon: <BookUser className="h-4 w-4" /> },
      { label: "Audit", href: "/admin/audit", icon: <FileText className="h-4 w-4" /> },
      { label: "Analytics", href: "/admin/analytics", icon: <TrendingUp className="h-4 w-4" /> },
      { label: "Home Content", href: "/admin/home", icon: <Home className="h-4 w-4" /> },
      { label: "Marquee", href: "/admin/marquee", icon: <TicketCheck className="h-4 w-4" /> },
    ],
  },
];

export function AdminBottomNav() {
  const pathname = usePathname();
  const [openSheet, setOpenSheet] = useState<string | null>(null);

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-around border-t-4 border-ink bg-cream px-2 pb-safe lg:hidden">
        <Link
          href="/admin"
          className={`flex flex-col items-center gap-0.5 rounded-xl px-3 py-2 text-[10px] font-bold uppercase tracking-wide transition-colors ${
            pathname === "/admin" ? "bg-ink text-cream" : "text-ink/60 hover:text-ink"
          }`}
        >
          <LayoutDashboard className="h-5 w-5" />
          Dashboard
        </Link>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setOpenSheet(openSheet === tab.id ? null : tab.id)}
            className={`flex flex-col items-center gap-0.5 rounded-xl px-3 py-2 text-[10px] font-bold uppercase tracking-wide transition-colors ${
              openSheet === tab.id ? "bg-ink text-cream" : "text-ink/60 hover:text-ink"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </nav>

      <AnimatePresence>
        {openSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-ink/20 backdrop-blur-sm lg:hidden"
              onClick={() => setOpenSheet(null)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-x-0 bottom-[72px] z-50 max-h-[60vh] overflow-y-auto rounded-t-3xl border-4 border-ink bg-cream p-4 shadow-brutal-xl lg:hidden"
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-bold uppercase tracking-tight">
                  {tabs.find((t) => t.id === openSheet)?.label}
                </h3>
                <button
                  type="button"
                  onClick={() => setOpenSheet(null)}
                  className="grid h-8 w-8 place-items-center rounded-xl border-2 border-ink"
                >
                  <span className="text-lg font-bold leading-none">&times;</span>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {tabs
                  .find((t) => t.id === openSheet)
                  ?.links.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setOpenSheet(null)}
                        className={`flex items-center gap-2 rounded-2xl border-2 border-ink px-3 py-2.5 text-sm font-bold uppercase tracking-wide transition-colors ${
                          isActive ? "bg-ink text-cream" : "bg-cream hover:bg-vyellow"
                        }`}
                      >
                        {link.icon}
                        {link.label}
                      </Link>
                    );
                  })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
