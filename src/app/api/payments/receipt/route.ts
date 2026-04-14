import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/api-auth";

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const paymentId = url.searchParams.get("paymentId");

  if (!paymentId) {
    return NextResponse.json({ error: "paymentId required" }, { status: 400 });
  }

  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: {
          include: {
            customer: true,
            unit: { include: { project: true } },
          },
        },
        schedule: true,
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Verify ownership for customers
    if (auth.user.role === "CUSTOMER") {
      const customer = await prisma.customer.findUnique({
        where: { userId: auth.user.userId },
      });
      if (!customer || payment.booking.customerId !== customer.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    const formatINR = (n: number) =>
      new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

    const formatDate = (d: Date) =>
      d.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });

    // Generate HTML receipt
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Payment Receipt - ${payment.booking.bookingRef}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; background: #fff; }
    .receipt { max-width: 700px; margin: 0 auto; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1e3a5f; padding-bottom: 20px; margin-bottom: 30px; }
    .logo h1 { font-size: 28px; color: #1e3a5f; font-weight: 700; }
    .logo p { font-size: 11px; color: #888; letter-spacing: 2px; text-transform: uppercase; margin-top: 4px; }
    .receipt-title { text-align: right; }
    .receipt-title h2 { font-size: 22px; color: #1e3a5f; text-transform: uppercase; letter-spacing: 1px; }
    .receipt-title .ref { font-size: 13px; color: #666; margin-top: 4px; }
    .receipt-title .date { font-size: 12px; color: #999; margin-top: 2px; }
    .status { display: inline-block; background: #e6f4ea; color: #1a7f37; padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 8px; }
    .section { margin-bottom: 25px; }
    .section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #999; margin-bottom: 10px; font-weight: 600; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .info-row { display: flex; justify-content: space-between; padding: 6px 0; }
    .info-label { color: #666; font-size: 13px; }
    .info-value { font-weight: 600; font-size: 13px; text-align: right; }
    .amount-box { background: linear-gradient(135deg, #1e3a5f, #2d5a8e); color: white; padding: 24px; border-radius: 12px; margin: 25px 0; display: flex; justify-content: space-between; align-items: center; }
    .amount-box .label { font-size: 14px; opacity: 0.8; }
    .amount-box .amount { font-size: 32px; font-weight: 700; }
    .footer { border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center; color: #999; font-size: 11px; }
    .footer p { margin-bottom: 4px; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .receipt { padding: 20px; } }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <div class="logo">
        <h1>ONE Group</h1>
        <p>Real Estate</p>
      </div>
      <div class="receipt-title">
        <h2>Payment Receipt</h2>
        <div class="ref">Ref: ${payment.booking.bookingRef}</div>
        <div class="date">Generated: ${formatDate(new Date())}</div>
        <div class="status">PAID</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Customer Details</div>
      <div class="info-grid">
        <div>
          <div class="info-row">
            <span class="info-label">Name</span>
            <span class="info-value">${payment.booking.customer.name}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Phone</span>
            <span class="info-value">+91 ${payment.booking.customer.phone}</span>
          </div>
        </div>
        <div>
          <div class="info-row">
            <span class="info-label">Project</span>
            <span class="info-value">${payment.booking.unit.project.name}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Unit</span>
            <span class="info-value">${payment.booking.unit.unitNumber}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Payment Details</div>
      <div class="info-row">
        <span class="info-label">Instalment</span>
        <span class="info-value">${payment.schedule?.label || "Payment"}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Payment Date</span>
        <span class="info-value">${formatDate(payment.paymentDate)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Payment Mode</span>
        <span class="info-value">${payment.paymentMode || "—"}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Reference No.</span>
        <span class="info-value">${payment.referenceNumber || "—"}</span>
      </div>
    </div>

    <div class="amount-box">
      <div class="label">Amount Paid</div>
      <div class="amount">${formatINR(payment.amount)}</div>
    </div>

    <div class="section">
      <div class="section-title">Booking Summary</div>
      <div class="info-row">
        <span class="info-label">Total Agreement Value</span>
        <span class="info-value">${formatINR(payment.booking.totalAmount)}</span>
      </div>
    </div>

    <div class="footer">
      <p>This is a computer-generated receipt and does not require a signature.</p>
      <p>ONE Group Real Estate &bull; Gurugram, Haryana</p>
    </div>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="Receipt-${payment.booking.bookingRef}-${payment.schedule?.instalmentNo || ""}.html"`,
      },
    });
  } catch (error) {
    console.error("Generate receipt error:", error);
    return NextResponse.json({ error: "Failed to generate receipt" }, { status: 500 });
  }
}
