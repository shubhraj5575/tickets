import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { signAccessToken } from "@/lib/auth";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: "No refresh token" },
        { status: 401 }
      );
    }

    const session = await prisma.session.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Session expired" },
        { status: 401 }
      );
    }

    const accessToken = await signAccessToken({
      userId: session.user.id,
      phone: session.user.phone,
      role: session.user.role,
    });

    return NextResponse.json({ success: true, accessToken });
  } catch (error) {
    console.error("Refresh token error:", error);
    return NextResponse.json(
      { error: "Refresh failed" },
      { status: 500 }
    );
  }
}
