"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

interface SessionProviderProps {
  children: React.ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Provider = NextAuthSessionProvider as any;
  return <Provider>{children}</Provider>;
}
