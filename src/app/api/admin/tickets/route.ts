import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { sanitizeInput } from "@/lib/sanitize";
import { createNotification } from "@/lib/notifications";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const ticketId = url.searchParams.get("id");

    // Single ticket detail with messages
    if (ticketId) {
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: {
          customer: { include: { user: true } },
          messages: { orderBy: { createdAt: "asc" } },
        },
      });
      if (!ticket) {
        return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
      }
      return NextResponse.json({
        ticket: {
          id: ticket.id,
          ticketRef: ticket.ticketRef,
          subject: ticket.subject,
          description: ticket.description,
          category: ticket.category,
          status: ticket.status,
          priority: ticket.priority,
          assignedTo: ticket.assignedTo,
          customerName: ticket.customer.name,
          customerPhone: ticket.customer.phone,
          createdAt: ticket.createdAt.toISOString(),
          messages: ticket.messages.map((m) => ({
            id: m.id,
            senderId: m.senderId,
            message: m.message,
            isInternal: m.isInternal,
            isAdmin: m.senderId === auth.user.userId,
            createdAt: m.createdAt.toISOString(),
          })),
        },
      });
    }

    // List all tickets
    const where = status && status !== "ALL" ? { status } : {};
    const tickets = await prisma.ticket.findMany({
      where,
      include: { customer: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const counts = await Promise.all([
      prisma.ticket.count({ where: { status: "OPEN" } }),
      prisma.ticket.count({ where: { status: "IN_PROGRESS" } }),
      prisma.ticket.count({ where: { status: "RESOLVED" } }),
      prisma.ticket.count({ where: { status: "CLOSED" } }),
    ]);

    return NextResponse.json({
      tickets: tickets.map((t) => ({
        id: t.id,
        ticketRef: t.ticketRef,
        subject: t.subject,
        category: t.category,
        status: t.status,
        priority: t.priority,
        customerName: t.customer.name,
        customerPhone: t.customer.phone,
        assignedTo: t.assignedTo,
        createdAt: t.createdAt.toISOString(),
      })),
      counts: {
        open: counts[0],
        inProgress: counts[1],
        resolved: counts[2],
        closed: counts[3],
        total: counts[0] + counts[1] + counts[2] + counts[3],
      },
    });
  } catch (error) {
    console.error("Fetch tickets error:", error);
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const { ticketId, status, reply } = body;

    if (!ticketId) {
      return NextResponse.json({ error: "ticketId required" }, { status: 400 });
    }

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Update status if provided
    if (status) {
      await prisma.ticket.update({
        where: { id: ticketId },
        data: {
          status,
          assignedTo: auth.user.userId,
          resolvedAt: status === "RESOLVED" || status === "CLOSED" ? new Date() : undefined,
        },
      });
    }

    // Add reply if provided
    if (reply) {
      const sanitizedReply = sanitizeInput(reply);
      await prisma.ticketMessage.create({
        data: {
          ticketId,
          senderId: auth.user.userId,
          message: sanitizedReply,
        },
      });

      // Auto-set to IN_PROGRESS if still OPEN
      if (ticket.status === "OPEN") {
        await prisma.ticket.update({
          where: { id: ticketId },
          data: { status: "IN_PROGRESS", assignedTo: auth.user.userId },
        });
      }
    }

    // Send ticket update notification
    await createNotification({
      customerId: ticket.customerId,
      type: "TICKET_UPDATE",
      title: "Ticket Updated",
      body: reply
        ? `Your ticket #${ticket.ticketRef} has a new reply from support.`
        : `Your ticket #${ticket.ticketRef} status changed to ${status}.`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update ticket error:", error);
    return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 });
  }
}
