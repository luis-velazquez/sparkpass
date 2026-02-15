import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, quizResults } from "@/lib/db";
import { eq, desc, and } from "drizzle-orm";
import crypto from "crypto";

// POST - Save a quiz result
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { categorySlug, score, totalQuestions, bestStreak, difficulty } = body;

    if (!categorySlug || typeof score !== "number" || typeof totalQuestions !== "number") {
      return NextResponse.json(
        { error: "Missing required fields: categorySlug, score, totalQuestions" },
        { status: 400 }
      );
    }

    const resultId = crypto.randomUUID();

    await db.insert(quizResults).values({
      id: resultId,
      userId: session.user.id,
      categorySlug,
      difficulty: difficulty || null,
      score,
      totalQuestions,
      bestStreak: bestStreak || 0,
      completedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      resultId,
    });
  } catch (error) {
    console.error("Error saving quiz result:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Get latest quiz results for all categories
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all quiz results for the user, ordered by completedAt desc
    const results = await db
      .select()
      .from(quizResults)
      .where(eq(quizResults.userId, session.user.id))
      .orderBy(desc(quizResults.completedAt));

    // Group by category, keeping only the latest result per category
    const latestByCategory: Record<string, {
      score: number;
      totalQuestions: number;
      percentage: number;
      bestStreak: number;
      completedAt: Date;
    }> = {};

    for (const result of results) {
      if (!latestByCategory[result.categorySlug]) {
        latestByCategory[result.categorySlug] = {
          score: result.score,
          totalQuestions: result.totalQuestions,
          percentage: Math.round((result.score / result.totalQuestions) * 100),
          bestStreak: result.bestStreak,
          completedAt: result.completedAt,
        };
      }
    }

    return NextResponse.json(latestByCategory);
  } catch (error) {
    console.error("Error fetching quiz results:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
