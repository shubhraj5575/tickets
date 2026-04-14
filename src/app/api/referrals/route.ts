import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/api-auth";

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if ("error" in auth) return auth.error;

  const customer = await prisma.customer.findUnique({
    where: { userId: auth.user.userId },
  });
  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const referrals = await prisma.referral.findMany({
    where: { referrerId: customer.id },
    orderBy: { createdAt: "desc" },
  });

  const totalReferrals = referrals.length;
  const siteVisits = referrals.filter((r) => r.status === "SITE_VISIT" || r.status === "BOOKING" || r.status === "REWARD_PENDING" || r.status === "REWARD_PAID").length;
  const bookings = referrals.filter((r) => r.status === "BOOKING" || r.status === "REWARD_PENDING" || r.status === "REWARD_PAID").length;
  const totalRewards = referrals
    .filter((r) => r.status === "REWARD_PAID")
    .reduce((sum, r) => sum + (r.rewardAmount || 0), 0);

  // Generate a referral code for the customer if they don't have one yet
  const existingCode = referrals.length > 0 ? referrals[0].referralCode : null;
  const referralCode = existingCode || generateReferralCode(customer.name);

  return NextResponse.json({
    referralCode,
    totalReferrals,
    siteVisits,
    bookings,
    totalRewards,
    referrals: referrals.map((r) => ({
      id: r.id,
      refereeName: r.refereeName,
      refereePhone: r.refereePhone,
      status: r.status,
      rewardAmount: r.rewardAmount,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if ("error" in auth) return auth.error;

  const customer = await prisma.customer.findUnique({
    where: { userId: auth.user.userId },
  });
  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const body = await request.json();
  const { refereeName, refereePhone } = body;

  if (!refereeName || !refereePhone) {
    return NextResponse.json(
      { error: "refereeName and refereePhone are required" },
      { status: 400 }
    );
  }

  const referralCode = generateReferralCode(customer.name);

  const referral = await prisma.referral.create({
    data: {
      referrerId: customer.id,
      referralCode,
      refereeName,
      refereePhone,
      status: "LEAD",
    },
  });

  return NextResponse.json({
    id: referral.id,
    referralCode: referral.referralCode,
    refereeName: referral.refereeName,
    refereePhone: referral.refereePhone,
    status: referral.status,
    createdAt: referral.createdAt.toISOString(),
  });
}

function generateReferralCode(name: string): string {
  const prefix = name
    .replace(/[^a-zA-Z]/g, "")
    .substring(0, 4)
    .toUpperCase();
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}${suffix}`;
}
