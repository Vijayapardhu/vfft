import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { signInWithGoogle, signOut } from "@/firebase/auth";
import type { FirebaseUser } from "@/firebase/auth";
import { COLLECTIONS, typedDoc } from "@/firebase/collections";
import { db } from "@/firebase/firestore";
import type { User } from "@/types";

/**
 * Ensure a `users/{uid}` document exists for a freshly authenticated account.
 *
 * New accounts are created with the LEAST-privileged role ("guest"). They are
 * promoted to "player" only after completing registration, and to elevated
 * roles only by an admin. Firestore Rules must lock the `role` field so a
 * client can never escalate its own privileges (servers decide — ADB §16).
 *
 * NOTE: For full server-authority this bootstrap should move to a Firebase
 * Auth `onCreate` Cloud Function once Functions are deployed (Phase 4).
 */
export async function ensureUserDocument(
  fbUser: FirebaseUser,
): Promise<User | null> {
  const typedRef = typedDoc<User>(COLLECTIONS.users, fbUser.uid);
  const plainRef = doc(db, COLLECTIONS.users, fbUser.uid);
  const snap = await getDoc(typedRef);

  if (snap.exists()) {
    await updateDoc(plainRef, {
      lastLoginAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      // keep the cached display fields fresh from Google
      displayName: fbUser.displayName,
      photoURL: fbUser.photoURL,
      email: fbUser.email,
    });
    return snap.data();
  }

  await setDoc(plainRef, {
    uid: fbUser.uid,
    email: fbUser.email,
    displayName: fbUser.displayName,
    photoURL: fbUser.photoURL,
    role: "guest",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
  });

  const created = await getDoc(typedRef);
  return created.exists() ? created.data() : null;
}

export { signInWithGoogle, signOut };
