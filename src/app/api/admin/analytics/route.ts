import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  const [
    totalUsers,
    activeBookings,
    totalCollectionResult,
    overdueResult,
    paidOnTime,
    overdueCount,
    ticketOpen,
    ticketInProgress,
    ticketResolved,
    referralLeads,
    referralSiteVisits,
    referralBookings,
    referralRewards,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.booking.count({ where: { status: "ACTIVE" } }),
    prisma.payment.aggregate({ _sum: { amount: true } }),
    prisma.paymentSchedule.aggregate({ _sum: { amount: true }, where: { status: "OVERDUE" } }),
    prisma.paymentSchedule.count({ where: { status: "PAID" } }),
    prisma.paymentSchedule.count({ where: { status: "OVERDUE" } }),
    prisma.ticket.count({ where: { status: "OPEN" } }),
    prisma.ticket.count({ where: { status: "IN_PROGRESS" } }),
    prisma.ticket.count({ where: { status: { in: ["RESOLVED", "CLOSED"] } } }),
    prisma.referral.count({ where: { status: "LEAD" } }),
    prisma.referral.count({ where: { status: "SITE_VISIT" } }),
    prisma.referral.count({ where: { status: { in: ["BOOKING", "REWARD_PENDING", "REWARD_PAID"] } } }),
    prisma.referral.count({ where: { status: "REWARD_PAID" } }),
  ]);

  return NextResponse.json({
    totalUsers,
    activeBookings,
    totalCollection: totalCollectionResult._sum.amount || 0,
    overdueAmount: overdueResult._sum.amount || 0,
    paymentStats: { onTime: paidOnTime, overdue: overdueCount },
    ticketStats: { open: ticketOpen, inProgress: ticketInProgress, resolved: ticketResolved },
    referralFunnel: { leads: referralLeads, siteVisits: referralSiteVisits, bookings: referralBookings, rewards: referralRewards },
  });
}
