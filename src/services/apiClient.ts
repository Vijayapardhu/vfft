"use client";

import { auth } from "@/firebase/auth";

/**
 * POST to a server Route Handler with the current user's Firebase ID token
 * attached. Every server-authoritative action goes through here.
 */
export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const user = auth.currentUser;
  const token = user ? await user.getIdToken() : null;

  const res = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error((data.error as string) ?? "Request failed.");
  }
  return data as T;
}
