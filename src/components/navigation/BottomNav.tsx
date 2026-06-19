"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { MOBILE_MORE_NAV, MOBILE_PRIMARY_NAV } from "@/constants/navigation";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {moreOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" aria-modal>
          <div
            className="absolute inset-0 bg-ink/30"
            aria-hidden
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute inset-x-3 bottom-[5.5rem] rounded-3xl border-4 border-ink bg-cream p-3 shadow-brutal-lg">
            <div className="grid grid-cols-3 gap-2">
              {MOBILE_MORE_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className="flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-2xl border-2 border-ink bg-cream p-2 text-center text-[11px] font-bold uppercase hover:bg-vyellow"
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t-4 border-ink bg-cream lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5">
          {MOBILE_PRIMARY_NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-h-[60px] flex-col items-center justify-center gap-1 text-[11px] font-bold uppercase transition-colors",
                  active ? "text-ink" : "text-ink/45",
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen((o) => !o)}
            aria-expanded={moreOpen}
            aria-label="More"
            className={cn(
              "flex min-h-[60px] flex-col items-center justify-center gap-1 text-[11px] font-bold uppercase transition-colors",
              moreOpen ? "text-ink" : "text-ink/45",
            )}
          >
            {moreOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            More
          </button>
        </div>
      </nav>
    </>
  );
}
