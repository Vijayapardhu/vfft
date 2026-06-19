import { ScrollText } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata = { title: "Rules" };

export default function RulesPage() {
  return (
    <EmptyState
      icon={ScrollText}
      title="Rules"
      message="The full rulebook (auction, squad, lineup, transfers) is on the way."
    />
  );
}
