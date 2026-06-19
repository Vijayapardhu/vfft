"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { Bell, LogIn } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { COLLECTIONS } from "@/firebase/collections";
import { db } from "@/firebase/firestore";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { FullScreenLoader } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { formatMatchTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const uid = user?.uid ?? null;
  const { data: all, loading } = useNotifications(60);

  const items = useMemo(
    () => all.filter((n) => n.userId === uid || n.userId === "all"),
    [all, uid],
  );

  // Mark the user's own unread items read when they open the inbox.
  useEffect(() => {
    const unread = items.filter((n) => n.userId === uid && !n.read);
    if (unread.length === 0) return;
    void Promise.allSettled(
      unread.map((n) => updateDoc(doc(db, COLLECTIONS.notifications, n.id), { read: true })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, uid]);

  if (isLoading) return <FullScreenLoader />;

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-10">
        <PageHeader title="Notifications" subtitle="Your alerts and announcements." />
        <EmptyState
          icon={LogIn}
          title="Sign in to view notifications"
          message="Match reminders, results and announcements show up here."
        />
        <div className="mt-4 text-center">
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl border-4 border-ink bg-vyellow px-6 py-2.5 font-bold uppercase shadow-brutal-sm transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5"
          >
            <LogIn className="h-4 w-4" /> Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-8">
      <PageHeader title="Notifications" subtitle="Your alerts and announcements." />

      {loading ? (
        <FullScreenLoader />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          message="Match reminders, results and announcements will appear here."
        />
      ) : (
        <div className="space-y-3">
          {items.map((n) => {
            const fresh = n.userId === uid && !n.read;
            const inner = (
              <div
                className={cn(
                  "flex gap-3 rounded-2xl border-4 border-ink bg-cream p-4 shadow-brutal-sm transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5",
                  fresh && "bg-vyellow/20",
                )}
              >
                <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl border-2 border-ink bg-cream">
                  {n.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={n.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src="/icon.svg" alt="VFFT" className="h-7 w-7" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="flex items-center gap-1.5 text-sm font-bold">
                      {fresh && <span className="h-2 w-2 shrink-0 rounded-full bg-vred" />}
                      <span className="truncate">{n.title}</span>
                    </p>
                    <span className="shrink-0 text-[11px] font-bold uppercase text-ink/40">
                      {formatMatchTime(n.createdAt)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm font-medium text-ink/70">{n.body}</p>
                  {n.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={n.imageUrl}
                      alt=""
                      className="mt-2 max-h-48 w-full rounded-lg border-2 border-ink object-cover"
                    />
                  )}
                </div>
              </div>
            );
            return n.href ? (
              <Link key={n.id} href={n.href}>
                {inner}
              </Link>
            ) : (
              <div key={n.id}>{inner}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
