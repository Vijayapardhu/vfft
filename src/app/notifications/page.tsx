"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useMemo } from "react";
import { Bell, CheckCheck, LogIn } from "lucide-react";
import { doc, updateDoc, writeBatch } from "firebase/firestore";
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

  const unreadOwn = useMemo(
    () => items.filter((n) => n.userId === uid && !n.read),
    [items, uid],
  );

  // Mark the user's own unread items read when they open the inbox.
  useEffect(() => {
    if (unreadOwn.length === 0) return;
    void Promise.allSettled(
      unreadOwn.map((n) => updateDoc(doc(db, COLLECTIONS.notifications, n.id), { read: true })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unreadOwn.length, uid]);

  const handleMarkAllRead = useCallback(async () => {
    const stillUnread = items.filter((n) => n.userId === uid && !n.read);
    if (stillUnread.length === 0) return;
    const batch = writeBatch(db);
    stillUnread.forEach((n) =>
      batch.update(doc(db, COLLECTIONS.notifications, n.id), { read: true }),
    );
    await batch.commit();
  }, [items, uid]);

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
      <div className="mb-5 flex items-start justify-between gap-3">
        <PageHeader title="Notifications" subtitle="Your alerts and announcements." />
        {unreadOwn.length > 0 && (
          <button
            type="button"
            onClick={() => void handleMarkAllRead()}
            className="mt-1 flex shrink-0 items-center gap-1.5 rounded-xl border-2 border-ink bg-cream px-3 py-1.5 text-xs font-bold uppercase transition-colors hover:bg-vyellow"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </button>
        )}
      </div>

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
                <div className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl border-2 border-ink bg-cream">
                  {n.imageUrl ? (
                    <Image src={n.imageUrl} alt="" fill className="object-cover" sizes="48px" />
                  ) : (
                    <Image src="/icon.svg" alt="VFFT" width={28} height={28} />
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
                    <div className="relative mt-2 max-h-48 w-full overflow-hidden rounded-lg border-2 border-ink">
                      <Image
                        src={n.imageUrl}
                        alt=""
                        width={600}
                        height={192}
                        className="h-full max-h-48 w-full object-cover"
                      />
                    </div>
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
