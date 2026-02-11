"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Menu,
  Zap,
  LogOut,
  Loader2,
  LayoutDashboard,
  BookOpen,
  Layers,
  ClipboardCheck,
  Calculator,
  Mail,
  ChevronDown,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/quiz", label: "Quiz", icon: BookOpen },
  { href: "/flashcards", label: "Flashcards", icon: Layers },
  { href: "/mock-exam", label: "Mock Exam", icon: ClipboardCheck },
  { href: "/load-calculator", label: "Load Calculator", icon: Calculator },
  { href: "/contact", label: "Contact", icon: Mail },
];

const calcSubLinks = [
  { href: "/load-calculator", label: "Residential", icon: Calculator },
  { href: "/load-calculator/commercial", label: "Commercial", icon: Building2 },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const [calcExpanded, setCalcExpanded] = useState(false);
  const { data: session, status } = useSession();
  const pathname = usePathname();

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
          <span className="font-bold">SparkyPass</span>
        </SheetTitle>

        <nav className="flex flex-col gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || pathname.startsWith(link.href + "/");

            if (link.href === "/load-calculator") {
              return (
                <div key={link.href}>
                  <button
                    onClick={() => setCalcExpanded(!calcExpanded)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors min-h-[44px] w-full ${
                      isActive
                        ? "bg-amber/10 text-amber font-medium border-l-3 border-amber"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? "text-amber" : "text-muted-foreground"}`} />
                    <span className="flex-1 text-left">{link.label}</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${calcExpanded ? "rotate-180" : ""}`} />
                  </button>
                  {calcExpanded && (
                    <div className="ml-4 mt-1 flex flex-col gap-1">
                      {calcSubLinks.map((sub) => {
                        const SubIcon = sub.icon;
                        const subActive = pathname === sub.href;
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            onClick={closeSheet}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors min-h-[40px] ${
                              subActive
                                ? "bg-amber/10 text-amber font-medium"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            }`}
                          >
                            <SubIcon className={`h-4 w-4 flex-shrink-0 ${subActive ? "text-amber" : "text-muted-foreground"}`} />
                            {sub.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeSheet}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors min-h-[44px] ${
                  isActive
                    ? "bg-amber/10 text-amber font-medium border-l-3 border-amber"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? "text-amber" : "text-muted-foreground"}`} />
                {link.label}
              </Link>
            );
          })}
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
