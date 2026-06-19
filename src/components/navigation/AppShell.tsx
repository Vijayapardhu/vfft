"use client";

import { usePathname } from "next/navigation";
import { IntroSplash } from "@/components/fx/IntroSplash";
import { NoiseOverlay } from "@/components/fx/NoiseOverlay";
import { ScrollProgress } from "@/components/fx/ScrollProgress";
import { SmoothScroll } from "@/components/fx/SmoothScroll";
import { BottomNav } from "./BottomNav";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar";

/** Routes that render without the public chrome (their own full-screen layout). */
const BARE_PREFIXES = ["/login", "/admin"];

function isBare(pathname: string): boolean {
  return BARE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

/**
 * App chrome: top Navbar everywhere, Bottom Navigation on mobile/tablet.
 * The bottom bar is cleared by `pb-24` on the main content area.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (isBare(pathname)) return <>{children}</>;

  return (
    <div className="flex min-h-dvh flex-col">
      <IntroSplash />
      <SmoothScroll />
      <ScrollProgress />
      <NoiseOverlay />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <div className="pb-20 lg:pb-0" />
      <BottomNav />
    </div>
  );
}
