import {
  GoogleAuthProvider,
  connectAuthEmulator,
  getAuth,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from "firebase/auth";
import { emulatorConnectOnce, firebaseApp, useEmulator } from "./config";

/** Firebase Auth instance. Google Sign-In ONLY (TRD §5) — no email/OTP/password. */
export const auth = getAuth(firebaseApp);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

if (useEmulator && emulatorConnectOnce("auth")) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
}

/** Open the Google Sign-In popup and resolve the authenticated user. */
export async function signInWithGoogle(): Promise<FirebaseUser> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export type { FirebaseUser };
