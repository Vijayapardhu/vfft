import type { MetadataRoute } from "next";

/**
 * PWA web manifest (served at /manifest.webmanifest). Lets players "Add to Home
 * Screen". Uses the SVG app icon — see KNOWN_ISSUES.md for adding 192/512 PNGs
 * to satisfy a strict Lighthouse PWA install audit.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VFFT — Velangi Free Fire Tournament",
    short_name: "VFFT",
    description:
      "Where Village Legends Rise. A franchise-based, IPL-style Free Fire esports platform.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFDF5",
    theme_color: "#FFFDF5",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
