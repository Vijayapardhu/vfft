import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth";
import {
  syncHomeContentToRTDB,
  syncSettingsToRTDB,
} from "@/server/syncContent";

export const runtime = "nodejs";

/**
 * Admin-triggered sync from Firestore → Realtime Database.
 * Called after the admin saves home content or settings.
 */
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Admin only." }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const type: string | undefined = body?.type;

  try {
    if (!type || type === "homeContent") {
      await syncHomeContentToRTDB();
    }
    if (!type || type === "settings") {
      await syncSettingsToRTDB();
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Sync failed." },
      { status: 500 },
    );
  }
}
