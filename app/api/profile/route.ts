import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user] = await db
      .select({
        name: users.name,
        email: users.email,
        username: users.username,
        city: users.city,
        state: users.state,
        dateOfBirth: users.dateOfBirth,
        targetExamDate: users.targetExamDate,
        newsletterOptedIn: users.newsletterOptedIn,
        xp: users.xp,
        level: users.level,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      name: user.name,
      email: user.email,
      username: user.username,
      city: user.city,
      state: user.state,
      dateOfBirth: user.dateOfBirth?.toISOString() || null,
      targetExamDate: user.targetExamDate?.toISOString() || null,
      newsletterOptedIn: user.newsletterOptedIn,
      xp: user.xp,
      level: user.level,
      createdAt: user.createdAt?.toISOString() || null,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { targetExamDate, newsletterOptedIn } = body;

    // Build update object with only provided fields
    const updateData: {
      targetExamDate?: Date | null;
      newsletterOptedIn?: boolean;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    // Handle targetExamDate update
    if (targetExamDate !== undefined) {
      if (targetExamDate === null) {
        updateData.targetExamDate = null;
      } else {
        const examDate = new Date(targetExamDate);
        if (isNaN(examDate.getTime())) {
          return NextResponse.json(
            { error: "Invalid target exam date" },
            { status: 400 }
          );
        }
        updateData.targetExamDate = examDate;
      }
    }

    // Handle newsletterOptedIn update
    if (newsletterOptedIn !== undefined) {
      updateData.newsletterOptedIn = Boolean(newsletterOptedIn);
    }

    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, session.user.id));

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Get the authenticated user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be logged in to complete your profile" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { username, dateOfBirth, city, state, targetExamDate, newsletterOptedIn } = body;

    // Validate username
    if (!username || typeof username !== "string" || username.trim().length === 0) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    const trimmedUsername = username.trim();

    if (trimmedUsername.length < 3 || trimmedUsername.length > 30) {
      return NextResponse.json(
        { error: "Username must be between 3 and 30 characters" },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
      return NextResponse.json(
        { error: "Username can only contain letters, numbers, underscores, and hyphens" },
        { status: 400 }
      );
    }

    // Check username uniqueness
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, trimmedUsername))
      .limit(1);

    if (existingUser && existingUser.id !== session.user.id) {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 409 }
      );
    }

    // Validate required fields
    if (!dateOfBirth) {
      return NextResponse.json(
        { error: "Date of birth is required" },
        { status: 400 }
      );
    }

    if (!city || typeof city !== "string" || city.trim().length === 0) {
      return NextResponse.json(
        { error: "City is required" },
        { status: 400 }
      );
    }

    if (!state || typeof state !== "string" || state.trim().length === 0) {
      return NextResponse.json(
        { error: "State is required" },
        { status: 400 }
      );
    }

    if (!targetExamDate) {
      return NextResponse.json(
        { error: "Target exam date is required" },
        { status: 400 }
      );
    }

    // Parse and validate dates
    const dob = new Date(dateOfBirth);
    const examDate = new Date(targetExamDate);

    if (isNaN(dob.getTime())) {
      return NextResponse.json(
        { error: "Invalid date of birth" },
        { status: 400 }
      );
    }

    if (isNaN(examDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid target exam date" },
        { status: 400 }
      );
    }

    // Validate date of birth (must be at least 18 years old)
    const eighteenYearsAgo = new Date();
    eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
    if (dob > eighteenYearsAgo) {
      return NextResponse.json(
        { error: "You must be at least 18 years old" },
        { status: 400 }
      );
    }

    // Validate target exam date (must be in the future)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (examDate < today) {
      return NextResponse.json(
        { error: "Target exam date must be in the future" },
        { status: 400 }
      );
    }

    // Update user profile
    await db
      .update(users)
      .set({
        username: trimmedUsername,
        dateOfBirth: dob,
        city: city.trim(),
        state: state.trim(),
        targetExamDate: examDate,
        newsletterOptedIn: Boolean(newsletterOptedIn),
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
