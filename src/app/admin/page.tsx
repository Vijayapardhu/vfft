"use client";

import Link from "next/link";
import {
  Users,
  Swords,
  Calendar,
  Gamepad2,
  Gavel,
  UserMinus,
  Bell,
  Activity,
  PlusCircle,
  Send,
  Newspaper,
  Upload,
  Home,
} from "lucide-react";
import { query, where } from "firebase/firestore";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTeams } from "@/hooks/useTeams";
import { usePlayers } from "@/hooks/usePlayers";
import { useMatches } from "@/hooks/useMatches";
import { useNotifications } from "@/hooks/useNotifications";
import { useActiveSeason } from "@/hooks/useActiveSeason";
import { useCollectionData } from "@/hooks/useFirestore";
import { auctionsCol, disputesCol } from "@/firebase/collections";
import { isFirebaseConfigured } from "@/firebase/config";
import type { Auction, Dispute } from "@/types";

const quickActions = [
  { label: "Start Auction", href: "/admin/auction", icon: Gavel, color: "bg-vyellow" },
  { label: "Create Match", href: "/admin/matches", icon: PlusCircle, color: "bg-vblue" },
  { label: "Publish News", href: "/admin/news", icon: Newspaper, color: "bg-vpurple" },
  { label: "Send Notification", href: "/admin/notifications", icon: Send, color: "bg-vred" },
  { label: "Upload Poster", href: "/admin/gallery", icon: Upload, color: "bg-vgreen" },
  { label: "Update Home", href: "/admin/home", icon: Home, color: "bg-ink text-cream" },
];

export default function AdminDashboard() {
  const { data: teams, loading: teamsLoading } = useTeams();
  const { data: players, loading: playersLoading } = usePlayers();
  const { data: matches, loading: matchesLoading } = useMatches();
  const { data: notifications, loading: notifsLoading } = useNotifications();
  const { season, loading: seasonLoading } = useActiveSeason();
  const { data: disputes } = useCollectionData<Dispute>(
    isFirebaseConfigured ? disputesCol() : null,
    [],
  );
  const { data: liveAuctions } = useCollectionData<Auction>(
    isFirebaseConfigured ? query(auctionsCol(), where("status", "==", "active")) : null,
    [],
  );

  const loading = teamsLoading || playersLoading || matchesLoading || notifsLoading || seasonLoading;

  const openDisputes = disputes.filter(
    (d) => d.status === "open" || d.status === "underReview",
  ).length;
  const pendingApprovals = players.filter((p) => p.status === "pending").length;

  const stats = [
    { label: "Total Players", value: players?.length ?? 0, icon: Users, color: "bg-vblue" },
    { label: "Total Teams", value: teams?.length ?? 0, icon: Swords, color: "bg-vgreen" },
    { label: "Current Season", value: season?.name ?? "—", icon: Calendar, color: "bg-vpurple" },
    { label: "Matches Played", value: matches?.filter((m) => m.status === "completed").length ?? 0, icon: Gamepad2, color: "bg-vred" },
    { label: "Live Auctions", value: liveAuctions.length, icon: Gavel, color: "bg-vyellow" },
    { label: "Open Disputes", value: openDisputes, icon: UserMinus, color: "bg-vred" },
    { label: "Active Notifications", value: notifications?.filter((n) => !n.read).length ?? 0, icon: Bell, color: "bg-vblue" },
    { label: "Pending Approvals", value: pendingApprovals, icon: Activity, color: "bg-vgreen" },
  ];

  if (loading) {
    return (
      <div>
        <AdminHeader title="Dashboard" subtitle="Welcome to VFFT Admin" />
        <div className="mb-8 grid gap-4 grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4">
                <Skeleton className="mb-2 h-3 w-20" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminHeader title="Dashboard" subtitle="Welcome to VFFT Admin" />

      <div className="mb-8 grid gap-4 grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-wide text-ink/60">
                    {s.label}
                  </p>
                  <p className="text-2xl font-bold">{s.value}</p>
                </div>
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border-2 border-ink ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <h2 className="mb-4 text-xl font-bold uppercase tracking-tight">Quick Actions</h2>
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
        {quickActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={`${action.color} flex items-center gap-3 rounded-2xl border-4 border-ink p-4 font-bold uppercase shadow-brutal-sm transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5`}
          >
            <action.icon className="h-5 w-5 shrink-0" />
            <span className="text-sm leading-tight">{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
