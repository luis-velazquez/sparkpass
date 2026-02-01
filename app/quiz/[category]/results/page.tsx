"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import {
  Trophy,
  Star,
  ArrowLeft,
  RotateCcw,
  Share2,
  ChevronDown,
  ChevronUp,
  Book,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SparkyMessage } from "@/components/sparky";
import { LevelUpModal, getRandomLevelUpMessage } from "@/components/level";
import { getQuestionById } from "@/lib/questions";
import { getCategoryBySlug, type Question, type CategorySlug } from "@/types/question";
import { XP_REWARDS, checkLevelUp } from "@/lib/levels";

const XP_PER_CORRECT_ANSWER = XP_REWARDS.CORRECT_ANSWER;
const XP_QUIZ_COMPLETION_BONUS = XP_REWARDS.QUIZ_COMPLETE;

// Sparky messages based on score percentage
const CELEBRATION_MESSAGES = [
  "INCREDIBLE! You crushed it! 🎉 You're absolutely ready for that Master exam!",
  "Outstanding work! You're showing Master-level knowledge! Keep this up!",
  "WOW! I'm so proud of you! That score shows real dedication and expertise!",
  "Fantastic! You're lighting up the path to success! Almost there, future Master!",
];

const ENCOURAGEMENT_MESSAGES = [
  "Great job! You're building solid knowledge. Keep practicing those tricky areas!",
  "Nice work! You've got a good foundation. A bit more practice and you'll ace it!",
  "Good effort! You're making real progress. Let's strengthen those weak spots!",
  "Well done! You're on the right track. Review the missed ones and you'll be golden!",
];

const SUPPORTIVE_MESSAGES = [
  "Don't worry - every expert was once a beginner. Review these concepts and try again!",
  "This is how we learn! Each missed question is a chance to grow stronger. You've got this!",
  "Rome wasn't built in a day, and neither is mastery! Let's review and come back stronger!",
  "It's okay! The important thing is you're practicing. Let's focus on these topics and improve!",
];

function getRandomMessage(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)];
}

function fireConfetti() {
  // Fire from left side
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { x: 0, y: 0.6 },
    colors: ["#F59E0B", "#10B981", "#8B5CF6", "#FFFBEB"],
  });
  // Fire from right side
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { x: 1, y: 0.6 },
    colors: ["#F59E0B", "#10B981", "#8B5CF6", "#FFFBEB"],
  });
}

interface QuizResultData {
  answers: Record<string, number>;
  questionIds: string[];
  categorySlug: CategorySlug;
  bookmarkedQuestions: string[];
}

interface IncorrectQuestion {
  question: Question;
  selectedAnswer: number;
}

export default function QuizResultsPage() {
  const params = useParams();
  const router = useRouter();
  const categorySlug = params.category as CategorySlug;

  const [resultData, setResultData] = useState<QuizResultData | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [sparkyMessage, setSparkyMessage] = useState("");
  const [showXpAnimation, setShowXpAnimation] = useState(false);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [levelUpInfo, setLevelUpInfo] = useState<{ newLevel: number; newTitle: string; message: string } | null>(null);
  const [previousUserXP, setPreviousUserXP] = useState<number | null>(null);

  const category = useMemo(() => getCategoryBySlug(categorySlug), [categorySlug]);

  // Load quiz data from sessionStorage and fetch user XP
  useEffect(() => {
    const answersStr = sessionStorage.getItem("quizAnswers");
    const questionIdsStr = sessionStorage.getItem("quizQuestionIds");
    const storedCategorySlug = sessionStorage.getItem("quizCategory");
    const bookmarkedStr = sessionStorage.getItem("bookmarkedQuestions");
    const preQuizXPStr = sessionStorage.getItem("preQuizXP");

    if (!answersStr || !questionIdsStr || storedCategorySlug !== categorySlug) {
      // No quiz data found or category mismatch - redirect to quiz selection
      router.replace("/quiz");
      return;
    }

    // Set the pre-quiz XP if available
    if (preQuizXPStr) {
      setPreviousUserXP(parseInt(preQuizXPStr, 10));
    }

    const data: QuizResultData = {
      answers: JSON.parse(answersStr),
      questionIds: JSON.parse(questionIdsStr),
      categorySlug: storedCategorySlug as CategorySlug,
      bookmarkedQuestions: bookmarkedStr ? JSON.parse(bookmarkedStr) : [],
    };

    setResultData(data);
  }, [categorySlug, router]);

  // Calculate results when data is loaded
  const results = useMemo(() => {
    if (!resultData) return null;

    const questions = resultData.questionIds
      .map((id) => getQuestionById(id))
      .filter((q): q is Question => q !== undefined);

    let correctCount = 0;
    const incorrectQuestions: IncorrectQuestion[] = [];

    questions.forEach((question) => {
      const selectedAnswer = resultData.answers[question.id];
      if (selectedAnswer === question.correctAnswer) {
        correctCount++;
      } else {
        incorrectQuestions.push({ question, selectedAnswer });
      }
    });

    const totalQuestions = questions.length;
    const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const correctXP = correctCount * XP_PER_CORRECT_ANSWER;
    const totalXP = correctXP + XP_QUIZ_COMPLETION_BONUS;

    return {
      correctCount,
      totalQuestions,
      percentage,
      correctXP,
      totalXP,
      incorrectQuestions,
    };
  }, [resultData]);

  // Set Sparky message, fire confetti, and check for level-up
  useEffect(() => {
    if (!results) return;

    let messages: string[];
    if (results.percentage >= 90) {
      messages = CELEBRATION_MESSAGES;
    } else if (results.percentage >= 70) {
      messages = ENCOURAGEMENT_MESSAGES;
    } else {
      messages = SUPPORTIVE_MESSAGES;
    }

    setSparkyMessage(getRandomMessage(messages));

    // Fire confetti for scores 80%+
    if (results.percentage >= 80) {
      setTimeout(() => {
        fireConfetti();
      }, 300);
    }

    // Trigger XP animation
    setShowXpAnimation(true);

    // Check for level-up if we have previous XP
    if (previousUserXP !== null) {
      const newXP = previousUserXP + results.totalXP;
      const levelUpResult = checkLevelUp(previousUserXP, newXP);

      if (levelUpResult) {
        // Generate the message here, outside of render
        setLevelUpInfo({
          ...levelUpResult,
          message: getRandomLevelUpMessage(),
        });
        // Show level-up modal after a delay to let the user see results first
        setTimeout(() => {
          setShowLevelUpModal(true);
        }, 2000);
      }
    }
  }, [results, previousUserXP]);

  const toggleQuestionExpand = (questionId: string) => {
    setExpandedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const handleRetakeQuiz = () => {
    // Clear session storage and go back to quiz
    sessionStorage.removeItem("quizAnswers");
    sessionStorage.removeItem("quizQuestionIds");
    sessionStorage.removeItem("quizCategory");
    sessionStorage.removeItem("bookmarkedQuestions");
    router.push(`/quiz/${categorySlug}`);
  };

  const handleBackToCategories = () => {
    // Clear session storage
    sessionStorage.removeItem("quizAnswers");
    sessionStorage.removeItem("quizQuestionIds");
    sessionStorage.removeItem("quizCategory");
    sessionStorage.removeItem("bookmarkedQuestions");
    router.push("/quiz");
  };

  const handleShare = async () => {
    if (!results || !category) return;

    const shareText = `I just scored ${results.percentage}% (${results.correctCount}/${results.totalQuestions}) on the ${category.name} quiz in SparkPass! 🎉⚡`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "My SparkPass Quiz Score",
          text: shareText,
        });
      } catch {
        // User cancelled or share failed - do nothing
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareText);
        alert("Score copied to clipboard!");
      } catch {
        // Clipboard access denied
      }
    }
  };

  // Loading state
  if (!resultData || !results || !category) {
    return (
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-6" />
          <div className="h-64 bg-muted rounded mb-6" />
        </div>
      </main>
    );
  }

  const scoreColor =
    results.percentage >= 80
      ? "text-emerald"
      : results.percentage >= 60
      ? "text-amber"
      : "text-red-500";

  return (
    <main className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", duration: 0.8, bounce: 0.4 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber/20 mb-4"
        >
          <Trophy className="h-10 w-10 text-amber" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl md:text-3xl font-bold text-foreground mb-2"
        >
          Quiz Complete!
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-muted-foreground"
        >
          {category.name} - {category.necArticle}
        </motion.p>
      </div>

      {/* Score Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="mb-6 border-2 border-amber/30">
          <CardContent className="pt-6">
            <div className="text-center">
              {/* Score Display */}
              <div className="mb-4">
                <motion.span
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, type: "spring", bounce: 0.5 }}
                  className={`text-5xl md:text-6xl font-bold ${scoreColor}`}
                >
                  {results.correctCount}/{results.totalQuestions}
                </motion.span>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className={`text-2xl md:text-3xl font-semibold ${scoreColor}`}
                >
                  {results.percentage}%
                </motion.p>
              </div>

              {/* XP Display */}
              {showXpAnimation && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.7, type: "spring", bounce: 0.4 }}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="flex items-center gap-4 justify-center flex-wrap">
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald/20 text-emerald rounded-full text-lg font-bold">
                      <CheckCircle2 className="h-5 w-5" />
                      +{results.correctXP} XP
                    </span>
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-purple/20 text-purple rounded-full text-lg font-bold">
                      <Star className="h-5 w-5" />
                      +{XP_QUIZ_COMPLETION_BONUS} Completion Bonus
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-2">
                    Total: <span className="font-bold text-foreground">{results.totalXP} XP</span>
                  </p>
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Sparky Message */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8 }}
        className="mb-8"
      >
        <SparkyMessage message={sparkyMessage} size="large" />
      </motion.div>

      {/* Incorrect Questions Review */}
      {results.incorrectQuestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <XCircle className="h-5 w-5 text-red-500" />
                Review Missed Questions ({results.incorrectQuestions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {results.incorrectQuestions.map(({ question, selectedAnswer }) => {
                  const isExpanded = expandedQuestions.has(question.id);
                  return (
                    <div
                      key={question.id}
                      className="border rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() => toggleQuestionExpand(question.id)}
                        className="w-full p-4 text-left flex items-start justify-between gap-3 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <span className="text-xs text-purple font-medium">
                            {question.necReference}
                          </span>
                          <p className="text-sm text-foreground mt-1 line-clamp-2">
                            {question.questionText}
                          </p>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        )}
                      </button>

                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t bg-muted/30"
                        >
                          <div className="p-4 space-y-3">
                            {/* Your Answer */}
                            <div>
                              <p className="text-xs font-medium text-red-500 mb-1">Your Answer:</p>
                              <p className="text-sm text-muted-foreground">
                                {String.fromCharCode(65 + selectedAnswer)}. {question.options[selectedAnswer]}
                              </p>
                            </div>

                            {/* Correct Answer */}
                            <div>
                              <p className="text-xs font-medium text-emerald mb-1">Correct Answer:</p>
                              <p className="text-sm text-foreground">
                                {String.fromCharCode(65 + question.correctAnswer)}. {question.options[question.correctAnswer]}
                              </p>
                            </div>

                            {/* Explanation */}
                            <div className="p-3 bg-muted rounded-lg">
                              <div className="flex items-center gap-2 text-xs font-medium text-purple mb-2">
                                <Book className="h-3.5 w-3.5" />
                                Explanation
                              </div>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {question.explanation}
                              </p>
                            </div>

                            {/* Sparky Tip */}
                            <div className="p-3 bg-amber/10 rounded-lg border border-amber/30">
                              <p className="text-sm text-foreground">
                                <span className="font-medium text-amber">💡 Sparky&apos;s Tip:</span>{" "}
                                {question.sparkyTip}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="flex flex-col sm:flex-row gap-3 justify-center"
      >
        <Button
          onClick={handleBackToCategories}
          variant="outline"
          size="lg"
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Categories
        </Button>

        <Button
          onClick={handleRetakeQuiz}
          size="lg"
          className="bg-amber hover:bg-amber/90 text-white gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Retake Quiz
        </Button>

        <Button
          onClick={handleShare}
          variant="outline"
          size="lg"
          className="gap-2"
        >
          <Share2 className="h-4 w-4" />
          Share Score
        </Button>
      </motion.div>

      {/* Level Up Modal */}
      {levelUpInfo && (
        <LevelUpModal
          isOpen={showLevelUpModal}
          onClose={() => setShowLevelUpModal(false)}
          newLevel={levelUpInfo.newLevel}
          newTitle={levelUpInfo.newTitle}
          message={levelUpInfo.message}
        />
      )}
    </main>
  );
}
