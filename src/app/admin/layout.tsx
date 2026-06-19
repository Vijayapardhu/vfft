"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminBottomNav } from "@/components/admin/AdminBottomNav";
import { FloatingCreateButton } from "@/components/admin/FloatingCreateButton";
import { AdminSearch } from "@/components/admin/AdminSearch";
import { Toaster } from "@/components/ui/toast";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { FullScreenLoader } from "@/components/ui/spinner";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAdmin, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
    if (!isLoading && isAuthenticated && !isAdmin) {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, isAdmin, router]);

  if (isLoading) return <FullScreenLoader />;
  if (!isAdmin) return null;

  return (
    <div className="flex min-h-dvh">
      <AdminSidebar />
      <main className="flex-1 overflow-x-auto p-4 pt-20 pb-24 lg:p-8 lg:pt-8 lg:pb-8">
        <div className="mb-4 flex justify-end lg:hidden">
          <AdminSearch />
        </div>
        {children}
      </main>
      <AdminBottomNav />
      <FloatingCreateButton />
      <Toaster toasts={toast.toasts} onDismiss={toast.removeToast} />
    </div>
  );
}
