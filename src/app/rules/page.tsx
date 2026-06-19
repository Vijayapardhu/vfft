import { ScrollText } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageView } from "@/components/legal/PageView";

export const metadata = { title: "Rules" };

export default function RulesPage() {
  return (
    <PageView
      slug="rules"
      title="Rules"
      fallback={
        <EmptyState
          icon={ScrollText}
          title="Rules"
          message="The full rulebook will appear here once an admin publishes it."
        />
      }
    />
  );
}
