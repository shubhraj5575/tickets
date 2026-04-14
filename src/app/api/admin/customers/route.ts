import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const customers = await prisma.customer.findMany({
      include: { _count: { select: { bookings: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return NextResponse.json({
      customers: customers.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        bookingsCount: c._count.bookings,
        createdAt: c.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Fetch customers error:", error);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}
