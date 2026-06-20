import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth";

export const runtime = "nodejs";

/**
 * Google Analytics (GA4) report for the admin dashboard. Mints a short-lived
 * OAuth token from the Firebase service account (no extra dependency) and calls
 * the GA4 Data API. Requires:
 *   1. GA4_PROPERTY_ID env (the NUMERIC property id, not the "G-..." tag).
 *   2. The Google Analytics Data API enabled on the project.
 *   3. The service-account email added as a Viewer on the GA4 property.
 * Degrades gracefully to { configured: false } with setup hints if not ready.
 */

interface ServiceAccount {
  client_email: string;
  private_key: string;
}

function loadServiceAccount(): ServiceAccount | null {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  if (!b64) return null;
  try {
    return JSON.parse(Buffer.from(b64, "base64").toString("utf8")) as ServiceAccount;
  } catch {
    return null;
  }
}

/** Sign a service-account JWT and exchange it for an access token. */
async function getAccessToken(sa: ServiceAccount, scope: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const enc = (obj: unknown) => Buffer.from(JSON.stringify(obj)).toString("base64url");
  const header = enc({ alg: "RS256", typ: "JWT" });
  const claims = enc({
    iss: sa.client_email,
    scope,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  });
  const signingInput = `${header}.${claims}`;
  const signature = crypto
    .createSign("RSA-SHA256")
    .update(signingInput)
    .sign(sa.private_key)
    .toString("base64url");
  const assertion = `${signingInput}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const data = (await res.json().catch(() => ({}))) as { access_token?: string; error_description?: string };
  if (!data.access_token) throw new Error(data.error_description ?? "Failed to mint access token.");
  return data.access_token;
}

type GaRow = { dimensionValues?: { value: string }[]; metricValues?: { value: string }[] };
type GaReport = { rows?: GaRow[] };

/** "20250620" → "Jun 20" (chart-friendly). */
function fmtDate(yyyymmdd: string): string {
  if (!/^\d{8}$/.test(yyyymmdd)) return yyyymmdd;
  const m = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = m[Number(yyyymmdd.slice(4, 6)) - 1] ?? "";
  return `${month} ${Number(yyyymmdd.slice(6, 8))}`;
}

export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Admin only." }, { status: 403 });

  const propertyId = process.env.GA4_PROPERTY_ID;
  const sa = loadServiceAccount();
  if (!propertyId) {
    return NextResponse.json({
      configured: false,
      reason: "Set GA4_PROPERTY_ID (the numeric GA4 property id) in your environment.",
    });
  }
  if (!sa) {
    return NextResponse.json({
      configured: false,
      reason: "FIREBASE_SERVICE_ACCOUNT_B64 is not set — the report uses it to authenticate.",
    });
  }

  const body = await req.json().catch(() => ({}));
  const days = typeof body?.days === "number" && body.days > 0 ? Math.min(body.days, 365) : 28;
  const startDate = `${days}daysAgo`;

  try {
    const token = await getAccessToken(sa, "https://www.googleapis.com/auth/analytics.readonly");

    const dateRanges = [{ startDate, endDate: "today" }];
    const res = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:batchRunReports`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [
            // 0 — headline totals
            {
              dateRanges,
              metrics: [
                { name: "activeUsers" },
                { name: "newUsers" },
                { name: "sessions" },
                { name: "screenPageViews" },
                { name: "averageSessionDuration" },
              ],
            },
            // 1 — active users by day (time series)
            {
              dateRanges,
              dimensions: [{ name: "date" }],
              metrics: [{ name: "activeUsers" }, { name: "screenPageViews" }],
              orderBys: [{ dimension: { dimensionName: "date" } }],
            },
            // 2 — top pages
            {
              dateRanges,
              dimensions: [{ name: "pagePath" }],
              metrics: [{ name: "screenPageViews" }],
              orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
              limit: 10,
            },
            // 3 — device split
            {
              dateRanges,
              dimensions: [{ name: "deviceCategory" }],
              metrics: [{ name: "activeUsers" }],
              orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
            },
          ],
        }),
      },
    );

    const json = (await res.json().catch(() => ({}))) as { reports?: GaReport[]; error?: { message?: string; status?: string } };
    if (!res.ok || json.error) {
      const msg = json.error?.message ?? `GA API error (${res.status}).`;
      const hint = /permission|denied|caller/i.test(msg)
        ? " — add the service-account email as a Viewer on the GA4 property and enable the Analytics Data API."
        : "";
      return NextResponse.json({ configured: false, reason: msg + hint });
    }

    const reports = json.reports ?? [];
    const totalsRow = reports[0]?.rows?.[0]?.metricValues ?? [];
    const num = (i: number) => Number(totalsRow[i]?.value ?? 0);

    const series = (reports[1]?.rows ?? []).map((r) => ({
      date: fmtDate(r.dimensionValues?.[0]?.value ?? ""),
      users: Number(r.metricValues?.[0]?.value ?? 0),
      views: Number(r.metricValues?.[1]?.value ?? 0),
    }));

    const topPages = (reports[2]?.rows ?? []).map((r) => ({
      path: r.dimensionValues?.[0]?.value ?? "",
      views: Number(r.metricValues?.[0]?.value ?? 0),
    }));

    const devices = (reports[3]?.rows ?? []).map((r) => ({
      name: r.dimensionValues?.[0]?.value ?? "",
      users: Number(r.metricValues?.[0]?.value ?? 0),
    }));

    return NextResponse.json({
      configured: true,
      days,
      totals: {
        activeUsers: num(0),
        newUsers: num(1),
        sessions: num(2),
        pageViews: num(3),
        avgSessionDuration: num(4), // seconds
      },
      series,
      topPages,
      devices,
    });
  } catch (e) {
    return NextResponse.json({
      configured: false,
      reason: e instanceof Error ? e.message : "Failed to fetch Google Analytics report.",
    });
  }
}
