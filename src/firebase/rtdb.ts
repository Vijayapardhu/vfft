import { connectDatabaseEmulator, getDatabase } from "firebase/database";
import { emulatorConnectOnce, firebaseApp, useEmulator } from "./config";

/**
 * Realtime Database client — the LIVE engine (auction/current, matchState,
 * notifications, presence, leaderboards). Clients only READ here via realtime
 * listeners; all writes go through the server (Admin SDK in /api routes).
 */
export const rtdb = getDatabase(firebaseApp);

if (useEmulator && emulatorConnectOnce("rtdb")) {
  connectDatabaseEmulator(rtdb, "127.0.0.1", 9000);
}
