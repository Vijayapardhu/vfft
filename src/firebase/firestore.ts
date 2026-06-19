import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { emulatorConnectOnce, firebaseApp, useEmulator } from "./config";

/** Cloud Firestore instance (TRD §8). */
export const db = getFirestore(firebaseApp);

if (useEmulator && emulatorConnectOnce("firestore")) {
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}
