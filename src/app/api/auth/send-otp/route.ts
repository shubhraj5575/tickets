import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { generateOtp } from "@/lib/auth";
import { sendOtp } from "@/lib/msg91";
import bcrypt from "bcryptjs";
import { z } from "zod";

const isDev = process.env.NODE_ENV !== "production";

const schema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian phone number"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { phone } = parsed.data;
    const fullPhone = `91${phone}`;

    // Rate limit: relaxed in dev
    const maxAttempts = isDev ? 100 : 3;
    const rateLimitKey = `otp_rate:${phone}`;
    const attempts = await redis.incr(rateLimitKey);
    if (attempts === 1) await redis.expire(rateLimitKey, 600);
    if (attempts > maxAttempts) {
      return NextResponse.json(
        { error: "Too many OTP requests. Try again in 10 minutes." },
        { status: 429 }
      );
    }

    // Fixed "123456" in dev for easy testing
    const otp = isDev ? "123456" : generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);

    await prisma.otpRequest.create({
      data: {
        phone,
        otp: hashedOtp,
        expiresAt: new Date(Date.now() + (isDev ? 24 * 60 * 60 * 1000 : 5 * 60 * 1000)),
      },
    });

    // Send OTP via MSG91 (in dev mode, logs to console)
    await sendOtp(fullPhone);

    if (isDev) {
      console.log(`[DEV] OTP for ${phone}: ${otp}`);
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json(
      { error: "Failed to send OTP" },
      { status: 500 }
    );
  }
}
