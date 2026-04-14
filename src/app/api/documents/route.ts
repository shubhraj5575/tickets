import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/api-auth";

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if ("error" in auth) return auth.error;

  let customerId: string | undefined;

  if (auth.user.role === "CUSTOMER") {
    const customer = await prisma.customer.findUnique({
      where: { userId: auth.user.userId },
    });
    if (!customer) {
      return NextResponse.json({ documents: [] });
    }
    customerId = customer.id;
  } else {
    const url = new URL(request.url);
    customerId = url.searchParams.get("customerId") || undefined;
  }

  const documents = await prisma.document.findMany({
    where: customerId ? { customerId } : {},
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({
    documents: documents.map((d) => ({
      id: d.id,
      type: d.type,
      title: d.title,
      fileUrl: d.fileUrl,
      fileSize: d.fileSize,
      mimeType: d.mimeType,
      uploadedBy: d.uploadedBy,
      createdAt: d.createdAt.toISOString(),
    })),
  });
}
