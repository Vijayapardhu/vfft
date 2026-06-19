"use client";

import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { useSettings } from "@/hooks/useSettings";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  const { data: settings } = useSettings();
  const logo = settings?.websiteLogo;

  return (
    <Link
      href={ROUTES.home}
      className={cn("inline-flex items-center gap-2", className)}
      aria-label="VFFT home"
    >
      {logo ? (
        // Admin-managed brand logo (Settings → Branding).
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo}
          alt="VFFT"
          className="h-9 w-9 rounded-xl border-4 border-ink object-cover shadow-brutal-xs"
        />
      ) : (
        <span className="grid h-9 w-9 place-items-center rounded-xl border-4 border-ink bg-vred text-sm font-bold shadow-brutal-xs">
          VF
        </span>
      )}
      <span className="text-xl font-bold uppercase tracking-tight">VFFT</span>
    </Link>
  );
}
