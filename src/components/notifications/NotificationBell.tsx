"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { COLLECTIONS } from "@/firebase/collections";
import { db } from "@/firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

/**
 * In-app notification inbox (neo-brutalist). Live Firestore listener over every
 * notification addressed to the signed-in user (their targeted ones + "all"
 * broadcasts). Shows the notification image when present, else the VFFT mark.
 */
export function NotificationBell() {
  const { user, isAuthenticated } = useAuth();
  const uid = user?.uid ?? null;
  const { data: all } = useNotifications(40);
  const [open, setOpen] = useState(false);

  const items = useMemo(
    () => all.filter((n) => n.userId === uid || n.userId === "all"),
    [all, uid],
  );
  const unread = useMemo(
    () => items.filter((n) => n.userId === uid && !n.read),
    [items, uid],
  );

  if (!isAuthenticated || !uid) return null;

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unread.length > 0) {
      await Promise.allSettled(
        unread.map((n) =>
          updateDoc(doc(db, COLLECTIONS.notifications, n.id), { read: true }),
        ),
      );
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label="Notifications"
        className="relative grid h-10 w-10 place-items-center rounded-xl border-2 border-ink bg-cream shadow-brutal-xs transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-vyellow"
      >
        <Bell className="h-5 w-5" />
        {unread.length > 0 && (
          <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 animate-pulse place-items-center rounded-full border-2 border-ink bg-vred px-1 text-[10px] font-bold text-cream">
            {unread.length > 9 ? "9+" : unread.length}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 z-40 mt-3 w-[22rem] max-w-[92vw] overflow-hidden rounded-2xl border-4 border-ink bg-cream shadow-brutal-md">
            <div className="flex items-center justify-between border-b-4 border-ink bg-vyellow px-4 py-2.5">
              <span className="text-sm font-bold uppercase tracking-wide">Notifications</span>
              {unread.length > 0 && (
                <span className="rounded-full border-2 border-ink bg-vred px-2 py-0.5 text-[10px] font-bold uppercase text-cream">
                  {unread.length} new
                </span>
              )}
            </div>
            <div className="max-h-[26rem] overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                  <Bell className="h-8 w-8 text-ink/20" />
                  <p className="text-sm font-medium text-ink/50">No notifications yet.</p>
                </div>
              ) : (
                items.map((n) => {
                  const fresh = n.userId === uid && !n.read;
                  const inner = (
                    <div
                      className={cn(
                        "flex gap-3 border-b-2 border-ink/10 px-4 py-3 transition-colors last:border-0 hover:bg-vyellow/30",
                        fresh && "bg-vyellow/20",
                      )}
                    >
                      <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl border-2 border-ink bg-cream">
                        {n.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={n.imageUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src="/icon.svg" alt="VFFT" className="h-7 w-7" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5 text-sm font-bold">
                          {fresh && <span className="h-2 w-2 shrink-0 rounded-full bg-vred" />}
                          <span className="truncate">{n.title}</span>
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-xs font-medium text-ink/60">{n.body}</p>
                        {n.imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={n.imageUrl}
                            alt=""
                            className="mt-2 max-h-28 w-full rounded-lg border-2 border-ink object-cover"
                          />
                        )}
                      </div>
                    </div>
                  );
                  return n.href ? (
                    <Link key={n.id} href={n.href} onClick={() => setOpen(false)}>
                      {inner}
                    </Link>
                  ) : (
                    <div key={n.id}>{inner}</div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
