import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth";
import { broadcastNotification, sendUserNotification } from "@/server/notify";

export const runtime = "nodejs";

/**
 * Admin sends a notification. Targeted (with `userId`) → Firestore doc + RTDB
 * inbox + web push to that user. Broadcast (no `userId`) → one "all" doc that
 * appears in every user's bell + a batched FCM web-push to every device.
 */
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Admin only." }, { status: 403 });

  const body = await req.json().catch(() => null);
  const userId = typeof body?.userId === "string" ? body.userId : null;
  const type = typeof body?.type === "string" ? body.type : "general";
  const title = body?.title;
  const message = body?.body;
  const href = typeof body?.href === "string" ? body.href : undefined;
  const imageUrl = typeof body?.imageUrl === "string" && body.imageUrl ? body.imageUrl : undefined;

  if (typeof title !== "string" || typeof message !== "string" || !title || !message) {
    return NextResponse.json({ error: "title and body are required." }, { status: 400 });
  }

  try {
    if (userId) {
      const id = await sendUserNotification({ userId, type, title, body: message, href, imageUrl });
      return NextResponse.json({ ok: true, id });
    }
    const { id, pushed } = await broadcastNotification({ type, title, body: message, href, imageUrl });
    return NextResponse.json({ ok: true, id, pushed });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to send notification." },
      { status: 400 },
    );
  }
}
