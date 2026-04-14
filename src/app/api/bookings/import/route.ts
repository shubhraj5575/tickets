import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { uploadFile } from "@/lib/s3";

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file || file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "PDF file required" },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large (max 10MB)" },
        { status: 400 }
      );
    }

    // Upload to S3
    const buffer = Buffer.from(await file.arrayBuffer());
    const key = `bookings/${Date.now()}-${file.name}`;
    await uploadFile(key, buffer, "application/pdf");

    // Create import batch
    const batch = await prisma.importBatch.create({
      data: {
        fileName: file.name,
        fileUrl: key,
        status: "PROCESSING",
      },
    });

    // TODO: In production, enqueue BullMQ job for PDF extraction
    // For now, set to PENDING_REVIEW with placeholder data
    await prisma.importBatch.update({
      where: { id: batch.id },
      data: {
        status: "PENDING_REVIEW",
        extractedData: JSON.stringify({
          applicant_name: "",
          applicant_phone: "",
          applicant_email: "",
          applicant_address: "",
          pan_number: "",
          aadhaar_number: "",
          project_name: "",
          unit_number: "",
          unit_type: "Plot",
          area_sqft: "",
          floor_number: "",
          total_price: "",
          base_price_psf: "",
          payment_plan_type: "DOWN_PAYMENT",
          booking_amount: "",
          booking_date: "",
          co_applicant_name: "",
          co_applicant_phone: "",
          co_applicant_relationship: "",
        }),
      },
    });

    const updated = await prisma.importBatch.findUnique({
      where: { id: batch.id },
    });

    return NextResponse.json({ batch: updated });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "Import failed" },
      { status: 500 }
    );
  }
}
