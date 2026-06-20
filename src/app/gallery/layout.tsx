import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "Photos and moments from the Velangi Free Fire Tournament — matches, teams, players and trophy lifts.",
  alternates: { canonical: "/gallery" },
  openGraph: {
    title: "Gallery · VFFT",
    description: "Photos and moments from the Velangi Free Fire Tournament.",
    url: "/gallery",
  },
};

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
