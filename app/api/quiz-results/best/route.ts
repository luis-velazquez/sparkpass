import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, quizResults } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get("category");
    const difficulty = searchParams.get("difficulty");

    if (!categorySlug) {
      return NextResponse.json({ error: "category is required" }, { status: 400 });
    }

    const conditions = [
      eq(quizResults.userId, session.user.id),
      eq(quizResults.categorySlug, categorySlug),
    ];

    if (difficulty) {
      conditions.push(eq(quizResults.difficulty, difficulty));
    }

    const results = await db
      .select({
        score: quizResults.score,
        totalQuestions: quizResults.totalQuestions,
        completedAt: quizResults.completedAt,
      })
      .from(quizResults)
      .where(and(...conditions))
      .orderBy(desc(quizResults.completedAt));

    if (results.length === 0) {
      return NextResponse.json({ bestPercentage: null });
    }

    // Find the highest percentage across all attempts
    let bestPercentage = 0;
    for (const r of results) {
      const pct = Math.round((r.score / r.totalQuestions) * 100);
      if (pct > bestPercentage) bestPercentage = pct;
    }

    return NextResponse.json({ bestPercentage });
  } catch (error) {
    console.error("Error fetching best quiz result:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
