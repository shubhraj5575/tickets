"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { AdminSidebar } from "@/components/shared/admin-sidebar";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { isAllowedPath } from "@/lib/features";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login");
      } else if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
        router.push("/dashboard");
      }
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user) return;
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") return;
    if (!isAllowedPath("ADMIN", pathname)) {
      router.replace("/admin/tickets");
    }
  }, [user, pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 bg-gray-50 p-8">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
    </div>
  );
}
