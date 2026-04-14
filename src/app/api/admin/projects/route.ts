import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  const projects = await prisma.project.findMany({
    include: { _count: { select: { units: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    projects: projects.map((p) => ({
      id: p.id,
      name: p.name,
      city: p.city,
      type: p.type,
      status: p.status,
      unitsCount: p._count.units,
      createdAt: p.createdAt.toISOString(),
    })),
  });
}
