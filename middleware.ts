// Protected routes middleware for SparkPass
// Simplified version that doesn't require database access
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Routes that require authentication
const protectedRoutes = [
  "/dashboard",
  "/quiz",
  "/flashcards",
  "/mock-exam",
  "/daily",
  "/bookmarks",
  "/profile",
];

// Routes that are only for unauthenticated users (auth pages)
const authRoutes = ["/login", "/register"];

function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function isAuthRoute(pathname: string): boolean {
  if (pathname === "/register/profile") {
    return false;
  }
  return authRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get JWT token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });

  const isAuthenticated = !!token;
  const profileComplete = (token?.profileComplete as boolean) ?? false;

  // Protected routes: redirect to login if not authenticated
  if (isProtectedRoute(pathname)) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // If authenticated but profile not complete, redirect to profile completion
    if (!profileComplete && pathname !== "/register/profile") {
      return NextResponse.redirect(new URL("/register/profile", request.url));
    }
  }

  // /register/profile requires authentication but not complete profile
  if (pathname === "/register/profile") {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (profileComplete) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Auth routes: redirect to dashboard if already authenticated
  if (isAuthRoute(pathname)) {
    if (isAuthenticated) {
      if (!profileComplete) {
        return NextResponse.redirect(new URL("/register/profile", request.url));
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Homepage: redirect authenticated users to dashboard
  if (pathname === "/") {
    if (isAuthenticated) {
      if (!profileComplete) {
        return NextResponse.redirect(new URL("/register/profile", request.url));
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
