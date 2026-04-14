import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { createNotification } from "@/lib/notifications";
import { z } from "zod";

const schema = z.object({
  scheduleId: z.string(),
  amount: z.number().positive(),
  paymentDate: z.string(),
  paymentMode: z.string().optional(),
  referenceNumber: z.string().optional(),
  remarks: z.string().optional(),
});

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { scheduleId, amount, paymentDate, paymentMode, referenceNumber, remarks } =
      parsed.data;

    const schedule = await prisma.paymentSchedule.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule) {
      return NextResponse.json(
        { error: "Payment schedule not found" },
        { status: 404 }
      );
    }

    // Create payment and update schedule status in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.payment.create({
        data: {
          bookingId: schedule.bookingId,
          scheduleId,
          amount,
          paymentDate: new Date(paymentDate),
          paymentMode: paymentMode || null,
          referenceNumber: referenceNumber || null,
          remarks: remarks || null,
          markedBy: auth.user.userId,
        },
      });

      const newStatus =
        amount >= Number(schedule.amount) ? "PAID" : "PARTIALLY_PAID";

      await tx.paymentSchedule.update({
        where: { id: scheduleId },
        data: { status: newStatus },
      });

      // Audit log
      await tx.adminAuditLog.create({
        data: {
          userId: auth.user.userId,
          action: "MARK_PAYMENT",
          entity: "Payment",
          entityId: scheduleId,
          details: JSON.stringify({ amount, paymentMode, referenceNumber }),
        },
      });
    });

    // Send payment confirmation notification
    const booking = await prisma.booking.findFirst({
      where: { paymentSchedule: { some: { id: scheduleId } } },
      select: { customerId: true },
    });

    if (booking) {
      await createNotification({
        customerId: booking.customerId,
        type: "PAYMENT_CONFIRMATION",
        title: "Payment Recorded",
        body: `Your payment of Rs. ${amount.toLocaleString("en-IN")} has been recorded successfully.`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mark payment error:", error);
    return NextResponse.json(
      { error: "Failed to record payment" },
      { status: 500 }
    );
  }
}
