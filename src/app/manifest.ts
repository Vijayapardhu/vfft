import type { MetadataRoute } from "next";

/**
 * PWA web manifest (served at /manifest.webmanifest). Lets players "Add to Home
 * Screen". Uses the SVG app icon — see KNOWN_ISSUES.md for adding 192/512 PNGs
 * to satisfy a strict Lighthouse PWA install audit.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "VFFT — Velangi Free Fire Tournament",
    short_name: "VFFT",
    description:
      "Where Village Legends Rise. A franchise-based, IPL-style Free Fire esports platform.",
    lang: "en",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#FFFDF5",
    theme_color: "#FFFDF5",
    categories: ["sports", "games", "entertainment"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
