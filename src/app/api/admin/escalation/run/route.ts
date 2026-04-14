import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { runPaymentEscalation } from "@/lib/escalation";

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const result = await runPaymentEscalation();

    await prisma.adminAuditLog.create({
      data: {
        userId: auth.user.userId,
        action: "RUN_ESCALATION",
        entity: "PaymentSchedule",
        entityId: "batch",
        details: JSON.stringify(result),
      },
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[admin/escalation/run] failed", err);
    return NextResponse.json({ error: "Escalation failed" }, { status: 500 });
  }
}
