import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const [announcements, faqs, events] = await Promise.all([
      prisma.announcement.findMany({
        include: { project: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.faq.findMany({
        include: { project: { select: { name: true } } },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.event.findMany({
        include: { project: { select: { name: true } } },
        orderBy: { eventDate: "desc" },
      }),
    ]);

    return NextResponse.json({ announcements, faqs, events });
  } catch (error) {
    console.error("Fetch community error:", error);
    return NextResponse.json(
      { error: "Failed to fetch community data" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const { type, projectId, ...data } = body;

    if (!type || !projectId) {
      return NextResponse.json(
        { error: "type and projectId are required" },
        { status: 400 }
      );
    }

    let result;

    switch (type) {
      case "announcement":
        result = await prisma.announcement.create({
          data: {
            projectId,
            title: data.title,
            body: data.body,
          },
        });
        break;
      case "faq":
        result = await prisma.faq.create({
          data: {
            projectId,
            question: data.question,
            answer: data.answer,
            category: data.category || null,
          },
        });
        break;
      case "event":
        result = await prisma.event.create({
          data: {
            projectId,
            title: data.title,
            description: data.description || null,
            eventDate: new Date(data.eventDate),
            location: data.location || null,
          },
        });
        break;
      default:
        return NextResponse.json(
          { error: "Invalid type. Must be announcement, faq, or event" },
          { status: 400 }
        );
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Create community item error:", error);
    return NextResponse.json(
      { error: "Failed to create item" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const type = searchParams.get("type");

    if (!id || !type) {
      return NextResponse.json(
        { error: "id and type are required" },
        { status: 400 }
      );
    }

    switch (type) {
      case "announcement":
        await prisma.announcement.delete({ where: { id } });
        break;
      case "faq":
        await prisma.faq.delete({ where: { id } });
        break;
      case "event":
        await prisma.event.delete({ where: { id } });
        break;
      default:
        return NextResponse.json(
          { error: "Invalid type" },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete community item error:", error);
    return NextResponse.json(
      { error: "Failed to delete item" },
      { status: 500 }
    );
  }
}
