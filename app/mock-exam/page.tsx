"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ClipboardCheck,
  Clock,
  BookOpen,
  Play,
  Trophy,
  Target,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SparkyMessage } from "@/components/sparky";

interface ExamOption {
  id: string;
  title: string;
  description: string;
  questionCount: number;
  timeLimit: number; // in minutes
  difficulty: "standard" | "challenging";
  icon: typeof ClipboardCheck;
  color: string;
  bgColor: string;
}

const EXAM_OPTIONS: ExamOption[] = [
  {
    id: "quick-practice",
    title: "Quick Practice",
    description: "A short 25-question practice test to warm up",
    questionCount: 25,
    timeLimit: 30,
    difficulty: "standard",
    icon: Target,
    color: "text-emerald",
    bgColor: "bg-emerald/10",
  },
  {
    id: "half-exam",
    title: "Half Exam",
    description: "50 questions covering all major NEC articles",
    questionCount: 50,
    timeLimit: 60,
    difficulty: "standard",
    icon: BookOpen,
    color: "text-purple",
    bgColor: "bg-purple-soft",
  },
  {
    id: "full-exam",
    title: "Full Mock Exam",
    description: "Simulate the real exam with 100 questions",
    questionCount: 100,
    timeLimit: 120,
    difficulty: "standard",
    icon: ClipboardCheck,
    color: "text-amber",
    bgColor: "bg-amber/10",
  },
  {
    id: "challenge-mode",
    title: "Challenge Mode",
    description: "Hard questions only - test your mastery!",
    questionCount: 50,
    timeLimit: 45,
    difficulty: "challenging",
    icon: Trophy,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
];

export default function MockExamPage() {
  const { status } = useSession();
  const router = useRouter();
  const [selectedExam, setSelectedExam] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <main className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-amber" />
      </main>
    );
  }

  const handleStartExam = (examId: string) => {
    router.push(`/mock-exam/${examId}`);
  };

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
          <span className="text-amber">Mock Exam</span>
        </h1>
        <p className="text-muted-foreground">
          Simulate the real Texas Master Electrician exam with timed practice tests.
          Choose your challenge level and test your knowledge!
        </p>
      </motion.div>

      {/* Exam Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {EXAM_OPTIONS.map((exam, index) => (
          <motion.div
            key={exam.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
          >
            <Card
              className={`h-full cursor-pointer transition-all hover:shadow-lg ${
                selectedExam === exam.id ? "ring-2 ring-amber" : ""
              } ${exam.difficulty === "challenging" ? "border-red-500/30" : ""}`}
              onClick={() => setSelectedExam(exam.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div
                    className={`w-12 h-12 rounded-lg ${exam.bgColor} flex items-center justify-center`}
                  >
                    <exam.icon className={`h-6 w-6 ${exam.color}`} />
                  </div>
                  {exam.difficulty === "challenging" && (
                    <span className="px-2 py-1 text-xs font-medium bg-red-500/10 text-red-500 rounded-full">
                      Hard Mode
                    </span>
                  )}
                </div>
                <CardTitle className="text-lg mt-3">{exam.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {exam.description}
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                    <span>{exam.questionCount} questions</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{exam.timeLimit} min</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Selected Exam Details */}
      {selectedExam && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <Card className="bg-amber/5 border-amber/30">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    Ready to start{" "}
                    {EXAM_OPTIONS.find((e) => e.id === selectedExam)?.title}?
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Once you begin, the timer will start. You can pause but not go back to previous questions.
                  </p>
                </div>
                <Button
                  size="lg"
                  className="bg-amber hover:bg-amber-dark text-white"
                  onClick={() => handleStartExam(selectedExam)}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Exam
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Exam Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.45 }}
        className="mb-8"
      >
        <h2 className="text-xl font-semibold text-foreground mb-4">Exam Day Tips</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <Clock className="h-8 w-8 text-amber mb-3" />
              <h3 className="font-semibold text-foreground mb-2">Time Management</h3>
              <p className="text-sm text-muted-foreground">
                Pace yourself - aim for about 1 minute per question. Flag difficult ones and return later.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <BookOpen className="h-8 w-8 text-emerald mb-3" />
              <h3 className="font-semibold text-foreground mb-2">Read Carefully</h3>
              <p className="text-sm text-muted-foreground">
                Pay attention to keywords like &quot;minimum,&quot; &quot;maximum,&quot; &quot;shall,&quot; and &quot;permitted.&quot;
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <Target className="h-8 w-8 text-purple mb-3" />
              <h3 className="font-semibold text-foreground mb-2">Eliminate Wrong Answers</h3>
              <p className="text-sm text-muted-foreground">
                When unsure, eliminate obviously wrong choices first to improve your odds.
              </p>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Sparky Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <SparkyMessage
          size="medium"
          message="Mock exams are your secret weapon! Taking practice tests under timed conditions builds the mental stamina you need for exam day. Don't worry about failing practice tests - that's how you identify areas to improve!"
        />
      </motion.div>
    </main>
  );
}
