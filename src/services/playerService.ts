import {
  collection,
  doc,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { COLLECTIONS, playerDoc, playersCol } from "@/firebase/collections";
import { db } from "@/firebase/firestore";
import type { PlayerRole } from "@/types";

export interface CreatePlayerInput {
  uid: string;
  seasonId: string;
  realName: string;
  ign: string;
  freeFireUid: string;
  whatsappNumber: string;
  role: PlayerRole;
  device: string;
  photoURL: string | null;
}

/**
 * Submit a player registration (SRS §4). Creates a `pending` profile and links
 * it to the account, promoting the account from "guest" to "player".
 *
 * Firestore Rules must guarantee a user can only create their OWN player with
 * status "pending" and can only set role to "player" (never an elevated role).
 * Approval/rejection is admin-only and runs server-side.
 */
export async function createPlayerRegistration(
  input: CreatePlayerInput,
): Promise<string> {
  const batch = writeBatch(db);

  // Public profile (no PII).
  const playerRef = doc(collection(db, COLLECTIONS.players));
  batch.set(playerRef, {
    uid: input.uid,
    seasonId: input.seasonId,
    ign: input.ign,
    role: input.role,
    device: input.device,
    photoURL: input.photoURL,
    status: "pending",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Private contact PII, isolated to a subcollection.
  const contactRef = doc(db, COLLECTIONS.players, playerRef.id, "private", "contact");
  batch.set(contactRef, {
    uid: input.uid,
    realName: input.realName,
    freeFireUid: input.freeFireUid,
    whatsappNumber: input.whatsappNumber,
  });

  // Promote the account from "guest" to "player" and link the profile.
  batch.update(doc(db, COLLECTIONS.users, input.uid), {
    role: "player",
    playerId: playerRef.id,
    updatedAt: serverTimestamp(),
  });

  await batch.commit();
  return playerRef.id;
}

/** All players in a season (filter/sort client-side to avoid composite indexes). */
export function playersBySeasonQuery(seasonId: string) {
  return query(playersCol(), where("seasonId", "==", seasonId));
}

/** Players belonging to a specific team. */
export function playersByTeamQuery(teamId: string) {
  return query(playersCol(), where("teamId", "==", teamId));
}

/** The player profile linked to an account. */
export function playersByUidQuery(uid: string) {
  return query(playersCol(), where("uid", "==", uid));
}

export { playerDoc };
