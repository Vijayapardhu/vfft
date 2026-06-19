"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/navigation/Logo";
import { Button } from "@/components/ui/button";
import { APP_TAGLINE } from "@/constants/app";
import { ROUTES } from "@/constants/routes";
import { signInWithGoogle } from "@/firebase/auth";
import { isFirebaseConfigured } from "@/firebase/config";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isAuthenticated) router.replace(ROUTES.dashboard);
  }, [isAuthenticated, router]);

  async function handleSignIn() {
    setError(null);
    setBusy(true);
    try {
      await signInWithGoogle();
      router.replace(ROUTES.dashboard);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Sign-in failed. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="bg-grid relative grid min-h-dvh place-items-center px-5 py-12">
      <div className="w-full max-w-sm rounded-3xl border-4 border-ink bg-cream p-7 shadow-brutal-lg">
        <div className="flex flex-col items-center gap-2 text-center">
          <Logo />
          <h1 className="mt-3 text-3xl">Enter the Arena</h1>
          <p className="text-sm font-medium text-ink/60">{APP_TAGLINE}</p>
        </div>

        {!isFirebaseConfigured && (
          <div className="mt-5 rounded-2xl border-4 border-ink bg-vyellow p-3 text-center text-sm font-bold">
            Firebase isn&apos;t configured yet. Add your credentials to
            <code className="mx-1 rounded bg-ink/10 px-1">.env.local</code>
            to enable sign-in.
          </div>
        )}

        <Button
          variant="ink"
          size="lg"
          className="mt-6 w-full"
          onClick={handleSignIn}
          disabled={busy || !isFirebaseConfigured}
        >
          {busy ? "Signing in…" : "Continue with Google"}
        </Button>

        {error && (
          <p className="mt-3 text-center text-sm font-bold text-vred">{error}</p>
        )}

        <p className="mt-6 text-center text-xs font-medium text-ink/50">
          Google Sign-In only. By continuing you agree to the{" "}
          <Link href={ROUTES.rules} className="font-bold underline">
            Rules
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
