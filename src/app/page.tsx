"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { isTicketsOnly } from "@/lib/features";

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.push("/login");
    } else if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
      router.push(isTicketsOnly() ? "/admin/tickets" : "/admin/dashboard");
    } else {
      router.push(isTicketsOnly() ? "/tickets" : "/dashboard");
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
    </div>
  );
}
