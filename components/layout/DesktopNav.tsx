"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/quiz", label: "Quiz" },
  { href: "/flashcards", label: "Flashcards" },
  { href: "/mock-exam", label: "Mock Exam" },
  { href: "/load-calculator", label: "Load Calculator" },
  { href: "/contact", label: "Contact" },
];

export function DesktopNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex items-center gap-1">
      {navLinks.map((link) => {
        const isActive = pathname === link.href || pathname.startsWith(link.href + "/");

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? "bg-amber/10 text-amber"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
