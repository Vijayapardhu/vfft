import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "News",
  description:
    "Latest VFFT news, announcements, match highlights and roster updates from the Velangi Free Fire Tournament.",
  alternates: { canonical: "/news" },
  openGraph: {
    title: "News · VFFT",
    description: "Latest VFFT news, announcements and match highlights.",
    url: "/news",
  },
};

export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
