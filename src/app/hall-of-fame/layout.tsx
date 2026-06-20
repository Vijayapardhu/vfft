import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hall of Fame",
  description:
    "Champions, MVPs and legends of the Velangi Free Fire Tournament — the players and teams who made history.",
  alternates: { canonical: "/hall-of-fame" },
  openGraph: {
    title: "Hall of Fame · VFFT",
    description: "Champions, MVPs and legends of the Velangi Free Fire Tournament.",
    url: "/hall-of-fame",
  },
};

export default function HallOfFameLayout({ children }: { children: React.ReactNode }) {
  return children;
}
