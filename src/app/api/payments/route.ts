import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/api-auth";

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if ("error" in auth) return auth.error;

  try {
  const url = new URL(request.url);
  const bookingId = url.searchParams.get("bookingId");

  if (!bookingId) {
    return NextResponse.json({ error: "bookingId required" }, { status: 400 });
  }

  // Verify customer owns this booking (unless admin)
  if (auth.user.role === "CUSTOMER") {
    const customer = await prisma.customer.findUnique({
      where: { userId: auth.user.userId },
    });
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, customerId: customer.id },
    });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
  }

  const [schedule, booking] = await Promise.all([
    prisma.paymentSchedule.findMany({
      where: { bookingId },
      orderBy: { instalmentNo: "asc" },
      include: { payment: true },
    }),
    prisma.booking.findUnique({
      where: { id: bookingId },
    }),
  ]);

  const totalPaid = schedule
    .filter((s) => s.status === "PAID")
    .reduce((sum, s) => sum + Number(s.amount), 0);

  const totalInterest = schedule
    .filter((s) => s.status !== "PAID")
    .reduce((sum, s) => sum + Number(s.interestAmount ?? 0), 0);

  const totalAmount = Number(booking?.totalAmount || 0);
  const totalDue = totalAmount - totalPaid + totalInterest;

  const nextDue = schedule.find(
    (s) => s.status === "UPCOMING" || s.status === "OVERDUE"
  );

  return NextResponse.json({
    totalAmount: totalAmount.toString(),
    totalPaid: totalPaid.toString(),
    totalDue: totalDue.toString(),
    nextDueDate: nextDue?.dueDate?.toISOString() || null,
    nextDueAmount: nextDue?.amount?.toString() || null,
    schedule: schedule.map((s) => ({
      id: s.id,
      instalmentNo: s.instalmentNo,
      label: s.label,
      dueDate: s.dueDate.toISOString(),
      amount: s.amount.toString(),
      interestAmount: Number(s.interestAmount ?? 0).toString(),
      escalationStage: s.escalationStage ?? 0,
      status: s.status,
      payment: s.payment
        ? {
            id: s.payment.id,
            paymentDate: s.payment.paymentDate.toISOString(),
            paymentMode: s.payment.paymentMode,
            referenceNumber: s.payment.referenceNumber,
            receiptUrl: s.payment.receiptUrl,
          }
        : null,
    })),
  });
  } catch (error) {
    console.error("Fetch payments error:", error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}
