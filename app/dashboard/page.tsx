"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Brain,
  BookOpen,
  ClipboardCheck,
  Calendar,
  Flame,
  Star,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Calculator,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SparkyMessage } from "@/components/sparky";
import { ExamCountdown } from "@/components/exam";
import { getLevelTitle, getXPProgress } from "@/lib/levels";
import { CATEGORIES } from "@/types/question";

interface UserData {
  name: string;
  xp: number;
  level: number;
  studyStreak: number;
  targetExamDate: string | null;
}

interface CategoryStat {
  slug: string;
  answered: number;
  correct: number;
  accuracy: number;
}

interface RecentSession {
  id: string;
  sessionType: string;
  startedAt: string | null;
  endedAt: string | null;
  xpEarned: number;
}

interface ProgressStats {
  totalAnswered: number;
  uniqueQuestionsAnswered: number;
  totalQuestionsInBank: number;
  correctCount: number;
  accuracy: number;
  answeredToday: number;
  categoryStats: CategoryStat[];
  recentSessions: RecentSession[];
  xp: number;
  level: number;
  studyStreak: number;
}

const features = [
  {
    title: "Quiz",
    description: "Practice with NEC-based questions and get instant feedback.",
    icon: Brain,
    href: "/quiz",
    color: "text-purple",
    bgColor: "bg-purple-soft",
  },
  {
    title: "Flashcards",
    description: "Memorize key formulas and code references.",
    icon: BookOpen,
    href: "/flashcards",
    color: "text-emerald",
    bgColor: "bg-emerald/10",
  },
  {
    title: "Load Calculator",
    description: "Learn residential load calculations step by step with Sparky.",
    icon: Calculator,
    href: "/load-calculator",
    color: "text-amber",
    bgColor: "bg-amber/10",
  },
  {
    title: "Mock Exam",
    description: "Simulate the real exam with timed practice tests.",
    icon: ClipboardCheck,
    href: "/mock-exam",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  {
    title: "Daily Challenge",
    description: "Complete daily challenges to keep your streak alive!",
    icon: Calendar,
    href: "/daily",
    color: "text-purple",
    bgColor: "bg-purple-soft",
  },
];

function getSparkyMessage(daysUntilExam: number | null, weakAreas: string[]): string {
  // First priority: weak areas suggestion
  if (weakAreas.length > 0) {
    const categoryNames = weakAreas.map(slug => {
      const cat = CATEGORIES.find(c => c.slug === slug);
      return cat?.name || slug;
    });

    if (weakAreas.length === 1) {
      return `I notice ${categoryNames[0]} could use some extra attention. Let's strengthen that area together! Practice makes perfect.`;
    }
    return `Your weak spots are ${categoryNames.join(" and ")}. Don't worry - focusing on these areas will boost your overall score significantly!`;
  }

  // Second priority: exam countdown
  if (daysUntilExam === null) {
    return "Welcome back! Set your target exam date to get personalized study recommendations and countdown!";
  }

  if (daysUntilExam < 0) {
    return "Your exam date has passed! How did it go? Update your target date if you're planning to retake or celebrate your success!";
  }

  if (daysUntilExam === 0) {
    return "Today's the day! You've put in the work, now trust yourself. Take deep breaths, read each question carefully, and remember - you've got this!";
  }

  if (daysUntilExam === 1) {
    return "One more day! Get a good night's sleep, eat a solid breakfast tomorrow, and arrive early. You're as ready as you'll ever be!";
  }

  if (daysUntilExam <= 3) {
    return "The final stretch! Focus on reviewing your bookmarked questions and weak areas. Light study only - no cramming!";
  }

  if (daysUntilExam <= 7) {
    return "One week to go! This is a great time to take a full mock exam and review any trouble spots. You're doing great!";
  }

  if (daysUntilExam <= 14) {
    return "Two weeks out! Keep up your daily practice and focus on understanding the 'why' behind code requirements. Consistency is key!";
  }

  if (daysUntilExam <= 30) {
    return "A month to go - plenty of time to sharpen your skills! Make sure you're covering all the major NEC articles in your study plan.";
  }

  return "Great job staying consistent with your studies! Remember, every question you practice brings you closer to that Master license!";
}

function getSessionTypeLabel(type: string): string {
  switch (type) {
    case "quiz":
      return "Quiz";
    case "flashcard":
      return "Flashcards";
    case "mock_exam":
      return "Mock Exam";
    case "daily_challenge":
      return "Daily Challenge";
    default:
      return type;
  }
}

function formatTimeAgo(dateString: string | null): string {
  if (!dateString) return "Unknown";

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [progressStats, setProgressStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && session?.user?.id) {
      // Fetch user data and progress stats in parallel
      Promise.all([
        fetch("/api/user").then((res) => res.json()),
        fetch("/api/progress/stats").then((res) => res.json()),
      ])
        .then(([user, stats]) => {
          setUserData(user);
          setProgressStats(stats);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, [status, session, router]);

  if (status === "loading" || loading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-10 bg-muted rounded w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="h-32 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
          </div>
          <div className="h-48 bg-muted rounded mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-muted rounded" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </main>
    );
  }

  const name = userData?.name || session?.user?.name || "Electrician";
  const xp = progressStats?.xp ?? userData?.xp ?? 0;
  const level = progressStats?.level ?? userData?.level ?? 1;
  const studyStreak = progressStats?.studyStreak ?? userData?.studyStreak ?? 0;
  const targetExamDate = userData?.targetExamDate
    ? new Date(userData.targetExamDate)
    : null;

  const xpProgress = getXPProgress(xp, level);
  const levelTitle = getLevelTitle(level);

  const daysUntilExam = targetExamDate
    ? Math.ceil(
        (targetExamDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )
    : null;

  // Calculate weak areas (categories below 70% with at least 1 question answered)
  const weakAreas = (progressStats?.categoryStats || [])
    .filter((cat) => cat.answered > 0 && cat.accuracy < 70)
    .map((cat) => cat.slug);

  const sparkyMessage = getSparkyMessage(daysUntilExam, weakAreas);

  const totalAnswered = progressStats?.totalAnswered ?? 0;
  const uniqueQuestionsAnswered = progressStats?.uniqueQuestionsAnswered ?? 0;
  const totalQuestionsInBank = progressStats?.totalQuestionsInBank ?? 50;
  const accuracy = progressStats?.accuracy ?? 0;
  const answeredToday = progressStats?.answeredToday ?? 0;
  const categoryStats = progressStats?.categoryStats ?? [];
  const recentSessions = progressStats?.recentSessions ?? [];

  const isNewUser = totalAnswered === 0;

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Welcome back, <span className="text-amber">{name}</span>!
        </h1>
        <p className="text-muted-foreground mb-8">
          Let&apos;s keep the momentum going!
        </p>
      </motion.div>

      {/* Stats Cards Row 1 - Core Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6">
        {/* XP & Level Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Star className="h-4 w-4 text-amber" />
                Level & XP
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold text-foreground">
                  Level {level}
                </span>
                <span className="text-sm text-muted-foreground">
                  {levelTitle}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {xp.toLocaleString()} XP
                  </span>
                  <span className="text-muted-foreground">
                    {xpProgress.current} / {xpProgress.needed} to next level
                  </span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${xpProgress.percentage}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-amber to-amber-light rounded-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Study Streak Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500" />
                Study Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-orange-500/10">
                  <Flame className="h-8 w-8 text-orange-500" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">
                    {studyStreak}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {studyStreak === 1 ? "day" : "days"} in a row
                  </p>
                </div>
              </div>
              {studyStreak === 0 && (
                <p className="text-sm text-muted-foreground mt-3">
                  Complete a quiz to start your streak!
                </p>
              )}
              {studyStreak > 0 && studyStreak < 7 && (
                <p className="text-sm text-muted-foreground mt-3">
                  Keep it going! Study today to maintain your streak.
                </p>
              )}
              {studyStreak >= 7 && (
                <p className="text-sm text-emerald mt-3">
                  Amazing dedication! You&apos;re on fire!
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Exam Countdown Card - Using the ExamCountdown component */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <ExamCountdown
            targetExamDate={targetExamDate}
            totalQuestionsAnswered={uniqueQuestionsAnswered}
            totalQuestionsInBank={totalQuestionsInBank}
          />
        </motion.div>
      </div>

      {/* Stats Cards Row 2 - Progress Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
        {/* Total Questions Answered */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald" />
                Questions Answered
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald/10">
                  <CheckCircle2 className="h-8 w-8 text-emerald" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">
                    {totalAnswered}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    total questions
                  </p>
                </div>
              </div>
              {isNewUser ? (
                <p className="text-sm text-muted-foreground mt-3">
                  Start a quiz to track your progress!
                </p>
              ) : (
                <p className="text-sm text-muted-foreground mt-3">
                  <span className="text-emerald font-medium">{answeredToday}</span> answered today
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Overall Accuracy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple" />
                Overall Accuracy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-purple-soft">
                  <TrendingUp className="h-8 w-8 text-purple" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">
                    {isNewUser ? "—" : `${accuracy}%`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    correct answers
                  </p>
                </div>
              </div>
              {isNewUser ? (
                <p className="text-sm text-muted-foreground mt-3">
                  Answer questions to see your accuracy!
                </p>
              ) : accuracy >= 80 ? (
                <p className="text-sm text-emerald mt-3">
                  Excellent work! Keep it up!
                </p>
              ) : accuracy >= 70 ? (
                <p className="text-sm text-amber mt-3">
                  Good progress! Aim for 80%+
                </p>
              ) : (
                <p className="text-sm text-muted-foreground mt-3">
                  Keep practicing to improve!
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Weak Areas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber" />
                Focus Areas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isNewUser ? (
                <div className="flex flex-col items-center justify-center py-4">
                  <p className="text-sm text-muted-foreground text-center">
                    Complete some quizzes to identify areas for improvement!
                  </p>
                </div>
              ) : weakAreas.length === 0 ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald/10">
                    <CheckCircle2 className="h-8 w-8 text-emerald" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-foreground">
                      All clear!
                    </p>
                    <p className="text-sm text-muted-foreground">
                      No weak areas detected
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {weakAreas.slice(0, 2).map((slug) => {
                    const category = CATEGORIES.find((c) => c.slug === slug);
                    const stat = categoryStats.find((s) => s.slug === slug);
                    return (
                      <Link key={slug} href={`/quiz/${slug}`}>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-amber/5 hover:bg-amber/10 transition-colors cursor-pointer">
                          <span className="text-sm font-medium text-foreground">
                            {category?.name || slug}
                          </span>
                          <span className="text-sm text-amber font-medium">
                            {stat?.accuracy || 0}%
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                  <p className="text-xs text-muted-foreground mt-2">
                    Click to practice
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Sparky Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="mb-8"
      >
        <SparkyMessage size="medium" message={sparkyMessage} />
      </motion.div>

      {/* Category Progress and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Category Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.55 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple" />
                Category Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isNewUser ? (
                <div className="text-center py-8">
                  <Brain className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">
                    No progress yet. Start a quiz to see your category breakdown!
                  </p>
                  <Link href="/quiz">
                    <Button>Start a Quiz</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {CATEGORIES.map((category) => {
                    const stat = categoryStats.find(
                      (s) => s.slug === category.slug
                    );
                    const answered = stat?.answered || 0;
                    const categoryAccuracy = stat?.accuracy || 0;
                    const isWeak = answered > 0 && categoryAccuracy < 70;

                    return (
                      <div key={category.slug}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">
                              {category.name}
                            </span>
                            {isWeak && (
                              <AlertTriangle className="h-3 w-3 text-amber" />
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span>{answered} answered</span>
                            <span
                              className={`font-medium ${
                                answered === 0
                                  ? "text-muted-foreground"
                                  : categoryAccuracy >= 80
                                  ? "text-emerald"
                                  : categoryAccuracy >= 70
                                  ? "text-amber"
                                  : "text-red-500"
                              }`}
                            >
                              {answered === 0 ? "—" : `${categoryAccuracy}%`}
                            </span>
                          </div>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: answered > 0 ? `${categoryAccuracy}%` : "0%",
                            }}
                            transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                            className={`h-full rounded-full ${
                              answered === 0
                                ? "bg-muted"
                                : categoryAccuracy >= 80
                                ? "bg-emerald"
                                : categoryAccuracy >= 70
                                ? "bg-amber"
                                : "bg-red-400"
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentSessions.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">
                    No recent activity. Complete a study session to see your history!
                  </p>
                  <Link href="/quiz">
                    <Button>Start Studying</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-soft flex items-center justify-center">
                          {session.sessionType === "quiz" && (
                            <Brain className="h-5 w-5 text-purple" />
                          )}
                          {session.sessionType === "flashcard" && (
                            <BookOpen className="h-5 w-5 text-emerald" />
                          )}
                          {session.sessionType === "mock_exam" && (
                            <ClipboardCheck className="h-5 w-5 text-amber" />
                          )}
                          {session.sessionType === "daily_challenge" && (
                            <Calendar className="h-5 w-5 text-purple" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {getSessionTypeLabel(session.sessionType)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatTimeAgo(session.startedAt)}
                          </p>
                        </div>
                      </div>
                      {session.xpEarned > 0 && (
                        <span className="text-sm font-medium text-amber">
                          +{session.xpEarned} XP
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Feature Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.65 }}
      >
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Start Studying
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.65 + index * 0.1 }}
            >
              <Link href={feature.href}>
                <Card className="h-full hover:shadow-lg transition-all cursor-pointer group hover:border-amber/50">
                  <CardHeader className="pb-2">
                    <div
                      className={`w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
                    >
                      <feature.icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </main>
  );
}
