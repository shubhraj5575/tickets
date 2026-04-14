import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  const schedules = await prisma.paymentSchedule.findMany({
    where: { status: { in: ["UPCOMING", "OVERDUE"] } },
    orderBy: { dueDate: "asc" },
    include: {
      booking: {
        include: {
          customer: true,
          unit: { include: { project: true } },
        },
      },
    },
  });

  return NextResponse.json({
    schedules: schedules.map((s) => ({
      id: s.id,
      instalmentNo: s.instalmentNo,
      label: s.label,
      dueDate: s.dueDate.toISOString(),
      amount: s.amount.toString(),
      interestAmount: Number(s.interestAmount ?? 0).toString(),
      escalationStage: s.escalationStage ?? 0,
      status: s.status,
      bookingId: s.booking.id,
      bookingRef: s.booking.bookingRef,
      lateFeeRatePct: Number(s.booking.lateFeeRatePct ?? 2),
      customerId: s.booking.customer.id,
      customerName: s.booking.customer.name,
      customerPhone: s.booking.customer.phone,
      projectName: s.booking.unit.project.name,
      unitNumber: s.booking.unit.unitNumber,
    })),
  });
}
