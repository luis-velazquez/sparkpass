import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, bookmarks } from "@/lib/db";
import { eq, and } from "drizzle-orm";

// DELETE - Remove a bookmark by ID
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Missing bookmark ID" },
        { status: 400 }
      );
    }

    // Delete bookmark only if it belongs to the current user
    await db
      .delete(bookmarks)
      .where(
        and(eq(bookmarks.id, id), eq(bookmarks.userId, session.user.id))
      );

    return NextResponse.json({
      success: true,
      message: "Bookmark removed",
    });
  } catch (error) {
    console.error("Error deleting bookmark:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
