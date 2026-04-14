import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/api-auth";

export async function GET(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if ("error" in auth) return auth.error;

    const user = await prisma.user.findUnique({
      where: { id: auth.user.userId },
      include: {
        customer: {
          include: {
            bookings: {
              include: { unit: { include: { project: true } } },
              where: { status: "ACTIVE" },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      phone: user.phone,
      role: user.role,
      email: user.email,
      customer: user.customer
        ? {
            id: user.customer.id,
            name: user.customer.name,
            email: user.customer.email,
            bookings: user.customer.bookings.map((b) => ({
              id: b.id,
              bookingRef: b.bookingRef,
              unitNumber: b.unit.unitNumber,
              projectName: b.unit.project.name,
              totalAmount: b.totalAmount,
            })),
          }
        : null,
    });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
