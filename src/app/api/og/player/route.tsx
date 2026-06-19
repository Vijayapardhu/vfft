import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

/* Achievement type → display config */
const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  kills: { label: "Kill King", color: "#ff6b6b", bg: "rgba(255,107,107,0.15)" },
  damage: { label: "Damage King", color: "#c4b5fd", bg: "rgba(196,181,253,0.15)" },
  headshots: { label: "Headshot Master", color: "#4ade80", bg: "rgba(74,222,128,0.15)" },
  mvp: { label: "Match MVP", color: "#ffd93d", bg: "rgba(255,217,61,0.15)" },
  potd: { label: "Player Of The Day", color: "#ffd93d", bg: "rgba(255,217,61,0.15)" },
  champion: { label: "Season Champion", color: "#ffd93d", bg: "rgba(255,217,61,0.2)" },
};

function hex(raw: string | null): string {
  if (!raw) return "#4f46e5";
  const cleaned = raw.replace(/^#/, "");
  return `#${cleaned.length === 3 || cleaned.length === 6 ? cleaned : "4f46e5"}`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const ign = searchParams.get("ign") ?? "Player";
  const type = searchParams.get("type") ?? "kills";
  const value = searchParams.get("value") ?? "0";
  const unit = searchParams.get("unit") ?? "";
  const team = searchParams.get("team") ?? "VFFT";
  const teamColor = hex(searchParams.get("color"));
  const kills = searchParams.get("kills") ?? "0";
  const damage = searchParams.get("damage") ?? "0";
  const hs = searchParams.get("hs") ?? "0";
  const photoUrl = searchParams.get("photo");

  const cfg = (TYPE_CONFIG[type] ?? TYPE_CONFIG["kills"]) as {
    label: string;
    color: string;
    bg: string;
  };

  /* Load font — falls back gracefully if CDN is unavailable */
  let fontData: ArrayBuffer | null = null;
  try {
    fontData = await fetch(
      "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7W08.woff2",
    ).then((r) => r.arrayBuffer());
  } catch {
    /* continue without custom font */
  }

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "1080px",
          height: "1920px",
          background: `linear-gradient(150deg, #0f0f0f 0%, ${teamColor}22 40%, #0f0f0f 80%)`,
          fontFamily: fontData ? "Inter" : "system-ui",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background grid texture */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Top accent line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: teamColor,
          }}
        />

        {/* VFFT header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "60px 64px 0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                background: "#ffd93d",
                borderRadius: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: "22px", fontWeight: 700, color: "#0f0f0f" }}>
                VF
              </span>
            </div>
            <span
              style={{
                fontSize: "32px",
                fontWeight: 700,
                color: "#ffffff",
                letterSpacing: "-1px",
              }}
            >
              VFFT
            </span>
          </div>
          <span
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "rgba(255,255,255,0.4)",
              letterSpacing: "2px",
              textTransform: "uppercase",
            }}
          >
            Free Fire Tournament
          </span>
        </div>

        {/* Achievement badge */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "80px",
          }}
        >
          <div
            style={{
              padding: "14px 40px",
              background: cfg.bg,
              border: `3px solid ${cfg.color}`,
              borderRadius: "100px",
              fontSize: "20px",
              fontWeight: 700,
              color: cfg.color,
              letterSpacing: "6px",
              textTransform: "uppercase",
            }}
          >
            {cfg.label}
          </div>
        </div>

        {/* Player photo */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "64px",
          }}
        >
          <div
            style={{
              width: "300px",
              height: "300px",
              borderRadius: "50%",
              overflow: "hidden",
              border: `6px solid ${teamColor}`,
              background: "rgba(255,255,255,0.05)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoUrl}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                alt=""
              />
            ) : (
              <span style={{ fontSize: "80px", color: "rgba(255,255,255,0.2)" }}>
                ?
              </span>
            )}
          </div>
        </div>

        {/* Player IGN */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "40px",
            padding: "0 64px",
          }}
        >
          <span
            style={{
              fontSize: "88px",
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: "-4px",
              textAlign: "center",
              lineHeight: 1,
            }}
          >
            {ign}
          </span>
        </div>

        {/* Big stat value */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: "48px",
          }}
        >
          <span
            style={{
              fontSize: value.length > 4 ? "100px" : "128px",
              fontWeight: 700,
              color: cfg.color,
              letterSpacing: "-6px",
              lineHeight: 1,
            }}
          >
            {value}
          </span>
          {unit && (
            <span
              style={{
                fontSize: "24px",
                fontWeight: 700,
                color: "rgba(255,255,255,0.4)",
                letterSpacing: "8px",
                textTransform: "uppercase",
                marginTop: "8px",
              }}
            >
              {unit}
            </span>
          )}
        </div>

        {/* Stats row */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "48px",
            marginTop: "64px",
          }}
        >
          {[
            { label: "Kills", v: kills },
            { label: "Damage", v: damage },
            { label: "Headshots", v: hs },
          ].map(({ label, v }) => (
            <div
              key={label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "6px",
                padding: "20px 32px",
                background: "rgba(255,255,255,0.05)",
                border: "2px solid rgba(255,255,255,0.1)",
                borderRadius: "20px",
              }}
            >
              <span
                style={{ fontSize: "40px", fontWeight: 700, color: "#ffffff", lineHeight: 1 }}
              >
                {v}
              </span>
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.4)",
                  letterSpacing: "3px",
                  textTransform: "uppercase",
                }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Team name + watermark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 64px 72px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "40px",
                background: teamColor,
                borderRadius: "4px",
              }}
            />
            <span
              style={{
                fontSize: "24px",
                fontWeight: 700,
                color: "rgba(255,255,255,0.7)",
                letterSpacing: "1px",
              }}
            >
              {team}
            </span>
          </div>
          <span
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "rgba(255,255,255,0.25)",
              letterSpacing: "4px",
              textTransform: "uppercase",
            }}
          >
            vfft.in
          </span>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1920,
      ...(fontData
        ? {
            fonts: [
              {
                name: "Inter",
                data: fontData,
                weight: 700,
                style: "normal",
              },
            ],
          }
        : {}),
    },
  );
}
