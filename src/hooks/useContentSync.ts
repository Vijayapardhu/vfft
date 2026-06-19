"use client";

import { useState } from "react";
import { auth } from "@/firebase/auth";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await auth.currentUser?.getIdToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function useContentSync() {
  const [isSyncing, setIsSyncing] = useState(false);

  async function syncHomeContent(): Promise<void> {
    setIsSyncing(true);
    try {
      await fetch("/api/admin/sync-content", {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ type: "homeContent" }),
      });
    } finally {
      setIsSyncing(false);
    }
  }

  async function syncSettings(): Promise<void> {
    setIsSyncing(true);
    try {
      await fetch("/api/admin/sync-content", {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ type: "settings" }),
      });
    } finally {
      setIsSyncing(false);
    }
  }

  return { syncHomeContent, syncSettings, isSyncing };
}
