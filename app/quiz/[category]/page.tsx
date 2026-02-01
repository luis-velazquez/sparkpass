"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useParams, useRouter, notFound } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  Star,
  StarOff,
  ChevronLeft,
  Book,
  ArrowRight,
  Bookmark,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { SparkyMessage } from "@/components/sparky";
import { getRandomQuestions } from "@/lib/questions";
import { getCategoryBySlug, type Question, type CategorySlug } from "@/types/question";

// Sparky congratulation messages for correct answers
const CORRECT_MESSAGES = [
  "Excellent work! You're lighting up the path to success! ⚡",
  "That's the right answer! Your knowledge is really amping up!",
  "Perfect! You're wired for success, future Master Electrician!",
  "Brilliant! That's exactly right - you're on fire! 🔥",
  "Outstanding! Your understanding is crystal clear!",
  "You nailed it! Keep that current flowing!",
  "Correct! You're really charging ahead with these concepts!",
  "Yes! That's some high-voltage knowledge right there!",
  "Fantastic! Your electrical expertise is shining bright!",
  "Spot on! You're grounded in the fundamentals!",
];

// Sparky encouragement messages for incorrect answers
const INCORRECT_MESSAGES = [
  "Not quite, but that's how we learn! Let me help you understand this one.",
  "Close! This is a tricky one. Let's review it together.",
  "That's okay! Even master electricians were apprentices once. Here's the key insight:",
  "Don't worry! This concept trips up a lot of people. Let's break it down.",
  "Almost there! Understanding this will make you stronger for the exam.",
  "Learning moment! This is exactly why practice matters. Here's the explanation:",
  "No worries! These questions help identify areas to strengthen. Let's review:",
  "That's a tough one! Here's what the NEC says about this:",
];

const QUESTIONS_PER_QUIZ = 15;
const XP_PER_CORRECT_ANSWER = 25;

// Get a random message from an array
function getRandomMessage(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)];
}

// Fire confetti celebration
function fireConfetti() {
  // Fire from left side
  confetti({
    particleCount: 80,
    spread: 55,
    origin: { x: 0, y: 0.7 },
    colors: ["#F59E0B", "#10B981", "#8B5CF6", "#FFFBEB"],
  });
  // Fire from right side
  confetti({
    particleCount: 80,
    spread: 55,
    origin: { x: 1, y: 0.7 },
    colors: ["#F59E0B", "#10B981", "#8B5CF6", "#FFFBEB"],
  });
}

interface QuizState {
  questions: Question[];
  currentQuestionIndex: number;
  selectedAnswer: number | null;
  bookmarkedQuestions: Set<string>;
  answers: Map<string, number>;
  isSubmitted: boolean;
  showXpAnimation: boolean;
  sparkyMessage: string;
}

function createInitialState(categorySlug: CategorySlug): QuizState {
  const questions = getRandomQuestions(categorySlug, QUESTIONS_PER_QUIZ);
  return {
    questions,
    currentQuestionIndex: 0,
    selectedAnswer: null,
    bookmarkedQuestions: new Set(),
    answers: new Map(),
    isSubmitted: false,
    showXpAnimation: false,
    sparkyMessage: "",
  };
}

export default function QuizTakingPage() {
  const params = useParams();
  const router = useRouter();
  const categorySlug = params.category as CategorySlug;

  const category = useMemo(() => getCategoryBySlug(categorySlug), [categorySlug]);

  // Initialize state lazily with questions
  const [quizState, setQuizState] = useState<QuizState>(() =>
    createInitialState(categorySlug)
  );

  const { questions, currentQuestionIndex, selectedAnswer, bookmarkedQuestions, answers, isSubmitted, showXpAnimation, sparkyMessage } = quizState;
  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const progressPercentage = totalQuestions > 0
    ? (currentQuestionIndex / totalQuestions) * 100
    : 0;

  // Determine if the current answer is correct (only after submission)
  const isCorrectAnswer = isSubmitted && selectedAnswer === currentQuestion?.correctAnswer;

  // Ref to track timeout for XP animation reset
  const xpTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (xpTimeoutRef.current) {
        clearTimeout(xpTimeoutRef.current);
      }
    };
  }, []);

  // Fetch and save pre-quiz XP on mount for level-up detection
  useEffect(() => {
    async function fetchPreQuizXP() {
      try {
        const response = await fetch("/api/user");
        if (response.ok) {
          const userData = await response.json();
          sessionStorage.setItem("preQuizXP", String(userData.xp || 0));
        }
      } catch {
        // Silently fail - level-up detection just won't work
      }
    }
    fetchPreQuizXP();
  }, []);

  // Redirect if invalid category or no questions
  if (!category || totalQuestions === 0) {
    notFound();
  }

  const handleSelectAnswer = useCallback((answerIndex: number) => {
    setQuizState((prev) => {
      if (prev.isSubmitted) return prev;
      return {
        ...prev,
        selectedAnswer: answerIndex,
      };
    });
  }, []);

  const handleToggleBookmark = useCallback(() => {
    setQuizState((prev) => {
      const question = prev.questions[prev.currentQuestionIndex];
      if (!question) return prev;
      const newBookmarks = new Set(prev.bookmarkedQuestions);
      if (newBookmarks.has(question.id)) {
        newBookmarks.delete(question.id);
      } else {
        newBookmarks.add(question.id);
      }
      return {
        ...prev,
        bookmarkedQuestions: newBookmarks,
      };
    });
  }, []);

  const handleSubmitAnswer = useCallback(() => {
    setQuizState((prev) => {
      if (prev.selectedAnswer === null) return prev;
      const question = prev.questions[prev.currentQuestionIndex];
      if (!question) return prev;

      const newAnswers = new Map(prev.answers);
      newAnswers.set(question.id, prev.selectedAnswer);

      const isCorrect = prev.selectedAnswer === question.correctAnswer;
      const message = isCorrect
        ? getRandomMessage(CORRECT_MESSAGES)
        : getRandomMessage(INCORRECT_MESSAGES);

      // Fire confetti for correct answers (side effect is OK here as it doesn't affect state)
      if (isCorrect) {
        fireConfetti();
        // Set timeout to hide XP animation
        xpTimeoutRef.current = setTimeout(() => {
          setQuizState((p) => ({ ...p, showXpAnimation: false }));
        }, 2000);
      }

      return {
        ...prev,
        answers: newAnswers,
        isSubmitted: true,
        showXpAnimation: isCorrect,
        sparkyMessage: message,
      };
    });
  }, []);

  const handleNextQuestion = useCallback(() => {
    const isLast = currentQuestionIndex >= totalQuestions - 1;

    if (isLast) {
      // Navigate to results - store answers in sessionStorage for the results page
      const answersObject = Object.fromEntries(answers);
      sessionStorage.setItem("quizAnswers", JSON.stringify(answersObject));
      sessionStorage.setItem(
        "quizQuestionIds",
        JSON.stringify(questions.map((q) => q.id))
      );
      sessionStorage.setItem("quizCategory", categorySlug);
      sessionStorage.setItem(
        "bookmarkedQuestions",
        JSON.stringify(Array.from(bookmarkedQuestions))
      );
      router.push(`/quiz/${categorySlug}/results`);
    } else {
      // Clear any pending timeout
      if (xpTimeoutRef.current) {
        clearTimeout(xpTimeoutRef.current);
        xpTimeoutRef.current = null;
      }
      setQuizState((prev) => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
        selectedAnswer: null,
        isSubmitted: false,
        showXpAnimation: false,
        sparkyMessage: "",
      }));
    }
  }, [currentQuestionIndex, totalQuestions, answers, questions, bookmarkedQuestions, categorySlug, router]);

  // Bookmark handler specifically for the feedback section
  const handleBookmarkFromFeedback = useCallback(() => {
    setQuizState((prev) => {
      const question = prev.questions[prev.currentQuestionIndex];
      if (!question) return prev;
      const newBookmarks = new Set(prev.bookmarkedQuestions);
      newBookmarks.add(question.id);
      return {
        ...prev,
        bookmarkedQuestions: newBookmarks,
      };
    });
  }, []);

  const handleExit = useCallback(() => {
    router.push("/quiz");
  }, [router]);

  const isBookmarked = currentQuestion
    ? bookmarkedQuestions.has(currentQuestion.id)
    : false;
  const isLastQuestion = currentQuestionIndex >= totalQuestions - 1;

  return (
    <main className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-amber to-amber-light rounded-full"
          />
        </div>
      </div>

      {/* Header Row */}
      <div className="flex items-center justify-between mb-6">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              Exit
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Exit Quiz?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to exit? Your progress will be lost and you&apos;ll need to start over.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Continue Quiz</AlertDialogCancel>
              <AlertDialogAction onClick={handleExit}>
                Exit Quiz
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <span className="text-sm font-medium text-muted-foreground">
          Question {currentQuestionIndex + 1} of {totalQuestions}
        </span>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggleBookmark}
          className={`gap-2 ${isBookmarked ? "text-amber" : ""}`}
        >
          {isBookmarked ? (
            <Star className="h-4 w-4 fill-amber" />
          ) : (
            <StarOff className="h-4 w-4" />
          )}
          {isBookmarked ? "Saved" : "Save"}
        </Button>
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="mb-6">
            <CardContent className="pt-6">
              {/* NEC Reference Badge */}
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-soft text-purple text-sm font-medium">
                  <Book className="h-3.5 w-3.5" />
                  {currentQuestion.necReference}
                </span>
                <span className="text-xs text-muted-foreground capitalize px-2 py-0.5 rounded bg-muted">
                  {currentQuestion.difficulty}
                </span>
              </div>

              {/* Question Text */}
              <h2 className="text-lg md:text-xl font-semibold text-foreground leading-relaxed">
                {currentQuestion.questionText}
              </h2>
            </CardContent>
          </Card>

          {/* Answer Options */}
          <div className="grid grid-cols-1 gap-3 mb-6">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = index === currentQuestion.correctAnswer;
              const showCorrect = isSubmitted && isCorrect;
              const showIncorrect = isSubmitted && isSelected && !isCorrect;

              let optionClasses =
                "w-full p-4 text-left rounded-lg border-2 transition-all min-h-[56px] ";

              if (showCorrect) {
                optionClasses +=
                  "border-emerald bg-emerald/10 text-foreground";
              } else if (showIncorrect) {
                optionClasses +=
                  "border-red-500 bg-red-500/10 text-foreground";
              } else if (isSelected) {
                optionClasses +=
                  "border-amber bg-amber/10 text-foreground";
              } else if (isSubmitted) {
                optionClasses += "border-border bg-muted/50 text-muted-foreground";
              } else {
                optionClasses +=
                  "border-border hover:border-amber/50 hover:bg-muted/50 cursor-pointer";
              }

              return (
                <motion.button
                  key={index}
                  onClick={() => handleSelectAnswer(index)}
                  disabled={isSubmitted}
                  className={optionClasses}
                  whileHover={!isSubmitted ? { scale: 1.01 } : {}}
                  whileTap={!isSubmitted ? { scale: 0.99 } : {}}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        showCorrect
                          ? "bg-emerald text-white"
                          : showIncorrect
                          ? "bg-red-500 text-white"
                          : isSelected
                          ? "bg-amber text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="pt-1">{option}</span>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Feedback Section - Shows after answer is submitted */}
          <AnimatePresence>
            {isSubmitted && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="mb-6"
              >
                {/* XP Animation for correct answers */}
                {showXpAnimation && isCorrectAnswer && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
                    className="flex justify-center mb-4"
                  >
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald/20 text-emerald rounded-full text-lg font-bold">
                      <CheckCircle2 className="h-5 w-5" />
                      +{XP_PER_CORRECT_ANSWER} XP
                    </span>
                  </motion.div>
                )}

                {/* Sparky Feedback Message */}
                <Card className={`${isCorrectAnswer ? "border-emerald/50" : "border-amber/50"}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-4">
                      {isCorrectAnswer ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald/20 text-emerald text-sm font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Correct!
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 text-red-500 text-sm font-medium">
                          <XCircle className="h-3.5 w-3.5" />
                          Not Quite
                        </span>
                      )}
                    </div>

                    {/* Sparky Message */}
                    <SparkyMessage message={sparkyMessage} size="medium" className="mb-4" />

                    {/* Explanation */}
                    <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                        <Book className="h-4 w-4 text-purple" />
                        Explanation
                      </h4>
                      <p className="text-muted-foreground text-sm leading-relaxed mb-3">
                        {currentQuestion.explanation}
                      </p>
                      <p className="text-sm text-purple font-medium">
                        📖 Reference: {currentQuestion.necReference}
                      </p>
                    </div>

                    {/* Sparky Tip */}
                    <div className="mt-3 p-3 bg-amber/10 rounded-lg border border-amber/30">
                      <p className="text-sm text-foreground">
                        <span className="font-medium text-amber">💡 Sparky&apos;s Tip:</span>{" "}
                        {currentQuestion.sparkyTip}
                      </p>
                    </div>

                    {/* Bookmark suggestion for incorrect answers */}
                    {!isCorrectAnswer && !isBookmarked && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="mt-4 flex items-center justify-center"
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleBookmarkFromFeedback}
                          className="gap-2 border-amber text-amber hover:bg-amber/10"
                        >
                          <Bookmark className="h-4 w-4" />
                          Save this question for later review
                        </Button>
                      </motion.div>
                    )}

                    {/* Show if already bookmarked */}
                    {!isCorrectAnswer && isBookmarked && (
                      <div className="mt-4 flex items-center justify-center">
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber/10 text-amber rounded-full text-sm">
                          <Star className="h-4 w-4 fill-amber" />
                          Saved for review
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            {!isSubmitted ? (
              <Button
                onClick={handleSubmitAnswer}
                disabled={selectedAnswer === null}
                size="lg"
                className="bg-amber hover:bg-amber/90 text-white"
              >
                Submit Answer
              </Button>
            ) : (
              <Button
                onClick={handleNextQuestion}
                size="lg"
                className="bg-amber hover:bg-amber/90 text-white gap-2"
              >
                {isLastQuestion ? "See Results" : "Next Question"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
