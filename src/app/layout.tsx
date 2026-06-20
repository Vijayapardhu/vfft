import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import { Analytics } from "@/components/analytics/Analytics";
import { AppShell } from "@/components/navigation/AppShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { Providers } from "@/providers/Providers";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vfft.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "VFFT — Velangi Free Fire Tournament",
    template: "%s · VFFT",
  },
  description:
    "Where Village Legends Rise. A franchise-based, IPL-style Free Fire esports platform — live auctions, team rosters, fixtures, stats and leaderboards.",
  applicationName: "VFFT",
  keywords: [
    "Free Fire",
    "Free Fire esports",
    "VFFT",
    "Velangi Free Fire Tournament",
    "Velangi",
    "esports tournament",
    "franchise league",
    "player auction",
    "leaderboard",
  ],
  category: "esports",
  authors: [{ name: "VFFT" }],
  creator: "VFFT",
  publisher: "VFFT",
  manifest: "/manifest.webmanifest",
  alternates: {
    canonical: "/",
  },
  formatDetection: {
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "VFFT",
  },
  openGraph: {
    type: "website",
    siteName: "VFFT",
    locale: "en_US",
    title: "VFFT — Velangi Free Fire Tournament",
    description: "Where Village Legends Rise. Franchise-based Free Fire esports.",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "VFFT — Velangi Free Fire Tournament",
    description: "Where Village Legends Rise. Franchise-based Free Fire esports.",
  },
};

/** schema.org structured data — helps Google show a richer site identity. */
const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "VFFT — Velangi Free Fire Tournament",
    alternateName: "VFFT",
    url: siteUrl,
    logo: `${siteUrl}/icon.svg`,
    description:
      "A franchise-based, IPL-style Free Fire esports tournament: live player auctions, team rosters, fixtures, stats and leaderboards.",
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "VFFT",
    url: siteUrl,
  },
];

export const viewport: Viewport = {
  themeColor: "#FFFDF5",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={spaceGrotesk.variable}>
      <body className="min-h-dvh bg-cream text-ink antialiased">
        <JsonLd data={jsonLd} />
        <Analytics />
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
