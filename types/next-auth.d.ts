// NextAuth.js type extensions for SparkyPass
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      profileComplete: boolean;
      isEmailVerified: boolean;
      subscriptionStatus: "trialing" | "active" | "past_due" | "canceled" | "expired" | null;
      trialEndsAt: string | null;
      subscriptionPeriodEnd: string | null;
    };
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    profileComplete?: boolean;
    isEmailVerified?: boolean;
    subscriptionStatus?: "trialing" | "active" | "past_due" | "canceled" | "expired" | null;
    trialEndsAt?: string | null;
    subscriptionPeriodEnd?: string | null;
  }
}
