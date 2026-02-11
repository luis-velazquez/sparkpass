import { NextResponse } from "next/server";
import { db, users, verificationTokens } from "@/lib/db";
import { eq, and, gt } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 }
      );
    }

    // Find the verification token
    const [verificationRecord] = await db
      .select()
      .from(verificationTokens)
      .where(
        and(
          eq(verificationTokens.token, token),
          gt(verificationTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!verificationRecord) {
      return NextResponse.json(
        { error: "Invalid or expired verification token" },
        { status: 400 }
      );
    }

    // Update user's email verification status
    await db
      .update(users)
      .set({ emailVerified: true, updatedAt: new Date() })
      .where(eq(users.id, verificationRecord.userId));

    // Set a short expiry on the token (60s) so it can be used for auto-login
    const autoLoginExpiry = new Date();
    autoLoginExpiry.setSeconds(autoLoginExpiry.getSeconds() + 60);
    await db
      .update(verificationTokens)
      .set({ expiresAt: autoLoginExpiry })
      .where(eq(verificationTokens.id, verificationRecord.id));

    // Get user email for the frontend
    const [verifiedUser] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, verificationRecord.userId))
      .limit(1);

    return NextResponse.json({ success: true, email: verifiedUser?.email });
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
