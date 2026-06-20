"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { logPageView } from "@/firebase/analytics";

/**
 * Reports a GA4 `page_view` on every client-side navigation. Lives behind a
 * Suspense boundary because `useSearchParams` opts the subtree into client
 * rendering — this keeps the rest of the layout statically renderable.
 */
function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;
    const qs = searchParams?.toString();
    void logPageView(qs ? `${pathname}?${qs}` : pathname);
  }, [pathname, searchParams]);

  return null;
}

export function Analytics() {
  return (
    <Suspense fallback={null}>
      <PageViewTracker />
    </Suspense>
  );
}
