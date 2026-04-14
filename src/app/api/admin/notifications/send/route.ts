import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { createNotification } from "@/lib/notifications";
import { z } from "zod";

const schema = z.object({
  customerId: z.string().min(1),
  title: z.string().max(200).optional(),
  body: z.string().min(1, "Message body is required").max(2000),
});

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const payload = await request.json();
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { customerId, title, body } = parsed.data;

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true, email: true },
    });
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    await createNotification({
      customerId: customer.id,
      type: "ADMIN_MESSAGE",
      title: title?.trim() || "Message from ONE Group",
      body,
      channels: "IN_APP",
    });

    await prisma.adminAuditLog.create({
      data: {
        userId: auth.user.userId,
        action: "SEND_MESSAGE",
        entity: "Customer",
        entityId: customer.id,
        details: JSON.stringify({ title: title || null, length: body.length }),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/notifications/send] failed", err);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
