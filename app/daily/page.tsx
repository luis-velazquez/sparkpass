"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Calendar,
  Flame,
  Gift,
  Star,
  Trophy,
  CheckCircle2,
  Lock,
  Zap,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SparkyMessage } from "@/components/sparky";

interface DailyChallenge {
  id: string;
  day: number;
  title: string;
  description: string;
  xpReward: number;
  completed: boolean;
  locked: boolean;
}

// Generate a week of daily challenges
const generateWeekChallenges = (): DailyChallenge[] => {
  const challenges: DailyChallenge[] = [
    {
      id: "day1",
      day: 1,
      title: "Quick Start",
      description: "Answer 5 questions from any category",
      xpReward: 25,
      completed: false,
      locked: false,
    },
    {
      id: "day2",
      day: 2,
      title: "Load Master",
      description: "Complete 5 Load Calculations questions",
      xpReward: 30,
      completed: false,
      locked: true,
    },
    {
      id: "day3",
      day: 3,
      title: "Ground Control",
      description: "Complete 5 Grounding & Bonding questions",
      xpReward: 30,
      completed: false,
      locked: true,
    },
    {
      id: "day4",
      day: 4,
      title: "Service Pro",
      description: "Complete 5 Services questions",
      xpReward: 30,
      completed: false,
      locked: true,
    },
    {
      id: "day5",
      day: 5,
      title: "Mix It Up",
      description: "Answer 10 questions from mixed categories",
      xpReward: 50,
      completed: false,
      locked: true,
    },
    {
      id: "day6",
      day: 6,
      title: "Accuracy Challenge",
      description: "Get 8 out of 10 questions correct",
      xpReward: 75,
      completed: false,
      locked: true,
    },
    {
      id: "day7",
      day: 7,
      title: "Weekly Champion",
      description: "Complete a 20-question mini exam",
      xpReward: 100,
      completed: false,
      locked: true,
    },
  ];
  return challenges;
};

export default function DailyChallengePage() {
  const { status } = useSession();
  const router = useRouter();
  const [challenges] = useState<DailyChallenge[]>(generateWeekChallenges());
  const [currentStreak, setCurrentStreak] = useState(0);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    // In a real app, this would fetch from the API
    // For demo, set a random streak
    setCurrentStreak(Math.floor(Math.random() * 7));
  }, []);

  if (status === "loading") {
    return (
      <main className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-amber" />
      </main>
    );
  }

  const completedCount = challenges.filter((c) => c.completed).length;
  const totalXP = challenges.reduce((sum, c) => sum + (c.completed ? c.xpReward : 0), 0);
  const potentialXP = challenges.reduce((sum, c) => sum + c.xpReward, 0);

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          <span className="text-purple">Daily Challenge</span>
        </h1>
        <p className="text-muted-foreground">
          Complete daily challenges to maintain your streak and earn bonus XP!
        </p>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Current Streak */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500" />
                Current Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-orange-500/10">
                  <Flame className="h-7 w-7 text-orange-500" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">{currentStreak}</p>
                  <p className="text-sm text-muted-foreground">days</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Weekly Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4 text-purple" />
                Weekly Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-purple-soft">
                  <Trophy className="h-7 w-7 text-purple" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">
                    {completedCount}/{challenges.length}
                  </p>
                  <p className="text-sm text-muted-foreground">completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* XP Earned */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Star className="h-4 w-4 text-amber" />
                XP This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-amber/10">
                  <Zap className="h-7 w-7 text-amber" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">{totalXP}</p>
                  <p className="text-sm text-muted-foreground">of {potentialXP} XP</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Today's Challenge Highlight */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="mb-8"
      >
        <Card className="bg-gradient-to-r from-purple/10 to-amber/10 border-purple/30">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-purple flex items-center justify-center">
                  <Gift className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="text-sm text-purple font-medium mb-1">Today&apos;s Challenge</p>
                  <h3 className="text-xl font-bold text-foreground">
                    {challenges[0].title}
                  </h3>
                  <p className="text-muted-foreground">{challenges[0].description}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-2xl font-bold text-amber">+{challenges[0].xpReward} XP</p>
                  <p className="text-sm text-muted-foreground">reward</p>
                </div>
                <Link href="/quiz">
                  <Button size="lg" className="bg-purple hover:bg-purple/90">
                    Start Challenge
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Weekly Challenges List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mb-8"
      >
        <h2 className="text-xl font-semibold text-foreground mb-4">This Week&apos;s Challenges</h2>
        <div className="space-y-3">
          {challenges.map((challenge, index) => (
            <motion.div
              key={challenge.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.35 + index * 0.05 }}
            >
              <Card
                className={`${
                  challenge.completed
                    ? "bg-emerald/5 border-emerald/30"
                    : challenge.locked
                    ? "bg-muted/30 opacity-60"
                    : ""
                }`}
              >
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          challenge.completed
                            ? "bg-emerald text-white"
                            : challenge.locked
                            ? "bg-muted text-muted-foreground"
                            : "bg-purple-soft text-purple"
                        }`}
                      >
                        {challenge.completed ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : challenge.locked ? (
                          <Lock className="h-5 w-5" />
                        ) : (
                          <span className="font-bold">{challenge.day}</span>
                        )}
                      </div>
                      <div>
                        <h3
                          className={`font-semibold ${
                            challenge.locked ? "text-muted-foreground" : "text-foreground"
                          }`}
                        >
                          Day {challenge.day}: {challenge.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {challenge.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`font-medium ${
                          challenge.completed
                            ? "text-emerald"
                            : challenge.locked
                            ? "text-muted-foreground"
                            : "text-amber"
                        }`}
                      >
                        +{challenge.xpReward} XP
                      </span>
                      {!challenge.locked && !challenge.completed && (
                        <Link href="/quiz">
                          <Button size="sm" variant="outline">
                            Start
                          </Button>
                        </Link>
                      )}
                      {challenge.completed && (
                        <CheckCircle2 className="h-5 w-5 text-emerald" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Streak Benefits */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="mb-8"
      >
        <h2 className="text-xl font-semibold text-foreground mb-4">Streak Bonuses</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { days: 3, bonus: "1.25x XP", achieved: currentStreak >= 3 },
            { days: 7, bonus: "1.5x XP", achieved: currentStreak >= 7 },
            { days: 14, bonus: "2x XP", achieved: currentStreak >= 14 },
            { days: 30, bonus: "Badge", achieved: currentStreak >= 30 },
          ].map((tier) => (
            <Card
              key={tier.days}
              className={tier.achieved ? "bg-amber/10 border-amber/30" : ""}
            >
              <CardContent className="pt-4 text-center">
                <Flame
                  className={`h-8 w-8 mx-auto mb-2 ${
                    tier.achieved ? "text-amber" : "text-muted-foreground"
                  }`}
                />
                <p className="font-bold text-foreground">{tier.days} Days</p>
                <p
                  className={`text-sm ${
                    tier.achieved ? "text-amber font-medium" : "text-muted-foreground"
                  }`}
                >
                  {tier.bonus}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Sparky Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.55 }}
      >
        <SparkyMessage
          size="medium"
          message="Consistency is the key to success! Daily practice, even just 10-15 minutes, builds lasting knowledge. Your brain consolidates learning during sleep, so short daily sessions beat long weekend cramming!"
        />
      </motion.div>
    </main>
  );
}
