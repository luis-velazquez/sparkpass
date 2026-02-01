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

    // Delete the used verification token
    await db
      .delete(verificationTokens)
      .where(eq(verificationTokens.id, verificationRecord.id));

    // Log verification success (MVP - would send confirmation email in production)
    console.log(`[EMAIL VERIFICATION] User ${verificationRecord.userId} verified their email`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
