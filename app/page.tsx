"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Zap,
  Brain,
  BookOpen,
  ClipboardCheck,
  TrendingUp,
  Mail,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SparkyMessage } from "@/components/sparky";

const features = [
  {
    title: "Interactive Quizzes",
    description:
      "Practice with NEC-based questions covering all major exam topics. Get instant feedback and learn from explanations.",
    icon: Brain,
    color: "text-purple",
    bgColor: "bg-purple-soft",
  },
  {
    title: "Flashcards",
    description:
      "Memorize key formulas, code references, and concepts with our spaced repetition flashcard system.",
    icon: BookOpen,
    color: "text-emerald",
    bgColor: "bg-emerald-light/20",
  },
  {
    title: "Mock Exams",
    description:
      "Simulate the real exam experience with timed practice tests that mirror the actual exam format.",
    icon: ClipboardCheck,
    color: "text-amber",
    bgColor: "bg-amber-light/20",
  },
  {
    title: "Progress Tracking",
    description:
      "Monitor your improvement over time with detailed analytics on your strengths and areas to focus on.",
    icon: TrendingUp,
    color: "text-purple",
    bgColor: "bg-purple-soft",
  },
];

export default function Home() {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      // For MVP, just show success message
      setIsSubscribed(true);
      setEmail("");
    }
  };

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-cream to-cream-dark py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center justify-center gap-2 mb-6">
                <Zap className="h-12 w-12 md:h-16 md:w-16 text-amber" />
              </div>
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                Pass Your Texas Master Electrician Exam
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-4">
                Only <span className="font-semibold text-amber">26%</span> of
                candidates pass the Texas Master Electrician exam on their first
                attempt.
              </p>
              <p className="text-lg md:text-xl text-foreground mb-8">
                With SparkyPass, you&apos;ll join the successful minority. Our
                interactive study tools, personalized progress tracking, and
                encouraging mentor Sparky will guide you every step of the way.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register">
                  <Button
                    size="lg"
                    className="bg-amber hover:bg-amber-dark text-white text-lg px-8 py-6 w-full sm:w-auto"
                  >
                    Start Your Journey
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-lg px-8 py-6 w-full sm:w-auto"
                  >
                    Sign In
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-amber/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple/5 rounded-full translate-x-1/3 translate-y-1/3" />
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need to Pass
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Our comprehensive study platform covers all aspects of the Texas
              Master Electrician exam, aligned with the 2023 NEC.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <div
                      className={`w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-4`}
                    >
                      <feature.icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Sparky Introduction Section */}
      <section className="py-16 md:py-24 bg-cream-dark">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-8"
            >
              <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
                Meet Your Study Buddy
              </h2>
              <p className="text-muted-foreground text-lg">
                Sparky the electrician is here to encourage you every step of
                the way!
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex justify-center"
            >
              <SparkyMessage
                size="large"
                message="Hey there, future Master Electrician! I'm Sparky, and I'll be your guide on this journey. The exam might seem tough, but with consistent practice and the right mindset, you've got this! Remember, every master electrician started exactly where you are right now. Let's spark some knowledge together!"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats/Social Proof Section */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-4xl md:text-5xl font-bold text-amber mb-2">
                500+
              </p>
              <p className="text-muted-foreground">Practice Questions</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-bold text-emerald mb-2">
                3
              </p>
              <p className="text-muted-foreground">Key NEC Chapters Covered</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-bold text-purple mb-2">
                24/7
              </p>
              <p className="text-muted-foreground">Access Anytime</p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 md:py-24 bg-purple-soft">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto text-center">
            <Mail className="h-12 w-12 text-purple mx-auto mb-4" />
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Stay in the Loop
            </h2>
            <p className="text-muted-foreground mb-8">
              Get study tips, NEC updates, and exclusive content delivered to
              your inbox. No spam, just helpful resources for your exam prep.
            </p>
            {isSubscribed ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-center gap-2 text-emerald"
              >
                <CheckCircle className="h-6 w-6" />
                <span className="text-lg font-medium">
                  Thanks for subscribing!
                </span>
              </motion.div>
            ) : (
              <form
                onSubmit={handleNewsletterSubmit}
                className="flex flex-col sm:flex-row gap-3"
              >
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 bg-white"
                />
                <Button
                  type="submit"
                  className="bg-purple hover:bg-purple-dark text-white"
                >
                  Subscribe
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-background to-cream">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
            Ready to Become a Master Electrician?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
            Join SparkyPass today and take the first step toward passing your
            Texas Master Electrician exam with confidence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-amber hover:bg-amber-dark text-white text-lg px-8 py-6 w-full sm:w-auto"
              >
                Sign Up Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 w-full sm:w-auto"
              >
                Log In
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
