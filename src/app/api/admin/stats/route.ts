import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  const [totalCustomers, totalBookings, pendingPayments, pendingImports] =
    await Promise.all([
      prisma.customer.count(),
      prisma.booking.count({ where: { status: "ACTIVE" } }),
      prisma.paymentSchedule.count({
        where: { status: { in: ["UPCOMING", "OVERDUE"] } },
      }),
      prisma.importBatch.count({
        where: { status: "PENDING_REVIEW" },
      }),
    ]);

  return NextResponse.json({
    totalCustomers,
    totalBookings,
    pendingPayments,
    pendingImports,
  });
}
