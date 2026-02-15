"use client";

import Link from "next/link";
import { Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <div className="min-h-screen py-12 px-4 bg-cream dark:bg-stone-950 relative">
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(245,158,11,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div className="max-w-3xl mx-auto relative z-10">
        <Card className="shadow-lg border-border dark:border-stone-800 bg-card dark:bg-stone-900/50">
          <CardHeader className="text-center space-y-4">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2"
            >
              <Zap className="h-10 w-10 text-amber" />
            </Link>
            <CardTitle className="text-2xl font-bold font-display">
              Terms and Conditions
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Last updated: February 11, 2026
            </p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-6 text-muted-foreground">
            <section>
              <h2 className="text-lg font-semibold text-foreground">1. Acceptance of Terms</h2>
              <p>
                By creating an account and using SparkyPass, you agree to be bound by these
                Terms and Conditions. If you do not agree, please do not use the service.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">2. Description of Service</h2>
              <p>
                SparkyPass is an online study platform designed to help users prepare for the
                Texas Master Electrician exam. The service includes practice quizzes, flashcards,
                mock exams, load calculators, and other study tools.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">3. User Accounts</h2>
              <p>
                You are responsible for maintaining the confidentiality of your account credentials.
                You agree to provide accurate information during registration and to keep your
                account information up to date.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">4. Acceptable Use</h2>
              <p>You agree not to:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Share your account with others</li>
                <li>Reproduce or distribute the content without permission</li>
                <li>Attempt to reverse engineer or disrupt the service</li>
                <li>Use the service for any unlawful purpose</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">5. Intellectual Property</h2>
              <p>
                All content on SparkyPass, including questions, explanations, and study materials,
                is the property of SparkyPass and is protected by copyright. NEC code references
                are used for educational purposes.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">6. Disclaimer</h2>
              <p>
                SparkyPass is a study aid and does not guarantee passing the Texas Master
                Electrician exam. The content is provided &quot;as is&quot; for educational purposes.
                Always refer to the current NEC codebook and official exam preparation materials.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">7. Privacy</h2>
              <p>
                We collect and use your personal information only as needed to provide the service.
                Your email address is used for account verification, password resets, and optional
                newsletter communications. We do not sell your personal information to third parties.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">8. Changes to Terms</h2>
              <p>
                We reserve the right to update these terms at any time. Continued use of the
                service after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">9. Contact</h2>
              <p>
                If you have questions about these terms, please contact us at{" "}
                <a
                  href="mailto:noreply@sparkypass.com"
                  className="text-amber hover:text-amber-dark underline"
                >
                  noreply@sparkypass.com
                </a>
                .
              </p>
            </section>

            <section className="mt-8 pt-6 border-t border-border">
              <h2 className="text-lg font-semibold text-foreground">Official NEC&reg; Disclaimer</h2>
              <p>
                This app is an independent educational tool and is not affiliated with, endorsed by,
                or sponsored by the National Fire Protection Association (NFPA). While we strive to
                provide the most accurate information based on the 2023 National Electrical Code&reg;,
                electrical codes vary by jurisdiction and are subject to change. This content is for
                educational purposes only and does not constitute professional engineering or
                installation advice. Always consult your local Authority Having Jurisdiction (AHJ)
                and the official NFPA 70&reg; text before performing electrical work.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
