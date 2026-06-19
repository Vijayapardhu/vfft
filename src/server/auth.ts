import "server-only";
import type { UserRole } from "@/types";
import { adminAuth, adminDb } from "./firebaseAdmin";

export interface AuthedUser {
  uid: string;
  role: UserRole;
  teamId: string | null;
  playerId: string | null;
}

/**
 * Verify the caller's Firebase ID token (sent as `Authorization: Bearer <token>`)
 * and load their role/team from `users/{uid}`. Returns null when unauthenticated.
 */
export async function authenticate(req: Request): Promise<AuthedUser | null> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;

  try {
    const decoded = await adminAuth().verifyIdToken(token);
    const snap = await adminDb().collection("users").doc(decoded.uid).get();
    const data = snap.data() ?? {};
    return {
      uid: decoded.uid,
      role: (data.role as UserRole) ?? "guest",
      teamId: (data.teamId as string | undefined) ?? null,
      playerId: (data.playerId as string | undefined) ?? null,
    };
  } catch {
    return null;
  }
}

/** Guard helper: returns the user if they are an admin, else null. */
export async function requireAdmin(req: Request): Promise<AuthedUser | null> {
  const user = await authenticate(req);
  return user && user.role === "admin" ? user : null;
}
