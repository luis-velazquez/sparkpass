"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Zap, Mail, Loader2, CheckCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SparkyMessage } from "@/components/sparky";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Basic validation
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setIsSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-gradient-to-b from-cream to-cream-dark">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-lg">
          <CardHeader className="text-center space-y-4">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2"
            >
              <Zap className="h-10 w-10 text-amber" />
            </Link>
            {isSubmitted ? (
              <>
                <div className="flex justify-center">
                  <div className="rounded-full bg-emerald/10 p-4">
                    <CheckCircle className="h-12 w-12 text-emerald" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold">
                  Check Your Email
                </CardTitle>
                <p className="text-muted-foreground">
                  If an account exists with{" "}
                  <span className="font-medium text-foreground">{email}</span>,
                  you&apos;ll receive a password reset link shortly.
                </p>
              </>
            ) : (
              <>
                <div className="flex justify-center">
                  <div className="rounded-full bg-amber/10 p-4">
                    <Mail className="h-12 w-12 text-amber" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold">
                  Forgot Password?
                </CardTitle>
                <p className="text-muted-foreground">
                  No worries! Enter your email and we&apos;ll send you a reset
                  link.
                </p>
              </>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {isSubmitted ? (
              <>
                {/* Sparky encouragement */}
                <SparkyMessage
                  message="Don't worry, everyone forgets their password sometimes! Check your inbox and you'll be back to studying in no time."
                  size="small"
                />

                {/* Instructions */}
                <div className="rounded-lg bg-muted p-4 text-sm space-y-2">
                  <p className="font-medium">What to do:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Check your spam or junk folder</li>
                    <li>The link expires in 1 hour</li>
                    <li>If you don&apos;t receive an email, try again</li>
                  </ul>
                </div>

                {/* Back to Login */}
                <div className="text-center space-y-4">
                  <Link href="/login">
                    <Button className="bg-amber hover:bg-amber-dark text-white">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Login
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <>
                {/* Sparky encouragement */}
                <SparkyMessage
                  message="Hey there! Happens to the best of us. Let's get you back on track!"
                  size="small"
                />

                {/* Error Message */}
                {error && (
                  <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                    {error}
                  </div>
                )}

                {/* Email Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      autoComplete="email"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-amber hover:bg-amber-dark text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Reset Link"
                    )}
                  </Button>
                </form>

                {/* Back to Login */}
                <div className="text-center">
                  <Link
                    href="/login"
                    className="text-sm text-amber hover:text-amber-dark inline-flex items-center"
                  >
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    Back to Login
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
