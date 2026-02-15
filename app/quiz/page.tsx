"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Zap, Shield, ChevronRight, Navigation, Table, Box, CircleDot, TrendingDown, Cog, Thermometer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SparkyMessage } from "@/components/sparky";
import { CATEGORIES } from "@/types/question";
import { getCategoryCounts } from "@/lib/questions";

interface QuizResultData {
  score: number;
  totalQuestions: number;
  percentage: number;
  bestStreak: number;
  completedAt: Date;
}

// Map category slugs to icons
const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "load-calculations": BookOpen,
  "grounding-bonding": Shield,
  services: Zap,
  "textbook-navigation": Navigation,
  "chapter-9-tables": Table,
  "box-fill": Box,
  "conduit-fill": CircleDot,
  "voltage-drop": TrendingDown,
  "motor-calculations": Cog,
  "temperature-correction": Thermometer,
};

// Map category slugs to colors
const categoryColors = {
  "load-calculations": {
    icon: "text-purple",
    bg: "bg-purple-soft dark:bg-purple/10",
    border: "hover:border-purple/50",
  },
  "grounding-bonding": {
    icon: "text-emerald",
    bg: "bg-emerald/10",
    border: "hover:border-emerald/50",
  },
  services: {
    icon: "text-amber",
    bg: "bg-amber/10",
    border: "hover:border-amber/50",
  },
  "textbook-navigation": {
    icon: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "hover:border-blue-500/50",
  },
  "chapter-9-tables": {
    icon: "text-orange-500",
    bg: "bg-orange-500/10",
    border: "hover:border-orange-500/50",
  },
  "box-fill": {
    icon: "text-cyan-500",
    bg: "bg-cyan-500/10",
    border: "hover:border-cyan-500/50",
  },
  "conduit-fill": {
    icon: "text-rose-500",
    bg: "bg-rose-500/10",
    border: "hover:border-rose-500/50",
  },
  "voltage-drop": {
    icon: "text-yellow-500",
    bg: "bg-yellow-500/10",
    border: "hover:border-yellow-500/50",
  },
  "motor-calculations": {
    icon: "text-indigo-500",
    bg: "bg-indigo-500/10",
    border: "hover:border-indigo-500/50",
  },
  "temperature-correction": {
    icon: "text-red-400",
    bg: "bg-red-400/10",
    border: "hover:border-red-400/50",
  },
};

export default function QuizPage() {
  const categoryCounts = getCategoryCounts();
  const [lastScores, setLastScores] = useState<Record<string, QuizResultData>>({});

  useEffect(() => {
    fetch("/api/quiz-results")
      .then((res) => res.ok ? res.json() : {})
      .then((data) => setLastScores(data))
      .catch(() => {});
  }, []);

  return (
    <main className="relative min-h-screen bg-cream dark:bg-stone-950">
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(245,158,11,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div className="container mx-auto px-4 py-8 relative z-10">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground mb-2">
          Choose a <span className="text-amber">Category</span>
        </h1>
        <p className="text-muted-foreground">
          Test your knowledge across key NEC articles. Each quiz pulls from our
          question bank to keep you sharp!
        </p>
      </motion.div>

      {/* Category Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
        {CATEGORIES.map((category, index) => {
          const Icon = categoryIcons[category.slug];
          const colors = categoryColors[category.slug];
          const questionCount = categoryCounts[category.slug];
          const lastScore = lastScores[category.slug];

          return (
            <motion.div
              key={category.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
            >
              <Link href={`/quiz/${category.slug}`}>
                <Card
                  className={`h-full hover:shadow-lg transition-all duration-300 cursor-pointer group pressable border-border dark:border-stone-800 bg-card dark:bg-stone-900/50 hover:border-amber/30 hover:shadow-[0_0_20px_rgba(245,158,11,0.06)] ${colors.border}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div
                        className={`w-12 h-12 rounded-lg ${colors.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
                      >
                        <Icon className={`h-6 w-6 ${colors.icon}`} />
                      </div>
                      <div className="flex items-center gap-2">
                        {lastScore && (
                          <span
                            className={`text-sm font-bold px-2 py-0.5 rounded ${
                              lastScore.percentage >= 80
                                ? "bg-emerald/20 text-emerald"
                                : lastScore.percentage >= 60
                                ? "bg-amber/20 text-amber"
                                : "bg-red-500/20 text-red-500"
                            }`}
                          >
                            {lastScore.percentage}%
                          </span>
                        )}
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        {category.description}
                      </p>
                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <span className="text-sm font-medium text-purple">
                          {category.necArticle}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {questionCount} questions
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Sparky Tip */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <SparkyMessage
          size="medium"
          message="Pro tip: Start with the areas where you feel least confident! Tackling your weak spots first is the fastest path to mastery. Every electrician has their Achilles' heel - find yours and strengthen it!"
        />
      </motion.div>
      </div>
    </main>
  );
}
