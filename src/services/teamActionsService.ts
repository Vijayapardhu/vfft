"use client";

import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth } from "@/firebase/auth";
import { COLLECTIONS } from "@/firebase/collections";
import { db } from "@/firebase/firestore";
import { apiPost } from "./apiClient";

/**
 * Raise a dispute (SRS §23). A direct client write — Firestore Rules allow an
 * authenticated user to create a dispute only with raisedBy == their own uid.
 */
export async function raiseDispute(input: {
  seasonId: string;
  matchId: string;
  reason: string;
}) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("You must be signed in.");
  await addDoc(collection(db, COLLECTIONS.disputes), {
    seasonId: input.seasonId,
    matchId: input.matchId,
    raisedBy: uid,
    reason: input.reason,
    status: "open",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/** Request an emergency substitution (server validates squad + timing). */
export function requestSubstitution(input: {
  matchId: string;
  outPlayerId: string;
  inPlayerId: string;
  reason: string;
}) {
  return apiPost<{ ok: true }>("/api/team/substitution", input);
}
