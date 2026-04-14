import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  const admins = await prisma.user.findMany({
    where: {
      role: { in: ["ADMIN", "SUPER_ADMIN"] },
      isActive: true,
    },
    select: { id: true, phone: true, email: true, role: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    admins: admins.map((a) => ({
      id: a.id,
      phone: a.phone,
      email: a.email,
      role: a.role,
      label: a.email || `+91 ${a.phone}`,
    })),
  });
}
