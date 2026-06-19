import { create } from "zustand";
import type { FirebaseUser } from "@/firebase/auth";
import type { User, UserRole } from "@/types";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthState {
  status: AuthStatus;
  /** Raw Firebase Auth user. */
  firebaseUser: FirebaseUser | null;
  /** Our `users/{uid}` profile document. */
  user: User | null;
  /** Convenience mirror of `user.role` (defaults to guest). */
  role: UserRole;

  setAuth: (firebaseUser: FirebaseUser | null, user: User | null) => void;
  setStatus: (status: AuthStatus) => void;
  reset: () => void;
}

/**
 * Auth store (TRD §12). Holds session state only. It NEVER holds privileges
 * the client can act on unilaterally — every sensitive action is re-verified
 * by Firestore Rules / Cloud Functions.
 */
export const useAuthStore = create<AuthState>((set) => ({
  status: "loading",
  firebaseUser: null,
  user: null,
  role: "guest",

  setAuth: (firebaseUser, user) =>
    set({
      firebaseUser,
      user,
      role: user?.role ?? "guest",
      status: firebaseUser ? "authenticated" : "unauthenticated",
    }),

  setStatus: (status) => set({ status }),

  reset: () =>
    set({
      firebaseUser: null,
      user: null,
      role: "guest",
      status: "unauthenticated",
    }),
}));
