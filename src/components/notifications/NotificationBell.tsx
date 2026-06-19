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
 * In-app notification inbox. Reads the Firestore `notifications` collection in
 * real time and shows everything addressed to the signed-in user — both their
 * targeted notifications (e.g. lineup reminders) and "all" broadcasts. Targeted
 * items are marked read when the panel opens.
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
    // Mark the user's own unread items read when the panel opens.
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
        className="relative grid h-10 w-10 place-items-center rounded-xl border-2 border-ink bg-cream transition-colors hover:bg-vyellow"
      >
        <Bell className="h-5 w-5" />
        {unread.length > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full border-2 border-ink bg-vred px-1 text-[10px] font-bold text-cream">
            {unread.length > 9 ? "9+" : unread.length}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute right-0 z-40 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-2xl border-4 border-ink bg-cream shadow-brutal">
            <div className="border-b-4 border-ink bg-vyellow px-4 py-2 text-sm font-bold uppercase">
              Notifications
            </div>
            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm font-medium text-ink/50">
                  No notifications yet.
                </p>
              ) : (
                items.map((n) => {
                  const body = (
                    <div
                      className={cn(
                        "border-b-2 border-ink/10 px-4 py-3 last:border-0",
                        n.userId === uid && !n.read && "bg-vyellow/30",
                      )}
                    >
                      <p className="text-sm font-bold">{n.title}</p>
                      <p className="text-xs font-medium text-ink/60">{n.body}</p>
                    </div>
                  );
                  return n.href ? (
                    <Link key={n.id} href={n.href} onClick={() => setOpen(false)}>
                      {body}
                    </Link>
                  ) : (
                    <div key={n.id}>{body}</div>
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
