import { NextResponse } from "next/server";
import { db, users, verificationTokens } from "@/lib/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";

// Generate a secure random token
function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Get token expiry (24 hours from now)
function getTokenExpiry(): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 24);
  return expiry;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (!user) {
      // Don't reveal if email exists - just return success
      return NextResponse.json({ success: true });
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Email is already verified" },
        { status: 400 }
      );
    }

    // Delete any existing verification tokens for this user
    await db
      .delete(verificationTokens)
      .where(eq(verificationTokens.userId, user.id));

    // Generate new verification token
    const token = generateToken();
    const tokenId = crypto.randomUUID();
    const expiresAt = getTokenExpiry();

    await db.insert(verificationTokens).values({
      id: tokenId,
      userId: user.id,
      token,
      expiresAt,
    });

    // Build verification URL
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const verificationUrl = `${baseUrl}/verify-email?token=${token}`;

    // Log verification email (MVP - console.log instead of sending)
    console.log("=".repeat(60));
    console.log("[EMAIL VERIFICATION] Verification email would be sent:");
    console.log(`To: ${user.email}`);
    console.log(`Name: ${user.name}`);
    console.log(`Verification URL: ${verificationUrl}`);
    console.log(`Token expires: ${expiresAt.toISOString()}`);
    console.log("=".repeat(60));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
