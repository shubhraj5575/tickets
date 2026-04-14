import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      user: { select: { phone: true, email: true, role: true, createdAt: true, lastLoginAt: true } },
      bookings: {
        include: {
          unit: { include: { project: true } },
          paymentSchedule: { orderBy: { instalmentNo: "asc" } },
          payments: { orderBy: { paymentDate: "desc" } },
          coApplicants: true,
        },
        orderBy: { bookingDate: "desc" },
      },
    },
  });

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const bookings = customer.bookings.map((b) => {
    const totalPaid = b.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalInterest = b.paymentSchedule
      .filter((s) => s.status !== "PAID")
      .reduce((sum, s) => sum + Number(s.interestAmount ?? 0), 0);
    const overdueCount = b.paymentSchedule.filter((s) => s.status === "OVERDUE").length;

    return {
      id: b.id,
      bookingRef: b.bookingRef,
      bookingDate: b.bookingDate.toISOString(),
      totalAmount: Number(b.totalAmount),
      totalPaid,
      totalDue: Number(b.totalAmount) - totalPaid + totalInterest,
      status: b.status,
      lateFeeRatePct: Number(b.lateFeeRatePct ?? 2),
      unit: {
        unitNumber: b.unit.unitNumber,
        unitType: b.unit.unitType,
        areaSqFt: b.unit.areaSqFt,
        floor: b.unit.floor,
        project: {
          name: b.unit.project.name,
          city: b.unit.project.city,
          state: b.unit.project.state,
        },
      },
      coApplicants: b.coApplicants.map((ca) => ({
        name: ca.name,
        phone: ca.phone,
        relationship: ca.relationship,
      })),
      overdueCount,
      schedule: b.paymentSchedule.map((s) => ({
        id: s.id,
        instalmentNo: s.instalmentNo,
        label: s.label,
        dueDate: s.dueDate.toISOString(),
        amount: Number(s.amount),
        interestAmount: Number(s.interestAmount ?? 0),
        status: s.status,
        escalationStage: s.escalationStage ?? 0,
      })),
    };
  });

  return NextResponse.json({
    id: customer.id,
    name: customer.name,
    title: customer.title,
    phone: customer.phone,
    altPhone: customer.altPhone,
    email: customer.email,
    address: customer.address,
    city: customer.city,
    state: customer.state,
    pincode: customer.pincode,
    panNumber: customer.panNumber,
    aadhaarNumber: customer.aadhaarNumber,
    profession: customer.profession,
    companyName: customer.companyName,
    createdAt: customer.createdAt.toISOString(),
    user: customer.user,
    bookings,
  });
}
