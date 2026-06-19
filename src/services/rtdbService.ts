"use client";

import { onDisconnect, ref, remove, set, update } from "firebase/database";
import { rtdb } from "@/firebase/rtdb";
import { apiPost } from "./apiClient";

// === PRESENCE OPERATIONS ===

export function setUserOnline(
  userId: string,
  displayName: string,
  photoURL: string,
): void {
  const userRef = ref(rtdb, `presence/${userId}`);
  onDisconnect(userRef).remove();
  set(userRef, {
    displayName,
    photoURL,
    lastOnline: Date.now(),
  });
}

export function setUserOffline(userId: string): void {
  const userRef = ref(rtdb, `presence/${userId}`);
  set(userRef, null);
}

// === NOTIFICATION OPERATIONS ===

export function sendRealtimeNotification(
  userId: string,
  notification: {
    id: string;
    title: string;
    message: string;
    type: string;
    read: boolean;
    createdAt: number;
    link?: string;
  },
): void {
  const notifRef = ref(rtdb, `notifications/${userId}/${notification.id}`);
  set(notifRef, notification);
}

export async function sendBulkNotifications(
  userIds: string[],
  notification: {
    id: string;
    title: string;
    message: string;
    type: string;
    read: boolean;
    createdAt: number;
    link?: string;
  },
): Promise<void> {
  const updates: Record<string, unknown> = {};
  for (const uid of userIds) {
    updates[`notifications/${uid}/${notification.id}`] = notification;
  }
  await update(ref(rtdb), updates);
}

export function markNotificationRead(userId: string, notifId: string): void {
  const notifRef = ref(rtdb, `notifications/${userId}/${notifId}`);
  update(notifRef, { read: true });
}

export function clearUserNotifications(userId: string): void {
  const notifsRef = ref(rtdb, `notifications/${userId}`);
  set(notifsRef, null);
}

export function deleteNotification(userId: string, notifId: string): void {
  const notifRef = ref(rtdb, `notifications/${userId}/${notifId}`);
  remove(notifRef);
}

// === COUNTDOWN OPERATIONS ===

export function setCountdown(
  id: string,
  data: {
    label: string;
    targetTime: number;
    type: "auction" | "match" | "season";
    metadata?: Record<string, string>;
  },
): void {
  const countdownRef = ref(rtdb, `countdowns/${id}`);
  set(countdownRef, data);
}

export function clearCountdown(id: string): void {
  const countdownRef = ref(rtdb, `countdowns/${id}`);
  set(countdownRef, null);
}

// === AUCTION OPERATIONS (proxied via API) ===

export async function setCurrentAuction(data: {
  playerId: string;
  seasonId: string;
  basePrice: number;
  durationSeconds?: number;
}) {
  return apiPost<{ ok: true; auctionId: string }>("/api/auction/start", data);
}

export async function updateAuctionBid(auctionId: string, amount: number) {
  return apiPost<{ ok: true; highestBid: number }>("/api/auction/bid", {
    auctionId,
    amount,
  });
}

export async function clearCurrentAuction(auctionId: string) {
  return apiPost<{ ok: true; status: string }>("/api/auction/finalize", {
    auctionId,
  });
}

// === MATCH STATE OPERATIONS (proxied via API) ===

export async function updateMatchScore(
  matchId: string,
  team1Score: number,
  team2Score: number,
) {
  return apiPost("/api/admin/match/score", { matchId, team1Score, team2Score });
}

export async function setMatchState(data: {
  matchId: string;
  status: string;
  map?: string;
  roomId?: string;
  password?: string;
}) {
  return apiPost("/api/admin/match/state", data);
}

export async function clearMatchState(matchId: string) {
  return apiPost("/api/admin/match/state", { matchId, action: "clear" });
}
