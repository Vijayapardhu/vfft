import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth";
import { adminRtdb } from "@/server/firebaseAdmin";

export const runtime = "nodejs";

/** Admin: wipe auction/current + feed from RTDB so the board shows "no lot". */
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Admin only." }, { status: 403 });

  await adminRtdb().ref("auction/current").set(null);
  await adminRtdb().ref("auction/feed").set(null);

  return NextResponse.json({ ok: true });
}
