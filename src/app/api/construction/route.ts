import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/api-auth";

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId");

  let projectIds: string[] = [];

  if (projectId) {
    projectIds = [projectId];
  } else if (auth.user.role === "CUSTOMER") {
    // Get projects from customer's bookings
    const customer = await prisma.customer.findUnique({
      where: { userId: auth.user.userId },
      include: {
        bookings: {
          where: { status: "ACTIVE" },
          include: { unit: true },
        },
      },
    });

    if (customer) {
      projectIds = [...new Set(customer.bookings.map((b) => b.unit.projectId))];
    }
  }

  if (projectIds.length === 0) {
    return NextResponse.json({ updates: [], currentStage: null });
  }

  const updates = await prisma.constructionUpdate.findMany({
    where: { projectId: { in: projectIds } },
    orderBy: { date: "desc" },
    take: 20,
  });

  // Get latest stage
  const latestUpdate = updates[0];
  const currentStage = latestUpdate?.stage || null;

  return NextResponse.json({
    updates: updates.map((u) => ({
      id: u.id,
      title: u.title,
      description: u.description,
      stage: u.stage,
      date: u.date.toISOString(),
      mediaType: u.mediaType,
      mediaUrl: u.mediaUrl,
      thumbnailUrl: u.thumbnailUrl,
      source: u.source,
    })),
    currentStage,
  });
}
