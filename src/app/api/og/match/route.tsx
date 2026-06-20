import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

function hex(raw: string | null): string {
  if (!raw) return "#4f46e5";
  const cleaned = raw.replace(/^#/, "");
  return `#${cleaned.length === 3 || cleaned.length === 6 ? cleaned : "4f46e5"}`;
}

function fmtDmg(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

/**
 * Match story poster (1080×1920): match title + id, the two teams with their
 * scores (winner highlighted), and per-player highlights. Each player's kills
 * and damage show as normal numbers, EXCEPT the highest value in each column,
 * which is rendered bold + highlighted.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const title = searchParams.get("title") ?? "Match";
  const code = searchParams.get("code") ?? "";
  const map = searchParams.get("map") ?? "";
  const t1 = searchParams.get("t1") ?? "Team 1";
  const t2 = searchParams.get("t2") ?? "Team 2";
  const s1 = searchParams.get("s1") ?? "";
  const s2 = searchParams.get("s2") ?? "";
  const win = searchParams.get("win") ?? "0"; // "1" | "2" | "0"
  const color = hex(searchParams.get("color"));

  const names = searchParams.getAll("pn");
  const kills = searchParams.getAll("pk").map((v) => Number(v) || 0);
  const dmg = searchParams.getAll("pd").map((v) => Number(v) || 0);
  const players = names.slice(0, 8).map((n, i) => ({
    name: n,
    kills: kills[i] ?? 0,
    dmg: dmg[i] ?? 0,
  }));
  const maxK = Math.max(0, ...players.map((p) => p.kills));
  const maxD = Math.max(0, ...players.map((p) => p.dmg));

  let fontData: ArrayBuffer | null = null;
  try {
    fontData = await fetch(
      "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7W08.woff2",
    ).then((r) => r.arrayBuffer());
  } catch {
    /* system font fallback */
  }

  const teamBox = (name: string, score: string, isWinner: boolean) => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "10px",
        flex: 1,
        padding: "24px 12px",
        background: isWinner ? `${color}33` : "rgba(255,255,255,0.05)",
        border: isWinner ? `4px solid ${color}` : "2px solid rgba(255,255,255,0.12)",
        borderRadius: "24px",
      }}
    >
      <span style={{ fontSize: "34px", fontWeight: 700, color: "#fff", textAlign: "center", lineHeight: 1.1 }}>{name}</span>
      {score ? (
        <span style={{ fontSize: "72px", fontWeight: 700, color: isWinner ? color : "rgba(255,255,255,0.85)", lineHeight: 1 }}>{score}</span>
      ) : null}
      {isWinner ? (
        <span style={{ fontSize: "16px", fontWeight: 700, color, letterSpacing: "4px", textTransform: "uppercase" }}>Winner</span>
      ) : null}
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
          background: `linear-gradient(160deg, #0f0f0f 0%, ${color}22 45%, #0f0f0f 88%)`,
          fontFamily: fontData ? "Inter" : "system-ui",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "6px", background: color }} />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "56px 64px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "52px", height: "52px", background: "#ffd93d", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "20px", fontWeight: 700, color: "#0f0f0f" }}>VF</span>
            </div>
            <span style={{ fontSize: "30px", fontWeight: 700, color: "#fff", letterSpacing: "-1px" }}>VFFT</span>
          </div>
          {map ? (
            <span style={{ fontSize: "16px", fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "3px", textTransform: "uppercase" }}>{map}</span>
          ) : null}
        </div>

        {/* Match title */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "48px", padding: "0 48px" }}>
          <span style={{ fontSize: "72px", fontWeight: 700, color: "#fff", letterSpacing: "-3px", textAlign: "center", lineHeight: 1.05 }}>{title}</span>
          {code ? (
            <span style={{ fontSize: "20px", fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "2px", marginTop: "10px" }}>ID: {code}</span>
          ) : null}
        </div>

        {/* Scoreline */}
        <div style={{ display: "flex", alignItems: "center", gap: "24px", padding: "44px 56px 0" }}>
          {teamBox(t1, s1, win === "1")}
          <span style={{ fontSize: "40px", fontWeight: 700, color: "rgba(255,255,255,0.4)" }}>VS</span>
          {teamBox(t2, s2, win === "2")}
        </div>

        {/* Highlights */}
        {players.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", padding: "56px 56px 0" }}>
            <span style={{ fontSize: "22px", fontWeight: 700, color: "rgba(255,255,255,0.45)", letterSpacing: "5px", textTransform: "uppercase", marginBottom: "20px" }}>
              Highlights
            </span>
            {/* column headers */}
            <div style={{ display: "flex", alignItems: "center", padding: "0 24px 12px" }}>
              <span style={{ flex: 1, fontSize: "18px", fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "2px", textTransform: "uppercase" }}>Player</span>
              <span style={{ width: "140px", textAlign: "center", fontSize: "18px", fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "2px", textTransform: "uppercase" }}>Kills</span>
              <span style={{ width: "180px", textAlign: "center", fontSize: "18px", fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "2px", textTransform: "uppercase" }}>DMG</span>
            </div>
            {[...players]
              .sort((a, b) => b.kills - a.kills)
              .map((p, i) => {
                const kTop = maxK > 0 && p.kills === maxK;
                const dTop = maxD > 0 && p.dmg === maxD;
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "20px 24px",
                      borderBottom: "2px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <span style={{ flex: 1, fontSize: "32px", fontWeight: 700, color: "#fff" }}>{p.name}</span>
                    <span
                      style={{
                        width: "140px",
                        textAlign: "center",
                        fontSize: kTop ? "40px" : "32px",
                        fontWeight: 700,
                        color: kTop ? "#0f0f0f" : "rgba(255,255,255,0.85)",
                        background: kTop ? "#ffd93d" : "transparent",
                        borderRadius: "12px",
                        padding: kTop ? "2px 0" : "0",
                      }}
                    >
                      {p.kills}
                    </span>
                    <span
                      style={{
                        width: "180px",
                        textAlign: "center",
                        fontSize: dTop ? "40px" : "32px",
                        fontWeight: 700,
                        color: dTop ? "#0f0f0f" : "rgba(255,255,255,0.85)",
                        background: dTop ? "#ffd93d" : "transparent",
                        borderRadius: "12px",
                        padding: dTop ? "2px 0" : "0",
                      }}
                    >
                      {fmtDmg(p.dmg)}
                    </span>
                  </div>
                );
              })}
          </div>
        ) : null}

        <div style={{ flex: 1 }} />

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 64px 64px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "8px", height: "40px", background: color, borderRadius: "4px" }} />
            <span style={{ fontSize: "24px", fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>Match Highlights</span>
          </div>
          <span style={{ fontSize: "16px", fontWeight: 700, color: "rgba(255,255,255,0.25)", letterSpacing: "4px", textTransform: "uppercase" }}>vfft.in</span>
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
