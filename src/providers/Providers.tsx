"use client";

import { AuthProvider } from "./AuthProvider";
import { PresenceProvider } from "./PresenceProvider";
import { SeasonProvider } from "./SeasonProvider";

/**
 * Single client-side provider tree mounted by the root layout. Add future
 * cross-cutting providers (theme, query client, etc.) here.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SeasonProvider>
        <PresenceProvider>{children}</PresenceProvider>
      </SeasonProvider>
    </AuthProvider>
  );
}
