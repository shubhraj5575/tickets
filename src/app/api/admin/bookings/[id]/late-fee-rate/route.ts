import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { z } from "zod";

const schema = z.object({
  lateFeeRatePct: z.number().min(0).max(100),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const newRate = parsed.data.lateFeeRatePct;

    const recalculated = await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id },
        data: { lateFeeRatePct: newRate },
      });

      // Recalculate interest on all schedules that already had a late fee applied
      const affected = await tx.paymentSchedule.findMany({
        where: { bookingId: id, escalationStage: 2 },
        select: { id: true, amount: true },
      });

      for (const s of affected) {
        const newInterest = Math.round(Number(s.amount) * (newRate / 100));
        await tx.paymentSchedule.update({
          where: { id: s.id },
          data: { interestAmount: newInterest },
        });
      }

      return affected.length;
    });

    await prisma.adminAuditLog.create({
      data: {
        userId: auth.user.userId,
        action: "UPDATE_LATE_FEE_RATE",
        entity: "Booking",
        entityId: id,
        details: JSON.stringify({
          previous: Number(booking.lateFeeRatePct),
          new: newRate,
          recalculatedSchedules: recalculated,
        }),
      },
    });

    return NextResponse.json({
      ok: true,
      lateFeeRatePct: newRate,
      recalculatedSchedules: recalculated,
    });
  } catch (err) {
    console.error("[admin/bookings/late-fee-rate] failed", err);
    return NextResponse.json({ error: "Failed to update rate" }, { status: 500 });
  }
}
