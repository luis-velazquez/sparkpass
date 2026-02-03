import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Zap } from "lucide-react";
import { MobileNav } from "@/components/layout/MobileNav";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { AuthButtons } from "@/components/layout/AuthButtons";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SparkPass | Texas Master Electrician Exam Prep",
  description:
    "Pass your Texas Master Electrician exam with SparkPass. Interactive quizzes, flashcards, and personalized study plans with Sparky your mentor.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
        <SessionProvider>
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2">
              <Zap className="h-8 w-8 text-amber" />
              <span className="text-xl font-bold text-foreground">
                SparkPass
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/quiz"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Quiz
              </Link>
              <Link
                href="/flashcards"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Flashcards
              </Link>
              <Link
                href="/mock-exam"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Mock Exam
              </Link>
              <Link
                href="/load-calculator"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Load Calculator
              </Link>
              <Link
                href="/contact"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Contact
              </Link>
            </nav>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center gap-2">
              <ThemeToggle />
              <AuthButtons />
            </div>

            {/* Mobile Menu */}
            <div className="flex items-center gap-1 md:hidden">
              <ThemeToggle />
              <MobileNav />
            </div>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-border bg-card">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber" />
                <span className="font-semibold">SparkPass</span>
              </div>
              <nav className="flex gap-6 text-sm text-muted-foreground">
                <Link href="/contact" className="hover:text-foreground">
                  Contact
                </Link>
                <Link href="/privacy" className="hover:text-foreground">
                  Privacy
                </Link>
                <Link href="/terms" className="hover:text-foreground">
                  Terms
                </Link>
              </nav>
              <p className="text-sm text-muted-foreground">
                &copy; {new Date().getFullYear()} SparkPass. All rights
                reserved.
              </p>
            </div>
          </div>
        </footer>
        </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
