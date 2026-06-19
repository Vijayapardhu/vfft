import {
  connectFunctionsEmulator,
  getFunctions,
  httpsCallable,
} from "firebase/functions";
import { emulatorConnectOnce, firebaseApp, useEmulator } from "./config";

const region =
  process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_REGION || "us-central1";

/**
 * Callable Cloud Functions client (TRD §8). This is the ONLY path clients use
 * for critical operations — auctions, purse, transfers, results, leaderboards,
 * achievements (ADB §16). Clients request; servers decide.
 */
export const functions = getFunctions(firebaseApp, region);

if (useEmulator && emulatorConnectOnce("functions")) {
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
}

/** Typed wrapper around httpsCallable for a server-authoritative operation. */
export function callable<Request, Response>(name: string) {
  const fn = httpsCallable<Request, Response>(functions, name);
  return async (data: Request): Promise<Response> => {
    const result = await fn(data);
    return result.data;
  };
}
