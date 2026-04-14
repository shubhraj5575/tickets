import { NextResponse } from "next/server";
import { runPaymentEscalation } from "@/lib/escalation";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 }
    );
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runPaymentEscalation();
    return NextResponse.json({ ok: true, ...result, ranAt: new Date().toISOString() });
  } catch (err) {
    console.error("[cron/escalation] failed", err);
    return NextResponse.json({ error: "Escalation failed" }, { status: 500 });
  }
}
