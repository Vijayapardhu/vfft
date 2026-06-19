import { FranchiseShell } from "@/components/franchise/FranchiseShell";

export const metadata = { title: "My Franchise" };

export default function FranchiseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <FranchiseShell>{children}</FranchiseShell>;
}
