import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const bookings = await prisma.booking.findMany({
      include: {
        customer: { select: { name: true, phone: true } },
        unit: {
          select: {
            unitNumber: true,
            project: { select: { name: true } },
          },
        },
        possessionSteps: {
          orderBy: { stepNumber: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      bookings: bookings.map((b) => ({
        id: b.id,
        bookingRef: b.bookingRef,
        customerName: b.customer.name,
        customerPhone: b.customer.phone,
        unitNumber: b.unit.unitNumber,
        projectName: b.unit.project.name,
        status: b.status,
        possessionSteps: b.possessionSteps.map((s) => ({
          id: s.id,
          stepNumber: s.stepNumber,
          title: s.title,
          status: s.status,
          estimatedDate: s.estimatedDate?.toISOString() || null,
          completedDate: s.completedDate?.toISOString() || null,
        })),
      })),
    });
  } catch (error) {
    console.error("Fetch possession data error:", error);
    return NextResponse.json(
      { error: "Failed to fetch possession data" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const { stepId, status } = body;

    if (!stepId || !status) {
      return NextResponse.json(
        { error: "stepId and status are required" },
        { status: 400 }
      );
    }

    if (!["UPCOMING", "IN_PROGRESS", "DONE"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be UPCOMING, IN_PROGRESS, or DONE" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = { status };
    if (status === "DONE") {
      updateData.completedDate = new Date();
    }

    const step = await prisma.possessionStep.update({
      where: { id: stepId },
      data: updateData,
    });

    return NextResponse.json({ step });
  } catch (error) {
    console.error("Update possession step error:", error);
    return NextResponse.json(
      { error: "Failed to update step" },
      { status: 500 }
    );
  }
}
