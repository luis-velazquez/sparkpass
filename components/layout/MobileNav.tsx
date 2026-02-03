"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Menu, Zap, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";

const navLinks = [
  { href: "/quiz", label: "Quiz" },
  { href: "/flashcards", label: "Flashcards" },
  { href: "/mock-exam", label: "Mock Exam" },
  { href: "/load-calculator", label: "Load Calculator" },
  { href: "/contact", label: "Contact" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const { data: session, status } = useSession();

  const closeSheet = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="min-w-[44px] min-h-[44px]">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[280px] sm:w-[320px]">
        <SheetTitle className="flex items-center gap-2 mb-6">
          <Zap className="h-6 w-6 text-amber" />
          <span className="font-bold">SparkPass</span>
        </SheetTitle>

        <nav className="flex flex-col gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={closeSheet}
              className="flex items-center px-4 py-3 text-foreground hover:bg-muted rounded-lg transition-colors min-h-[44px]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-col gap-3 mt-6 pt-6 border-t border-border">
          {status === "loading" ? (
            <Button variant="outline" className="w-full min-h-[44px]" disabled>
              <Loader2 className="h-4 w-4 animate-spin" />
            </Button>
          ) : session ? (
            <Button
              variant="outline"
              className="w-full min-h-[44px] gap-2 text-destructive hover:text-destructive"
              onClick={() => {
                closeSheet();
                signOut({ callbackUrl: "/" });
              }}
            >
              <LogOut className="h-4 w-4" />
              Log out
            </Button>
          ) : (
            <>
              <Link href="/login" className="w-full" onClick={closeSheet}>
                <Button variant="outline" className="w-full min-h-[44px]">
                  Log in
                </Button>
              </Link>
              <Link href="/register" className="w-full" onClick={closeSheet}>
                <Button className="w-full bg-amber hover:bg-amber-dark text-white min-h-[44px]">
                  Sign up
                </Button>
              </Link>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
