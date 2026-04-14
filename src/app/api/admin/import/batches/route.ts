import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  const batches = await prisma.importBatch.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({
    batches: batches.map((b) => ({
      id: b.id,
      fileName: b.fileName,
      status: b.status,
      extractedData: b.extractedData ? JSON.parse(b.extractedData) : null,
      verifiedData: b.verifiedData ? JSON.parse(b.verifiedData) : null,
      createdAt: b.createdAt,
    })),
  });
}
