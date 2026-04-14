import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const overdue = await prisma.paymentSchedule.findMany({
      where: { status: "OVERDUE" },
      select: {
        amount: true,
        interestAmount: true,
        escalationStage: true,
      },
    });

    let overdue15 = 0;
    let overdue30 = 0;
    let totalOverdueAmount = 0;

    for (const s of overdue) {
      const amt = Number(s.amount) + Number(s.interestAmount ?? 0);
      totalOverdueAmount += amt;
      if (s.escalationStage >= 2) overdue30 += 1;
      else if (s.escalationStage >= 1) overdue15 += 1;
    }

    return NextResponse.json({
      overdue15,
      overdue30,
      totalOverdue: overdue.length,
      totalOverdueAmount,
    });
  } catch (err) {
    console.error("[admin/overdue-summary] failed", err);
    return NextResponse.json({ error: "Failed to load summary" }, { status: 500 });
  }
}
