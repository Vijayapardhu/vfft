import { NextResponse } from "next/server";
import { findDueLineupMatches, remindMatchLineups } from "@/server/lineupReminders";

export const runtime = "nodejs";

/**
 * Scheduled job: ~30 min before kickoff, ping both teams to submit their lineup.
 * Wire this to a scheduler (Vercel Cron via vercel.json, or any external cron
 * hitting this URL every ~10 min). Protected by CRON_SECRET when set.
 */
async function handle(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
  }

  try {
    const due = await findDueLineupMatches(Date.now());
    let notified = 0;
    for (const matchId of due) {
      const res = await remindMatchLineups(matchId);
      notified += res.notified;
    }
    return NextResponse.json({ ok: true, matches: due.length, notified });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Cron failed." },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  return handle(req);
}

export async function POST(req: Request) {
  return handle(req);
}
