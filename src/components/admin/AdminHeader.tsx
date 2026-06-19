"use client";

import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export function AdminHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  const { user } = useAuth();

  return (
    <div
      className={cn(
        "mb-6 flex flex-wrap items-center justify-between gap-3",
        "border-b-4 border-ink/10 pb-4",
      )}
    >
      <div>
        <h1 className="text-2xl font-bold uppercase tracking-tight sm:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-0.5 text-sm font-medium text-ink/60">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        {action}
        {user && (
          <div className="flex items-center gap-2 rounded-2xl border-2 border-ink bg-cream px-3 py-1.5 text-sm font-bold">
            <span className="h-2 w-2 rounded-full bg-vgreen" />
            {user.displayName ?? user.email}
          </div>
        )}
      </div>
    </div>
  );
}
