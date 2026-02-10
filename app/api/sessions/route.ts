import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, users, studySessions } from "@/lib/db";
import { eq, sql, and, gte } from "drizzle-orm";
import crypto from "crypto";
import { XP_REWARDS, getLevelFromXP } from "@/lib/levels";

// POST - Create a new study session
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { sessionType, categorySlug } = body;

    if (!sessionType || !["quiz", "flashcard", "mock_exam", "daily_challenge"].includes(sessionType)) {
      return NextResponse.json(
        { error: "Invalid session type" },
        { status: 400 }
      );
    }

    const sessionId = crypto.randomUUID();

    await db.insert(studySessions).values({
      id: sessionId,
      userId: session.user.id,
      sessionType,
      categorySlug: categorySlug || null,
      startedAt: new Date(),
      xpEarned: 0,
    });

    return NextResponse.json({
      success: true,
      sessionId,
    });
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - End a study session and award completion bonus
export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, xpEarned, questionsAnswered, questionsCorrect } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID required" },
        { status: 400 }
      );
    }

    // Update the session with end time, XP, and progress
    await db
      .update(studySessions)
      .set({
        endedAt: new Date(),
        xpEarned: xpEarned || 0,
        questionsAnswered: questionsAnswered ?? null,
        questionsCorrect: questionsCorrect ?? null,
      })
      .where(
        and(
          eq(studySessions.id, sessionId),
          eq(studySessions.userId, session.user.id)
        )
      );

    // Award quiz completion bonus XP
    const completionBonus = XP_REWARDS.QUIZ_COMPLETE;

    // Get current user XP
    const [currentUser] = await db
      .select({ xp: users.xp })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    const newXP = (currentUser?.xp || 0) + completionBonus;
    const newLevel = getLevelFromXP(newXP);

    // Update user XP and check study streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Get user's last study date to calculate streak
    const [user] = await db
      .select({ lastStudyDate: users.lastStudyDate, studyStreak: users.studyStreak })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    let newStreak = 1;
    if (user?.lastStudyDate) {
      const lastStudy = new Date(user.lastStudyDate);
      lastStudy.setHours(0, 0, 0, 0);

      if (lastStudy.getTime() === yesterday.getTime()) {
        // Studied yesterday, increment streak
        newStreak = (user.studyStreak || 0) + 1;
      } else if (lastStudy.getTime() === today.getTime()) {
        // Already studied today, keep current streak
        newStreak = user.studyStreak || 1;
      }
      // Otherwise, streak resets to 1
    }

    await db
      .update(users)
      .set({
        xp: sql`${users.xp} + ${completionBonus}`,
        level: newLevel,
        studyStreak: newStreak,
        lastStudyDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({
      success: true,
      completionBonus,
      newStreak,
    });
  } catch (error) {
    console.error("Error ending session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
