import { prisma } from "@/lib/prisma";
import { createNotification, notifyAllAdmins } from "@/lib/notifications";

const daysAgo = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
};

const daysFromNow = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
};

const fmtINR = (n: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export type EscalationResult = {
  marked: number;
  warnings: number;
  penalties: number;
  reminders7d: number;
  reminders3d: number;
};

export async function runPaymentEscalation(): Promise<EscalationResult> {
  const today = new Date();

  // ── Advance reminders (UPCOMING only) ─────────────────────────
  // 7-day reminder: dueDate between 5 and 7 days from now, reminderStage=0
  const reminders7dCandidates = await prisma.paymentSchedule.findMany({
    where: {
      status: "UPCOMING",
      reminderStage: 0,
      dueDate: { gte: daysFromNow(5), lte: daysFromNow(7) },
    },
    include: {
      booking: {
        include: {
          customer: { include: { user: true } },
          unit: { include: { project: true } },
        },
      },
    },
  });

  for (const sched of reminders7dCandidates) {
    const { booking } = sched;
    const customer = booking.customer;
    const amountNum = Number(sched.amount);

    await createNotification({
      customerId: customer.id,
      type: "PAYMENT_REMINDER",
      title: `Payment Reminder — Due in 7 days`,
      body: `Your ${sched.label} of ₹${fmtINR(amountNum)} is due on ${fmtDate(sched.dueDate)} (in 7 days). Please ensure timely payment.`,
      channels: "IN_APP,SMS,EMAIL",
      email: customer.email ?? customer.user?.email ?? null,
    });

    await prisma.paymentSchedule.update({
      where: { id: sched.id },
      data: { reminderStage: 1 },
    });
  }

  // 3-day reminder: dueDate between 1 and 3 days from now, reminderStage<2
  const reminders3dCandidates = await prisma.paymentSchedule.findMany({
    where: {
      status: "UPCOMING",
      reminderStage: { lt: 2 },
      dueDate: { gte: daysFromNow(1), lte: daysFromNow(3) },
    },
    include: {
      booking: {
        include: {
          customer: { include: { user: true } },
          unit: { include: { project: true } },
        },
      },
    },
  });

  for (const sched of reminders3dCandidates) {
    const { booking } = sched;
    const customer = booking.customer;
    const amountNum = Number(sched.amount);

    await createNotification({
      customerId: customer.id,
      type: "PAYMENT_REMINDER",
      title: `Payment Reminder — Due in 3 days`,
      body: `Reminder: your ${sched.label} of ₹${fmtINR(amountNum)} is due on ${fmtDate(sched.dueDate)} (in 3 days).`,
      channels: "IN_APP,SMS,EMAIL",
      email: customer.email ?? customer.user?.email ?? null,
    });

    await prisma.paymentSchedule.update({
      where: { id: sched.id },
      data: { reminderStage: 2 },
    });
  }

  const markedResult = await prisma.paymentSchedule.updateMany({
    where: { status: "UPCOMING", dueDate: { lt: today } },
    data: { status: "OVERDUE" },
  });

  const warningCandidates = await prisma.paymentSchedule.findMany({
    where: {
      status: "OVERDUE",
      escalationStage: 0,
      dueDate: { lt: daysAgo(15) },
    },
    include: {
      booking: {
        include: {
          customer: { include: { user: true } },
          unit: { include: { project: true } },
        },
      },
    },
  });

  for (const sched of warningCandidates) {
    const { booking } = sched;
    const customer = booking.customer;
    const unit = booking.unit;
    const amountNum = Number(sched.amount);

    await createNotification({
      customerId: customer.id,
      type: "PAYMENT_OVERDUE",
      title: `Payment Overdue — Instalment ${sched.instalmentNo}`,
      body: `Your ${sched.label} of ₹${fmtINR(amountNum)} was due on ${fmtDate(sched.dueDate)} and is now 15 days overdue. Please pay at the earliest to avoid late fees.`,
      channels: "IN_APP,SMS,EMAIL",
      email: customer.email ?? customer.user?.email ?? null,
    });

    await notifyAllAdmins({
      type: "ADMIN_ALERT",
      title: "Customer Payment Overdue",
      body: `${customer.name} (${customer.phone}) — unit ${unit.unitNumber} at ${unit.project.name}. ${sched.label} of ₹${fmtINR(amountNum)} is 15 days overdue.`,
      withEmail: true,
    });

    await prisma.paymentSchedule.update({
      where: { id: sched.id },
      data: { escalationStage: 1, lastEscalationAt: new Date() },
    });
  }

  const penaltyCandidates = await prisma.paymentSchedule.findMany({
    where: {
      status: "OVERDUE",
      escalationStage: 1,
      dueDate: { lt: daysAgo(30) },
    },
    include: {
      booking: {
        include: {
          customer: { include: { user: true } },
          unit: { include: { project: true } },
        },
      },
    },
  });

  for (const sched of penaltyCandidates) {
    const { booking } = sched;
    const customer = booking.customer;
    const unit = booking.unit;
    const amountNum = Number(sched.amount);
    const ratePct = Number(booking.lateFeeRatePct ?? 2);
    const interest = Math.round(amountNum * (ratePct / 100));
    const totalDue = amountNum + interest;

    await prisma.paymentSchedule.update({
      where: { id: sched.id },
      data: {
        escalationStage: 2,
        interestAmount: interest,
        lastEscalationAt: new Date(),
      },
    });

    await createNotification({
      customerId: customer.id,
      type: "PAYMENT_LATE_FEE",
      title: "Late Fee Applied",
      body: `A late fee of ₹${fmtINR(interest)} (${ratePct}% monthly) has been added to your overdue instalment ${sched.instalmentNo} (${sched.label}). Total now due: ₹${fmtINR(totalDue)}.`,
      channels: "IN_APP,SMS,EMAIL",
      email: customer.email ?? customer.user?.email ?? null,
    });

    await notifyAllAdmins({
      type: "ADMIN_ALERT",
      title: "Late Fee Applied",
      body: `${customer.name} — unit ${unit.unitNumber} at ${unit.project.name}. Late fee of ₹${fmtINR(interest)} applied to ${sched.label}. Total outstanding: ₹${fmtINR(totalDue)}.`,
      withEmail: true,
    });
  }

  return {
    marked: markedResult.count,
    warnings: warningCandidates.length,
    penalties: penaltyCandidates.length,
    reminders7d: reminders7dCandidates.length,
    reminders3d: reminders3dCandidates.length,
  };
}
