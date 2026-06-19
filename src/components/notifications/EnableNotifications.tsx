"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFcm } from "@/hooks/useFcm";

/** Small opt-in button for web push. Hides itself once granted/unsupported. */
export function EnableNotifications() {
  const { permission, enable, busy } = useFcm();
  if (permission === "granted" || permission === "unsupported" || permission === "denied") {
    return null;
  }
  return (
    <Button variant="cream" size="sm" disabled={busy} onClick={enable}>
      <Bell className="h-4 w-4" />
      {busy ? "Enabling…" : "Enable notifications"}
    </Button>
  );
}
