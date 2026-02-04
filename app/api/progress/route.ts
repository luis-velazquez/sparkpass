import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, users, userProgress } from "@/lib/db";
import { eq, sql } from "drizzle-orm";
import crypto from "crypto";
import { XP_REWARDS, getLevelFromXP, checkLevelUp } from "@/lib/levels";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { questionId, isCorrect, timeSpentSeconds } = body;

    if (!questionId || typeof isCorrect !== "boolean") {
      return NextResponse.json(
        { error: "Missing required fields: questionId and isCorrect" },
        { status: 400 }
      );
    }

    // Generate unique ID for progress entry
    const progressId = crypto.randomUUID();

    // Get current user XP for level-up detection
    const [currentUser] = await db
      .select({ xp: users.xp, level: users.level })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    const previousXP = currentUser?.xp || 0;

    // Insert progress record
    await db.insert(userProgress).values({
      id: progressId,
      userId: session.user.id,
      questionId,
      isCorrect,
      timeSpentSeconds: timeSpentSeconds || null,
      answeredAt: new Date(),
    });

    // If correct, award XP and update user record
    let xpEarned = 0;
    let levelUp = null;

    if (isCorrect) {
      xpEarned = XP_REWARDS.CORRECT_ANSWER;
      const newXP = previousXP + xpEarned;
      const newLevel = getLevelFromXP(newXP);

      // Check for level-up
      levelUp = checkLevelUp(previousXP, newXP);

      await db
        .update(users)
        .set({
          xp: sql`${users.xp} + ${xpEarned}`,
          level: newLevel,
          updatedAt: new Date(),
        })
        .where(eq(users.id, session.user.id));
    }
    // Note: lastStudyDate and studyStreak are updated in /api/sessions when the session ends

    // Get updated user XP
    const [updatedUser] = await db
      .select({ xp: users.xp, level: users.level })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    return NextResponse.json({
      success: true,
      progressId,
      xpEarned,
      previousXP,
      totalXp: updatedUser?.xp || 0,
      level: updatedUser?.level || 1,
      levelUp,
    });
  } catch (error) {
    console.error("Error saving progress:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
