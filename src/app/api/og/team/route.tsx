import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

function hex(raw: string | null): string {
  if (!raw) return "#4f46e5";
  const cleaned = raw.replace(/^#/, "");
  return `#${cleaned.length === 3 || cleaned.length === 6 ? cleaned : "4f46e5"}`;
}

function money(raw: string): string {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return "—";
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

/**
 * Team story poster (1080×1920). Shows the franchise with its leader (labelled
 * LEADER, no price) and the rest of the squad with each player's auction bid
 * value, name and photo. Data is passed in the query (parallel `pn`/`pp`/`pi`
 * arrays) so the route stays at the edge with no DB access.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const team = searchParams.get("team") ?? "VFFT";
  const color = hex(searchParams.get("color"));
  const color2 = hex(searchParams.get("color2"));
  const logo = searchParams.get("logo");
  const banner = searchParams.get("banner");
  const leaderName = searchParams.get("lname") ?? "";
  const leaderPhoto = searchParams.get("lphoto");

  const names = searchParams.getAll("pn");
  const prices = searchParams.getAll("pp");
  const photos = searchParams.getAll("pi");
  const players = names.slice(0, 9).map((n, i) => ({
    name: n,
    price: money(prices[i] ?? "0"),
    photo: photos[i] || null,
  }));

  let fontData: ArrayBuffer | null = null;
  try {
    fontData = await fetch(
      "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7W08.woff2",
    ).then((r) => r.arrayBuffer());
  } catch {
    /* fall back to system font */
  }

  const avatar = (src: string | null, size: number, ring: string) => (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        overflow: "hidden",
        border: `${Math.max(4, size / 50)}px solid ${ring}`,
        background: "rgba(255,255,255,0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
      ) : (
        <span style={{ fontSize: `${size / 3}px`, color: "rgba(255,255,255,0.25)" }}>?</span>
      )}
    </div>
  );

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "1080px",
          height: "1920px",
          background: "#0f0f0f",
          fontFamily: fontData ? "Inter" : "system-ui",
          position: "relative",
        }}
      >
        {/* Team banner background (cropped to 9:16) */}
        {banner ? (
          <div style={{ position: "absolute", inset: 0, display: "flex" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={banner} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
          </div>
        ) : null}
        {/* Readability + brand-colour overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: banner
              ? `linear-gradient(180deg, rgba(15,15,15,0.78) 0%, ${color}33 45%, rgba(15,15,15,0.94) 100%)`
              : `linear-gradient(160deg, #0f0f0f 0%, ${color}22 45%, ${color2}18 70%, #0f0f0f 90%)`,
          }}
        />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "6px", background: color }} />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "56px 64px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "52px", height: "52px", background: "#ffd93d", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "20px", fontWeight: 700, color: "#0f0f0f" }}>VF</span>
            </div>
            <span style={{ fontSize: "30px", fontWeight: 700, color: "#fff", letterSpacing: "-1px" }}>VFFT</span>
          </div>
          <span style={{ fontSize: "16px", fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "3px", textTransform: "uppercase" }}>
            Team Squad
          </span>
        </div>

        {/* Team identity */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "48px", padding: "0 64px" }}>
          {logo && avatar(logo, 180, color)}
          <span style={{ fontSize: "76px", fontWeight: 700, color: "#fff", letterSpacing: "-3px", textAlign: "center", lineHeight: 1.05, marginTop: "24px" }}>
            {team}
          </span>
        </div>

        {/* Leader */}
        {leaderName ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "44px" }}>
            <div style={{ padding: "8px 32px", background: "rgba(255,217,61,0.16)", border: "3px solid #ffd93d", borderRadius: "100px", fontSize: "20px", fontWeight: 700, color: "#ffd93d", letterSpacing: "6px", textTransform: "uppercase", marginBottom: "20px" }}>
              Leader
            </div>
            {avatar(leaderPhoto, 220, "#ffd93d")}
            <span style={{ fontSize: "52px", fontWeight: 700, color: "#fff", marginTop: "18px", letterSpacing: "-1px" }}>{leaderName}</span>
          </div>
        ) : null}

        {/* Squad */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "32px", padding: "48px 56px 0" }}>
          {players.map((p, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "280px",
                padding: "24px 16px",
                background: "rgba(255,255,255,0.06)",
                border: `3px solid ${color2}66`,
                borderRadius: "28px",
              }}
            >
              {avatar(p.photo, 150, color)}
              <span style={{ fontSize: "34px", fontWeight: 700, color: "#fff", marginTop: "14px", letterSpacing: "-1px", textAlign: "center", maxWidth: "248px", overflow: "hidden" }}>
                {p.name}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "12px", padding: "8px 20px", background: "#ffd93d", borderRadius: "100px" }}>
                <span style={{ fontSize: "28px", fontWeight: 700, color: "#0f0f0f" }}>{p.price}</span>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "rgba(15,15,15,0.6)", letterSpacing: "2px" }}>COINS</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 64px 64px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "8px", height: "40px", background: color, borderRadius: "4px" }} />
            <span style={{ fontSize: "24px", fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>Built in the Auction</span>
          </div>
          <span style={{ fontSize: "16px", fontWeight: 700, color: "rgba(255,255,255,0.25)", letterSpacing: "4px", textTransform: "uppercase" }}>
            vfft.in
          </span>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1920,
      ...(fontData ? { fonts: [{ name: "Inter", data: fontData, weight: 700 as const, style: "normal" as const }] } : {}),
    },
  );
}
