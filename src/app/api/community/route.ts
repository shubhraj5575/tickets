import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/api-auth";

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if ("error" in auth) return auth.error;

  // Get the customer's project IDs from their bookings
  const customer = await prisma.customer.findUnique({
    where: { userId: auth.user.userId },
    include: {
      bookings: {
        include: {
          unit: true,
        },
      },
    },
  });

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const projectIds = [...new Set(customer.bookings.map((b) => b.unit.projectId))];

  if (projectIds.length === 0) {
    return NextResponse.json({ announcements: [], faqs: [], events: [] });
  }

  const [announcements, faqs, events] = await Promise.all([
    prisma.announcement.findMany({
      where: { projectId: { in: projectIds } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.faq.findMany({
      where: { projectId: { in: projectIds } },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.event.findMany({
      where: { projectId: { in: projectIds } },
      orderBy: { eventDate: "asc" },
    }),
  ]);

  return NextResponse.json({
    announcements: announcements.map((a) => ({
      id: a.id,
      title: a.title,
      body: a.body,
      imageUrl: a.imageUrl,
      createdAt: a.createdAt.toISOString(),
    })),
    faqs: faqs.map((f) => ({
      id: f.id,
      question: f.question,
      answer: f.answer,
      category: f.category,
    })),
    events: events.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      eventDate: e.eventDate.toISOString(),
      location: e.location,
      imageUrl: e.imageUrl,
    })),
  });
}
