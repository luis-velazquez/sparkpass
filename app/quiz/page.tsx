"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Zap, Shield, ChevronRight, Navigation } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SparkyMessage } from "@/components/sparky";
import { CATEGORIES } from "@/types/question";
import { getCategoryCounts } from "@/lib/questions";

// Map category slugs to icons
const categoryIcons = {
  "load-calculations": BookOpen,
  "grounding-bonding": Shield,
  services: Zap,
  "textbook-navigation": Navigation,
};

// Map category slugs to colors
const categoryColors = {
  "load-calculations": {
    icon: "text-purple",
    bg: "bg-purple-soft",
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
};

export default function QuizPage() {
  const categoryCounts = getCategoryCounts();

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
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

          return (
            <motion.div
              key={category.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
            >
              <Link href={`/quiz/${category.slug}`}>
                <Card
                  className={`h-full hover:shadow-lg transition-all cursor-pointer group ${colors.border}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div
                        className={`w-12 h-12 rounded-lg ${colors.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
                      >
                        <Icon className={`h-6 w-6 ${colors.icon}`} />
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
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
    </main>
  );
}
