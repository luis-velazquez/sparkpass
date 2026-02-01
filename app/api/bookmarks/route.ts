import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, bookmarks } from "@/lib/db";
import { eq, and, sql } from "drizzle-orm";
import crypto from "crypto";

// GET - List all bookmarks for the current user
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userBookmarks = await db
      .select({
        id: bookmarks.id,
        questionId: bookmarks.questionId,
        createdAt: bookmarks.createdAt,
      })
      .from(bookmarks)
      .where(eq(bookmarks.userId, session.user.id))
      .orderBy(sql`${bookmarks.createdAt} DESC`);

    return NextResponse.json({
      bookmarks: userBookmarks.map((b) => ({
        id: b.id,
        questionId: b.questionId,
        createdAt: b.createdAt?.toISOString() || null,
      })),
    });
  } catch (error) {
    console.error("Error fetching bookmarks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Add a new bookmark
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { questionId } = body;

    if (!questionId) {
      return NextResponse.json(
        { error: "Missing required field: questionId" },
        { status: 400 }
      );
    }

    // Check if bookmark already exists
    const [existing] = await db
      .select({ id: bookmarks.id })
      .from(bookmarks)
      .where(
        and(
          eq(bookmarks.userId, session.user.id),
          eq(bookmarks.questionId, questionId)
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json({
        success: true,
        bookmarkId: existing.id,
        message: "Bookmark already exists",
      });
    }

    // Create new bookmark
    const bookmarkId = crypto.randomUUID();

    await db.insert(bookmarks).values({
      id: bookmarkId,
      userId: session.user.id,
      questionId,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      bookmarkId,
    });
  } catch (error) {
    console.error("Error creating bookmark:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
