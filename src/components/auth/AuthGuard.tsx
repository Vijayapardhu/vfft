"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FullScreenLoader } from "@/components/ui/spinner";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/hooks/useAuth";

/**
 * Client-side route protection. This is a UX convenience only — the real
 * security boundary is Firestore Rules + Cloud Functions (ADB §16). A user who
 * bypasses this guard still cannot read or write anything they're not allowed to.
 */
export function AuthGuard({
  children,
  requireAdmin = false,
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
}) {
  const { isLoading, isAuthenticated, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace(ROUTES.login);
      return;
    }
    if (requireAdmin && !isAdmin) {
      router.replace(ROUTES.home);
    }
  }, [isLoading, isAuthenticated, isAdmin, requireAdmin, router]);

  if (isLoading || !isAuthenticated || (requireAdmin && !isAdmin)) {
    return <FullScreenLoader />;
  }

  return <>{children}</>;
}
