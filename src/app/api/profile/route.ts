import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/api-auth";
import { sanitizeInput } from "@/lib/sanitize";

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if ("error" in auth) return auth.error;

  const customer = await prisma.customer.findUnique({
    where: { userId: auth.user.userId },
    include: { user: true },
  });
  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: customer.id,
    name: customer.name,
    title: customer.title,
    email: customer.email,
    phone: customer.phone,
    altPhone: customer.altPhone,
    address: customer.address,
    city: customer.city,
    state: customer.state,
    pincode: customer.pincode,
    panNumber: customer.panNumber
      ? `${customer.panNumber.slice(0, 2)}****${customer.panNumber.slice(-2)}`
      : null,
    aadhaarNumber: customer.aadhaarNumber
      ? `****-****-${customer.aadhaarNumber.slice(-4)}`
      : null,
    profession: customer.profession,
    companyName: customer.companyName,
    createdAt: customer.createdAt.toISOString(),
  });
}

export async function PATCH(request: Request) {
  const auth = await authenticateRequest(request);
  if ("error" in auth) return auth.error;

  const customer = await prisma.customer.findUnique({
    where: { userId: auth.user.userId },
  });
  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const body = await request.json();
  const allowedFields = [
    "email",
    "phone",
    "altPhone",
    "address",
    "city",
    "state",
    "pincode",
    "profession",
    "companyName",
  ];

  const updateData: Record<string, string> = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateData[field] =
        typeof body[field] === "string"
          ? sanitizeInput(body[field])
          : body[field];
    }
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  }

  const updated = await prisma.customer.update({
    where: { id: customer.id },
    data: updateData,
  });

  return NextResponse.json({
    success: true,
    email: updated.email,
    phone: updated.phone,
    altPhone: updated.altPhone,
    address: updated.address,
    city: updated.city,
    state: updated.state,
    pincode: updated.pincode,
  });
}
