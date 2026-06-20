import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Records",
  description:
    "All-time records and statistical leaders of the Velangi Free Fire Tournament — most kills, highest scores and more.",
  alternates: { canonical: "/records" },
  openGraph: {
    title: "Records · VFFT",
    description: "All-time records and statistical leaders of the Velangi Free Fire Tournament.",
    url: "/records",
  },
};

export default function RecordsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
