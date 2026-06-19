import { TeamLeaderShell } from "@/components/team/TeamLeaderShell";

export const metadata = { title: "My Team" };

export default function TeamLayout({ children }: { children: React.ReactNode }) {
  return <TeamLeaderShell>{children}</TeamLeaderShell>;
}
