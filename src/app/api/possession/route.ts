import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/api-auth";

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const bookingId = url.searchParams.get("bookingId");

  if (!bookingId) {
    return NextResponse.json({ error: "bookingId required" }, { status: 400 });
  }

  // Verify customer owns this booking
  if (auth.user.role === "CUSTOMER") {
    const customer = await prisma.customer.findUnique({
      where: { userId: auth.user.userId },
    });
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, customerId: customer.id },
    });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
  }

  const steps = await prisma.possessionStep.findMany({
    where: { bookingId },
    orderBy: { stepNumber: "asc" },
  });

  const totalSteps = steps.length;
  const doneSteps = steps.filter((s) => s.status === "DONE").length;
  const progressPercent = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;

  return NextResponse.json({
    progressPercent,
    totalSteps,
    doneSteps,
    steps: steps.map((s) => ({
      id: s.id,
      stepNumber: s.stepNumber,
      title: s.title,
      status: s.status,
      estimatedDate: s.estimatedDate?.toISOString() || null,
      completedDate: s.completedDate?.toISOString() || null,
    })),
  });
}
