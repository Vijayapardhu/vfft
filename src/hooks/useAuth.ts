"use client";

import { isAdmin as roleIsAdmin } from "@/constants/roles";
import { useAuthStore } from "@/store/authStore";

/**
 * Read-only view of the current session for components. Derived booleans are
 * convenience only — real authorization is enforced server-side.
 */
export function useAuth() {
  const status = useAuthStore((s) => s.status);
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);

  return {
    status,
    firebaseUser,
    user,
    role,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    isAdmin: roleIsAdmin(role),
  };
}
