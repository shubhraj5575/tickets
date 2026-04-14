import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { z } from "zod";

const schema = z.object({
  batchId: z.string(),
  verifiedData: z.record(z.string(), z.string()),
});

function toNum(raw: string | undefined): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[₹,\s]/g, "");
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function requireNum(raw: string | undefined, field: string): number {
  const n = toNum(raw);
  if (n === null) throw new Error(`Invalid or missing number for "${field}"`);
  return n;
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { batchId, verifiedData } = parsed.data;

    const batch = await prisma.importBatch.findUnique({ where: { id: batchId } });
    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }
    if (batch.status === "IMPORTED") {
      return NextResponse.json(
        { error: "Batch already imported" },
        { status: 400 }
      );
    }

    const required = [
      "applicant_name",
      "applicant_phone",
      "project_name",
      "unit_number",
      "total_price",
    ];
    for (const field of required) {
      if (!verifiedData[field]?.trim()) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    let totalPrice: number;
    let bookingAmount: number | null;
    let areaSqft: number | null;
    let basePricePSF: number | null;
    try {
      totalPrice = requireNum(verifiedData.total_price, "total_price");
      bookingAmount = toNum(verifiedData.booking_amount);
      areaSqft = toNum(verifiedData.area_sqft);
      basePricePSF = toNum(verifiedData.base_price_psf);
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      let project = await tx.project.findFirst({
        where: { name: verifiedData.project_name },
      });
      if (!project) {
        project = await tx.project.create({
          data: {
            name: verifiedData.project_name,
            city: verifiedData.city || "Unknown",
            state: verifiedData.state || "Unknown",
            type: "RESIDENTIAL",
          },
        });
      }

      let unit = await tx.unit.findFirst({
        where: {
          projectId: project.id,
          unitNumber: verifiedData.unit_number,
        },
      });
      if (!unit) {
        unit = await tx.unit.create({
          data: {
            projectId: project.id,
            unitNumber: verifiedData.unit_number,
            unitType: verifiedData.unit_type || "Plot",
            areaSqFt: areaSqft,
            basePricePSF,
            totalPrice,
            paymentPlanType:
              verifiedData.payment_plan_type === "CONSTRUCTION_LINKED"
                ? "CONSTRUCTION_LINKED"
                : verifiedData.payment_plan_type === "FLEXI"
                ? "FLEXI"
                : "DOWN_PAYMENT",
          },
        });
      }

      const phone = verifiedData.applicant_phone.replace(/\D/g, "").slice(-10);
      let user = await tx.user.findUnique({ where: { phone } });
      if (!user) {
        user = await tx.user.create({ data: { phone, role: "CUSTOMER" } });
      }

      let customer = await tx.customer.findUnique({ where: { userId: user.id } });
      if (!customer) {
        customer = await tx.customer.create({
          data: {
            userId: user.id,
            name: verifiedData.applicant_name,
            phone,
            email: verifiedData.applicant_email || null,
            address: verifiedData.applicant_address || null,
            panNumber: verifiedData.pan_number || null,
            aadhaarNumber: verifiedData.aadhaar_number || null,
          },
        });
      }

      const booking = await tx.booking.create({
        data: {
          bookingRef: `${verifiedData.unit_number}-${Date.now()}`,
          customerId: customer.id,
          unitId: unit.id,
          bookingDate: verifiedData.booking_date
            ? new Date(verifiedData.booking_date)
            : new Date(),
          totalAmount: totalPrice,
          importBatchId: batchId,
        },
      });

      if (bookingAmount !== null && bookingAmount > 0) {
        await tx.paymentSchedule.create({
          data: {
            bookingId: booking.id,
            instalmentNo: 1,
            label: "Booking Amount",
            dueDate: new Date(),
            amount: bookingAmount,
            status: "UPCOMING",
          },
        });
      }

      if (verifiedData.co_applicant_name) {
        await tx.coApplicant.create({
          data: {
            bookingId: booking.id,
            name: verifiedData.co_applicant_name,
            phone: verifiedData.co_applicant_phone || null,
            relationship: verifiedData.co_applicant_relationship || null,
          },
        });
      }

      await tx.importBatch.update({
        where: { id: batchId },
        data: {
          verifiedData: JSON.stringify(verifiedData),
          status: "IMPORTED",
          processedBy: auth.user.userId,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Verify import error:", error);
    return NextResponse.json(
      { error: error?.message || "Import verification failed" },
      { status: 500 }
    );
  }
}
