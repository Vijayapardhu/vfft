import { FranchiseShell } from "@/components/franchise/FranchiseShell";

export const metadata = { title: "Franchise HQ" };

export default function FranchiseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <FranchiseShell>{children}</FranchiseShell>;
}
