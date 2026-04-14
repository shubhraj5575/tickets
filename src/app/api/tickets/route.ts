import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/api-auth";
import { sanitizeInput } from "@/lib/sanitize";

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if ("error" in auth) return auth.error;

  try {
    const customer = await prisma.customer.findUnique({
      where: { userId: auth.user.userId },
    });
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const tickets = await prisma.ticket.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      tickets: tickets.map((t) => ({
        id: t.id,
        ticketRef: t.ticketRef,
        subject: t.subject,
        category: t.category,
        status: t.status,
        priority: t.priority,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Fetch tickets error:", error);
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if ("error" in auth) return auth.error;

  try {
    const customer = await prisma.customer.findUnique({
      where: { userId: auth.user.userId },
    });
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const body = await request.json();
    const { category } = body;
    const subject = body.subject ? sanitizeInput(body.subject) : "";
    const description = body.description ? sanitizeInput(body.description) : "";

    if (!category || !subject || !description) {
      return NextResponse.json(
        { error: "category, subject, and description are required" },
        { status: 400 }
      );
    }

    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
    const countToday = await prisma.ticket.count({
      where: { ticketRef: { startsWith: `TKT-${dateStr}` } },
    });
    const ticketRef = `TKT-${dateStr}-${String(countToday + 1).padStart(3, "0")}`;

    const ticket = await prisma.ticket.create({
      data: {
        ticketRef,
        customerId: customer.id,
        category,
        subject,
        description,
        status: "OPEN",
        priority: "MEDIUM",
      },
    });

    await prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        senderId: customer.id,
        message: description,
      },
    });

    return NextResponse.json({
      id: ticket.id,
      ticketRef: ticket.ticketRef,
    }, { status: 201 });
  } catch (error) {
    console.error("Create ticket error:", error);
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
  }
}
