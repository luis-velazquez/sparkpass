"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Zap } from "lucide-react";

export function Logo() {
  const { data: session } = useSession();
  const href = session ? "/dashboard" : "/";

  return (
    <Link href={href} className="flex items-center gap-2">
      <Zap className="h-8 w-8 text-amber" />
      <span className="text-xl font-bold text-foreground">SparkyPass</span>
    </Link>
  );
}
