import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "VFFT — Velangi Free Fire Tournament";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Default Open Graph / Twitter card image for link previews. */
export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#FFFDF5",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 160,
            height: 160,
            borderRadius: 28,
            background: "#FF6B6B",
            border: "10px solid #000",
            fontSize: 72,
            fontWeight: 900,
            color: "#000",
            marginBottom: 32,
          }}
        >
          VF
        </div>
        <div style={{ fontSize: 80, fontWeight: 900, color: "#000", letterSpacing: -2 }}>
          VFFT
        </div>
        <div style={{ fontSize: 34, fontWeight: 700, color: "#000", marginTop: 8 }}>
          Velangi Free Fire Tournament
        </div>
        <div style={{ fontSize: 26, fontWeight: 700, color: "#444", marginTop: 16 }}>
          Where Village Legends Rise
        </div>
      </div>
    ),
    { ...size },
  );
}
