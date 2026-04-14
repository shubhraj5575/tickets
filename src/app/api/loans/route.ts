import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/api-auth";

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if ("error" in auth) return auth.error;

  const banks = await prisma.partnerBank.findMany({
    where: { isActive: true },
    orderBy: { interestRate: "asc" },
  });

  return NextResponse.json({
    banks: banks.map((b) => ({
      id: b.id,
      bankName: b.bankName,
      interestRate: b.interestRate,
      maxLoanAmount: b.maxLoanAmount,
      processingFee: b.processingFee,
      contactPerson: b.contactPerson,
      contactPhone: b.contactPhone,
      contactEmail: b.contactEmail,
      documentChecklist: b.documentChecklist ? JSON.parse(b.documentChecklist) : [],
    })),
  });
}
