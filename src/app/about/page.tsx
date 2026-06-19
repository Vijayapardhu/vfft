import { Info } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageView } from "@/components/legal/PageView";

export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <PageView
      slug="about"
      title="About VFFT"
      fallback={
        <EmptyState
          icon={Info}
          title="About VFFT"
          message="Velangi Free Fire Tournament — the IPL of village esports. Where Village Legends Rise."
        />
      }
    />
  );
}
