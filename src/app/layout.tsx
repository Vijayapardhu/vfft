import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import { AppShell } from "@/components/navigation/AppShell";
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
    "Where Village Legends Rise. A franchise-based, IPL-style Free Fire esports platform.",
  applicationName: "VFFT",
  keywords: ["Free Fire", "esports", "VFFT", "Velangi", "tournament", "franchise"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "VFFT",
  },
  openGraph: {
    type: "website",
    siteName: "VFFT",
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
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
