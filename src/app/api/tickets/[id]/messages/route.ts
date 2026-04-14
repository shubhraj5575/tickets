import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/api-auth";
import { sanitizeInput } from "@/lib/sanitize";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await authenticateRequest(request);
  if ("error" in auth) return auth.error;

  const customer = await prisma.customer.findUnique({
    where: { userId: auth.user.userId },
  });
  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  // Verify ticket belongs to customer
  const ticket = await prisma.ticket.findFirst({
    where: { id, customerId: customer.id },
  });
  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  if (ticket.status === "CLOSED") {
    return NextResponse.json(
      { error: "Cannot reply to a closed ticket" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const { message } = body;

  if (!message || !message.trim()) {
    return NextResponse.json(
      { error: "Message is required" },
      { status: 400 }
    );
  }

  const sanitizedMessage = sanitizeInput(message);

  const ticketMessage = await prisma.ticketMessage.create({
    data: {
      ticketId: id,
      senderId: customer.id,
      message: sanitizedMessage,
      isInternal: false,
    },
  });

  // Update ticket updatedAt
  await prisma.ticket.update({
    where: { id },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json({
    id: ticketMessage.id,
    message: ticketMessage.message,
    createdAt: ticketMessage.createdAt.toISOString(),
    isCustomer: true,
  }, { status: 201 });
}
