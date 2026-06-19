import { AuthGuard } from "@/components/auth/AuthGuard";

/** Wraps all signed-in player routes with client-side route protection. */
export default function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
}
