"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useParams, useRouter, useSearchParams, notFound } from "next/navigation";
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
  Flame,
  RotateCcw,
  ChevronRight,
  ChevronDown,
  Save,
  Loader2,
  Lightbulb,
  Zap,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { SessionTimeoutWarning } from "@/components/session-timeout-warning";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { getRandomQuestions, getQuestionById, getQuestionCountByCategoryAndDifficulty } from "@/lib/questions";
import { getCategoryBySlug, type Question, type CategorySlug, type Difficulty } from "@/types/question";

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

// Sparky "on fire" messages for streaks of 3+
const ON_FIRE_MESSAGES = [
  "YOU'RE ON FIRE! 🔥 3 in a row! Keep that hot streak going!",
  "BLAZING HOT! 🔥 You're absolutely crushing it right now!",
  "UNSTOPPABLE! 🔥 Your knowledge is burning bright!",
  "ELECTRIC FIRE! ⚡🔥 Nothing can stop you now!",
  "SCORCHING STREAK! 🔥 You're lighting up this quiz!",
];

const STREAK_THRESHOLD = 3; // Number of correct answers to trigger "on fire"

// Sparky messages when streak is broken
const STREAK_BROKEN_MESSAGES = [
  "Streak broken, but don't sweat it! Every master electrician has had setbacks. Let's build a new one! 💪",
  "That streak had a good run! Shake it off and let's start fresh - you've got this!",
  "No worries about the streak! What matters is you're learning. Ready to fire up a new one? 🔥",
  "The streak may be gone, but your knowledge isn't! Let's get back on track together.",
  "Hey, streaks are made to be broken... and rebuilt! You're still making progress!",
];

const DEFAULT_QUESTIONS_PER_QUIZ = 60;
const XP_PER_CORRECT_ANSWER = 25;
const SESSION_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour
const SESSION_WARNING_MS = 5 * 60 * 1000; // 5 minutes before timeout
const QUIZ_STORAGE_PREFIX = "sparkypass-quiz-progress-";

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

// Particle burst from answer button (used during fire streaks)
function ParticleBurst({ x, y, id }: { x: number; y: number; id: number }) {
  const particles = useMemo(() => {
    return Array.from({ length: 50 }, (_, i) => {
      const angle = (i / 50) * 360 + (Math.random() * 15 - 7.5);
      const rad = (angle * Math.PI) / 180;
      const distance = 100 + Math.random() * 140;
      const size = 8 + Math.random() * 14;
      return {
        id: i,
        tx: Math.cos(rad) * distance,
        ty: Math.sin(rad) * distance,
        size,
        color: ["#F59E0B", "#EF4444", "#F97316", "#FBBF24", "#10B981", "#FDE68A", "#FB923C"][i % 7],
        delay: Math.random() * 0.12,
      };
    });
  }, []);

  return (
    <div
      key={id}
      className="fixed pointer-events-none z-50"
      style={{ left: x, top: y }}
    >
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1.5 }}
          animate={{
            x: p.tx,
            y: p.ty,
            opacity: 0,
            scale: 0,
          }}
          transition={{
            duration: 0.8,
            delay: p.delay,
            ease: "easeOut",
          }}
          style={{
            position: "absolute",
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            backgroundColor: p.color,
            boxShadow: `0 0 12px 4px ${p.color}`,
          }}
        />
      ))}
    </div>
  );
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
  showHint: boolean;
  correctStreak: number;
  bestStreak: number;
  showOnFire: boolean;
  streakBroken: boolean;
}

interface SavedQuizProgress {
  categorySlug: string;
  difficulty?: Difficulty;
  questionIds: string[];
  currentQuestionIndex: number;
  answers: Record<string, number>; // Serialized Map
  bookmarkedQuestions: string[]; // Serialized Set
  correctStreak: number;
  bestStreak: number;
  timestamp: number;
}

function createInitialState(categorySlug: CategorySlug, difficulty?: Difficulty, count?: number): QuizState {
  const questionCount = count && count > 0 ? count : 9999;
  const questions = getRandomQuestions(categorySlug, questionCount, difficulty);
  return {
    questions,
    currentQuestionIndex: 0,
    selectedAnswer: null,
    bookmarkedQuestions: new Set<string>(),
    answers: new Map(),
    isSubmitted: false,
    showXpAnimation: false,
    sparkyMessage: "",
    showHint: false,
    correctStreak: 0,
    bestStreak: 0,
    showOnFire: false,
    streakBroken: false,
  };
}

const DIFFICULTY_CONFIG: { value: Difficulty; label: string; description: string; color: string; bg: string; border: string }[] = [
  {
    value: "easy",
    label: "Easy",
    description: "Fundamental concepts and straightforward NEC references",
    color: "text-emerald",
    bg: "bg-emerald/10",
    border: "border-emerald/30 hover:border-emerald/60",
  },
  {
    value: "medium",
    label: "Medium",
    description: "Applied knowledge with multi-step calculations",
    color: "text-amber",
    bg: "bg-amber/10",
    border: "border-amber/30 hover:border-amber/60",
  },
  {
    value: "hard",
    label: "Hard",
    description: "Complex scenarios and deep NEC code references",
    color: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500/30 hover:border-red-500/60",
  },
];

export default function QuizTakingPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const categorySlug = params.category as CategorySlug;
  const autoResume = searchParams.get("resume") === "true";

  const category = useMemo(() => getCategoryBySlug(categorySlug), [categorySlug]);

  // Difficulty selection state
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);

  // User quiz preferences
  const { status: authStatus } = useSession();
  const [showHintsOnHard, setShowHintsOnHard] = useState(false);
  const [questionsPerQuiz, setQuestionsPerQuiz] = useState(DEFAULT_QUESTIONS_PER_QUIZ);

  // Resume prompt state
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [savedProgress, setSavedProgress] = useState<SavedQuizProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize state lazily with questions (will be re-initialized after difficulty selection)
  const [quizState, setQuizState] = useState<QuizState>(() =>
    createInitialState(categorySlug)
  );

  const { questions, currentQuestionIndex, selectedAnswer, bookmarkedQuestions, answers, isSubmitted, showXpAnimation, sparkyMessage, correctStreak, bestStreak, showOnFire, streakBroken } = quizState;
  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const progressPercentage = totalQuestions > 0
    ? (currentQuestionIndex / totalQuestions) * 100
    : 0;

  // Determine if the current answer is correct (only after submission)
  const isCorrectAnswer = isSubmitted && selectedAnswer === currentQuestion?.correctAnswer;

  // Ref to track timeout for XP animation reset
  const xpTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Ref for feedback section to scroll to
  const feedbackRef = useRef<HTMLDivElement | null>(null);

  // Refs for answer button positions (particle burst)
  const answerButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [particleBurst, setParticleBurst] = useState<{ x: number; y: number; id: number } | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (xpTimeoutRef.current) {
        clearTimeout(xpTimeoutRef.current);
      }
    };
  }, []);

  // Check for saved progress on mount
  useEffect(() => {
    const saved = localStorage.getItem(QUIZ_STORAGE_PREFIX + categorySlug);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as SavedQuizProgress;
        // Check if saved progress is not too old (24 hours)
        const isRecent = Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000;
        const hasProgress = parsed.currentQuestionIndex > 0 || Object.keys(parsed.answers).length > 0;

        if (isRecent && hasProgress) {
          if (autoResume) {
            // Auto-resume: skip the prompt and restore progress directly
            const questions = parsed.questionIds
              .map(id => getQuestionById(id))
              .filter((q): q is Question => q !== undefined);

            if (questions.length > 0) {
              if (parsed.difficulty) {
                setSelectedDifficulty(parsed.difficulty as Difficulty);
              }
              setQuizState({
                questions,
                currentQuestionIndex: parsed.currentQuestionIndex,
                selectedAnswer: null,
                bookmarkedQuestions: new Set(parsed.bookmarkedQuestions),
                answers: new Map(Object.entries(parsed.answers).map(([k, v]) => [k, v])),
                isSubmitted: false,
                showXpAnimation: false,
                sparkyMessage: "",
                showHint: false,
                correctStreak: parsed.correctStreak,
                bestStreak: parsed.bestStreak || parsed.correctStreak,
                showOnFire: parsed.correctStreak >= STREAK_THRESHOLD,
                streakBroken: false,
              });
            } else {
              // Questions no longer exist, show prompt
              setSavedProgress(parsed);
              setShowResumePrompt(true);
            }
          } else {
            setSavedProgress(parsed);
            setShowResumePrompt(true);
          }
        }
      } catch {
        // Invalid saved state, ignore
      }
    }
    setIsLoading(false);
  }, [categorySlug, autoResume]);

  // Fetch user's quiz preferences
  useEffect(() => {
    if (authStatus !== "authenticated") return;
    fetch("/api/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.showHintsOnHard !== undefined) {
          setShowHintsOnHard(data.showHintsOnHard);
        }
        if (data?.questionsPerQuiz !== undefined) {
          setQuestionsPerQuiz(data.questionsPerQuiz);
        }
      })
      .catch(() => {});
  }, [authStatus]);

  // Save progress to localStorage
  const saveProgress = useCallback((state: QuizState) => {
    const toSave: SavedQuizProgress = {
      categorySlug,
      difficulty: selectedDifficulty ?? undefined,
      questionIds: state.questions.map(q => q.id),
      currentQuestionIndex: state.currentQuestionIndex,
      answers: Object.fromEntries(state.answers),
      bookmarkedQuestions: Array.from(state.bookmarkedQuestions),
      correctStreak: state.correctStreak,
      bestStreak: state.bestStreak,
      timestamp: Date.now(),
    };
    localStorage.setItem(QUIZ_STORAGE_PREFIX + categorySlug, JSON.stringify(toSave));
  }, [categorySlug, selectedDifficulty]);

  // Clear saved progress
  const clearSavedProgress = useCallback(() => {
    localStorage.removeItem(QUIZ_STORAGE_PREFIX + categorySlug);
  }, []);

  // Handle continuing saved progress
  const handleContinueProgress = useCallback(() => {
    if (!savedProgress) return;

    // Reload the same questions
    const questions = savedProgress.questionIds
      .map(id => getQuestionById(id))
      .filter((q): q is Question => q !== undefined);

    if (questions.length === 0) {
      // Questions no longer exist, start fresh
      handleStartFresh();
      return;
    }

    if (savedProgress.difficulty) {
      setSelectedDifficulty(savedProgress.difficulty);
    }

    setQuizState({
      questions,
      currentQuestionIndex: savedProgress.currentQuestionIndex,
      selectedAnswer: null,
      bookmarkedQuestions: new Set(savedProgress.bookmarkedQuestions),
      answers: new Map(Object.entries(savedProgress.answers).map(([k, v]) => [k, v])),
      isSubmitted: false,
      showXpAnimation: false,
      sparkyMessage: "",
      showHint: false,
      correctStreak: savedProgress.correctStreak,
      bestStreak: savedProgress.bestStreak || savedProgress.correctStreak,
      showOnFire: savedProgress.correctStreak >= STREAK_THRESHOLD,
      streakBroken: false,
    });
    setShowResumePrompt(false);
    setSavedProgress(null);
  }, [savedProgress]);

  // Handle starting fresh
  const handleStartFresh = useCallback(() => {
    clearSavedProgress();
    setQuizState(createInitialState(categorySlug, selectedDifficulty ?? undefined, questionsPerQuiz));
    setShowResumePrompt(false);
    setSavedProgress(null);
  }, [categorySlug, selectedDifficulty, questionsPerQuiz, clearSavedProgress]);

  // Handle difficulty selection
  const handleDifficultySelect = useCallback((difficulty: Difficulty) => {
    setSelectedDifficulty(difficulty);
    setQuizState(createInitialState(categorySlug, difficulty, questionsPerQuiz));
  }, [categorySlug, questionsPerQuiz]);

  // Auto-save progress when quiz state changes
  useEffect(() => {
    // Only save if we have questions and have made progress
    if (!showResumePrompt && quizState.questions.length > 0) {
      const hasProgress = quizState.currentQuestionIndex > 0 || quizState.answers.size > 0;
      if (hasProgress) {
        saveProgress(quizState);
      }
    }
  }, [quizState.currentQuestionIndex, quizState.answers.size, quizState.correctStreak, showResumePrompt, saveProgress, quizState]);

  // Fetch pre-quiz XP, bookmarks, and create study session on mount
  useEffect(() => {
    async function initializeQuiz() {
      try {
        // Fetch user data, bookmarks, and create session in parallel
        const [userResponse, bookmarksResponse, sessionResponse] = await Promise.all([
          fetch("/api/user"),
          fetch("/api/bookmarks"),
          fetch("/api/sessions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionType: "quiz", categorySlug }),
          }),
        ]);

        // Store pre-quiz XP for level-up detection
        if (userResponse.ok) {
          const userData = await userResponse.json();
          sessionStorage.setItem("preQuizXP", String(userData.xp || 0));
        }

        // Load bookmarks from database
        if (bookmarksResponse.ok) {
          const bookmarksData = await bookmarksResponse.json();
          const bookmarkedIds = new Set<string>(
            bookmarksData.bookmarks.map((b: { questionId: string }) => b.questionId)
          );
          setQuizState((prev) => ({
            ...prev,
            bookmarkedQuestions: bookmarkedIds,
          }));
        }

        // Store session ID
        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json();
          sessionStorage.setItem("currentSessionId", sessionData.sessionId);
        }
      } catch {
        // Silently fail - tracking just won't work
      }
    }
    initializeQuiz();
  }, []);

  // Handle session timeout - end session and navigate to results
  const handleSessionTimeout = useCallback(async () => {
    // Calculate XP earned from correct answers so far
    let correctCount = 0;
    questions.forEach((q) => {
      if (answers.get(q.id) === q.correctAnswer) {
        correctCount++;
      }
    });
    const xpEarned = correctCount * XP_PER_CORRECT_ANSWER;

    // End the study session
    const sessionId = sessionStorage.getItem("currentSessionId");
    if (sessionId) {
      try {
        await fetch("/api/sessions", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, xpEarned, questionsAnswered: answers.size, questionsCorrect: correctCount }),
        });
      } catch {
        // Silently fail
      }
    }

    // Navigate to results with current progress
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
    sessionStorage.setItem("bestStreak", String(bestStreak));
    if (selectedDifficulty) sessionStorage.setItem("quizDifficulty", selectedDifficulty);
    sessionStorage.setItem("sessionTimedOut", "true");
    clearSavedProgress();
    router.push(`/quiz/${categorySlug}/results`);
  }, [questions, answers, bookmarkedQuestions, bestStreak, categorySlug, router, clearSavedProgress]);

  // Session timeout hook - 1 hour with 5 minute warning
  const {
    showWarning: showTimeoutWarning,
    remainingTime: timeoutRemainingTime,
    dismissWarning: dismissTimeoutWarning,
  } = useSessionTimeout({
    timeoutMs: SESSION_TIMEOUT_MS,
    warningMs: SESSION_WARNING_MS,
    onTimeout: handleSessionTimeout,
    enabled: true,
  });

  const handleSelectAnswer = useCallback((answerIndex: number) => {
    setQuizState((prev) => {
      if (prev.isSubmitted) return prev;
      return {
        ...prev,
        selectedAnswer: answerIndex,
      };
    });
  }, []);

  const handleToggleBookmark = useCallback(async () => {
    const question = quizState.questions[quizState.currentQuestionIndex];
    if (!question) return;

    const isCurrentlyBookmarked = quizState.bookmarkedQuestions.has(question.id);

    // Optimistically update UI
    setQuizState((prev) => {
      const newBookmarks = new Set(prev.bookmarkedQuestions);
      if (isCurrentlyBookmarked) {
        newBookmarks.delete(question.id);
      } else {
        newBookmarks.add(question.id);
      }
      return {
        ...prev,
        bookmarkedQuestions: newBookmarks,
      };
    });

    // Persist to database
    try {
      if (isCurrentlyBookmarked) {
        // Remove bookmark
        await fetch("/api/bookmarks", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId: question.id }),
        });
      } else {
        // Add bookmark
        await fetch("/api/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId: question.id }),
        });
      }
    } catch (error) {
      // Revert on error
      console.error("Failed to toggle bookmark:", error);
      setQuizState((prev) => {
        const newBookmarks = new Set(prev.bookmarkedQuestions);
        if (isCurrentlyBookmarked) {
          newBookmarks.add(question.id);
        } else {
          newBookmarks.delete(question.id);
        }
        return {
          ...prev,
          bookmarkedQuestions: newBookmarks,
        };
      });
    }
  }, [quizState.questions, quizState.currentQuestionIndex, quizState.bookmarkedQuestions]);

  const handleSubmitAnswer = useCallback(async () => {
    // Get current state values
    const { selectedAnswer, questions, currentQuestionIndex } = quizState;
    if (selectedAnswer === null) return;

    const question = questions[currentQuestionIndex];
    if (!question) return;

    const isCorrect = selectedAnswer === question.correctAnswer;

    // Save progress to database
    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: question.id,
          isCorrect,
        }),
      });
    } catch (error) {
      console.error('Failed to save progress:', error);
    }

    // Update local state
    setQuizState((prev) => {
      const newAnswers = new Map(prev.answers);
      newAnswers.set(question.id, selectedAnswer);

      // Update streak
      const newStreak = isCorrect ? prev.correctStreak + 1 : 0;
      const justHitStreak = isCorrect && newStreak >= STREAK_THRESHOLD && prev.correctStreak < STREAK_THRESHOLD;
      const isOnFire = newStreak >= STREAK_THRESHOLD;
      const wasOnFire = prev.correctStreak >= STREAK_THRESHOLD;
      const streakJustBroken = !isCorrect && wasOnFire;

      // Determine message based on streak
      let message: string;
      if (streakJustBroken) {
        // Streak was just broken - show encouraging message
        message = getRandomMessage(STREAK_BROKEN_MESSAGES);
      } else if (justHitStreak) {
        // Just hit the streak threshold - show on fire message
        message = getRandomMessage(ON_FIRE_MESSAGES);
      } else if (isCorrect && isOnFire) {
        // Continuing the streak
        message = `🔥 ${newStreak} in a row! ${getRandomMessage(CORRECT_MESSAGES)}`;
      } else if (isCorrect) {
        message = getRandomMessage(CORRECT_MESSAGES);
      } else {
        message = getRandomMessage(INCORRECT_MESSAGES);
      }

      // Fire celebration for correct answers
      if (isCorrect) {
        if (isOnFire && selectedAnswer !== null) {
          // Particle burst from the selected answer button
          const btn = answerButtonRefs.current[selectedAnswer];
          if (btn) {
            const rect = btn.getBoundingClientRect();
            setParticleBurst({
              x: rect.left + rect.width / 2,
              y: rect.top + rect.height / 2,
              id: Date.now(),
            });
          }
        } else {
          fireConfetti();
        }
      }

      // Scroll to feedback section after a short delay with smooth animation
      setTimeout(() => {
        feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 500);

      const newBestStreak = Math.max(prev.bestStreak, newStreak);

      return {
        ...prev,
        answers: newAnswers,
        isSubmitted: true,
        showXpAnimation: isCorrect,
        sparkyMessage: message,
        correctStreak: newStreak,
        bestStreak: newBestStreak,
        showOnFire: isCorrect && isOnFire,
        streakBroken: streakJustBroken,
        showHint: false,
      };
    });
  }, [quizState]);

  const handleNextQuestion = useCallback(async () => {
    const isLast = currentQuestionIndex >= totalQuestions - 1;

    if (isLast) {
      // Calculate XP earned from correct answers
      let correctCount = 0;
      questions.forEach((q) => {
        if (answers.get(q.id) === q.correctAnswer) {
          correctCount++;
        }
      });
      const xpEarned = correctCount * XP_PER_CORRECT_ANSWER;

      // End the study session
      const sessionId = sessionStorage.getItem("currentSessionId");
      if (sessionId) {
        try {
          await fetch("/api/sessions", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId, xpEarned, questionsAnswered: answers.size, questionsCorrect: correctCount }),
          });
        } catch {
          // Silently fail
        }
      }

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
      sessionStorage.setItem("bestStreak", String(bestStreak));
      if (selectedDifficulty) sessionStorage.setItem("quizDifficulty", selectedDifficulty);
      clearSavedProgress();
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
        showHint: false,
      }));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentQuestionIndex, totalQuestions, answers, questions, bookmarkedQuestions, bestStreak, categorySlug, router, clearSavedProgress]);

  // Bookmark handler specifically for the feedback section
  const handleBookmarkFromFeedback = useCallback(async () => {
    const question = quizState.questions[quizState.currentQuestionIndex];
    if (!question) return;

    // Optimistically update UI
    setQuizState((prev) => {
      const newBookmarks = new Set(prev.bookmarkedQuestions);
      newBookmarks.add(question.id);
      return {
        ...prev,
        bookmarkedQuestions: newBookmarks,
      };
    });

    // Persist to database
    try {
      await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: question.id }),
      });
    } catch (error) {
      // Revert on error
      console.error("Failed to save bookmark:", error);
      setQuizState((prev) => {
        const newBookmarks = new Set(prev.bookmarkedQuestions);
        newBookmarks.delete(question.id);
        return {
          ...prev,
          bookmarkedQuestions: newBookmarks,
        };
      });
    }
  }, [quizState.questions, quizState.currentQuestionIndex]);

  const handlePrevQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      // Clear any pending timeout
      if (xpTimeoutRef.current) {
        clearTimeout(xpTimeoutRef.current);
        xpTimeoutRef.current = null;
      }
      setQuizState((prev) => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex - 1,
        selectedAnswer: prev.answers.get(prev.questions[prev.currentQuestionIndex - 1]?.id) ?? null,
        isSubmitted: prev.answers.has(prev.questions[prev.currentQuestionIndex - 1]?.id),
        showXpAnimation: false,
        sparkyMessage: "",
        showHint: false,
      }));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentQuestionIndex]);

  const handleExit = useCallback(() => {
    router.push("/quiz");
  }, [router]);

  // Redirect if invalid category or no questions
  if (!category || totalQuestions === 0) {
    notFound();
  }

  // Show loading state while checking for saved progress
  if (isLoading) {
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
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh] relative z-10">
          <Loader2 className="h-8 w-8 animate-spin text-amber" />
        </div>
      </main>
    );
  }

  // Show resume prompt if there's saved progress
  if (showResumePrompt && savedProgress) {
    const progressPercent = Math.round(
      (savedProgress.currentQuestionIndex / savedProgress.questionIds.length) * 100
    );
    const answeredCount = Object.keys(savedProgress.answers).length;

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
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh] relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <Card className="border-border dark:border-stone-800 bg-card dark:bg-stone-900/50">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-amber/10 flex items-center justify-center mx-auto mb-4">
                <Save className="h-8 w-8 text-amber" />
              </div>
              <CardTitle className="text-xl font-display">Welcome Back!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">
                  You have a quiz in progress.
                </p>

                <div className="bg-muted dark:bg-stone-800 rounded-lg p-4 text-left space-y-2">
                  <div className="flex items-center gap-2">
                    <Book className="h-4 w-4 text-amber" />
                    <span className="font-medium">{category?.name}</span>
                    {savedProgress.difficulty && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        savedProgress.difficulty === "easy"
                          ? "bg-emerald/10 text-emerald"
                          : savedProgress.difficulty === "medium"
                          ? "bg-amber/10 text-amber"
                          : "bg-red-500/10 text-red-500"
                      }`}>
                        {savedProgress.difficulty.charAt(0).toUpperCase() + savedProgress.difficulty.slice(1)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>
                      {answeredCount} of {savedProgress.questionIds.length} questions answered
                    </span>
                  </div>
                  {savedProgress.correctStreak >= STREAK_THRESHOLD && (
                    <div className="flex items-center gap-2 text-sm text-orange-500">
                      <Flame className="h-3.5 w-3.5" />
                      <span>{savedProgress.correctStreak} streak!</span>
                    </div>
                  )}
                  {/* Progress bar */}
                  <div className="pt-2">
                    <div className="h-2 bg-background rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber rounded-full transition-all"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 text-right">
                      {progressPercent}% complete
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleContinueProgress}
                  className="bg-amber hover:bg-amber/90 w-full"
                >
                  <ChevronRight className="h-4 w-4 mr-2" />
                  Continue Where I Left Off
                </Button>
                <Button
                  variant="outline"
                  onClick={handleStartFresh}
                  className="w-full border-border dark:border-stone-700"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Start a New Quiz
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        </div>
      </main>
    );
  }

  // Show difficulty selection if not yet chosen
  if (!selectedDifficulty) {
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
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh] relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <Card className="border-border dark:border-stone-800 bg-card dark:bg-stone-900/50">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-amber/10 flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-amber" />
              </div>
              <CardTitle className="text-xl font-display">{category?.name}</CardTitle>
              <p className="text-muted-foreground text-sm mt-1">
                Choose your difficulty level
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {DIFFICULTY_CONFIG.map((diff) => {
                const count = getQuestionCountByCategoryAndDifficulty(categorySlug, diff.value);
                return (
                  <button
                    key={diff.value}
                    onClick={() => handleDifficultySelect(diff.value)}
                    disabled={count === 0}
                    className={`w-full text-left p-4 rounded-lg border transition-all ${diff.border} ${
                      count === 0 ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-bold ${diff.color}`}>{diff.label}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${diff.bg} ${diff.color}`}>
                        {count} questions
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{diff.description}</p>
                  </button>
                );
              })}

              <Button
                variant="ghost"
                onClick={() => router.push("/quiz")}
                className="w-full mt-2 text-muted-foreground"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Categories
              </Button>
            </CardContent>
          </Card>
        </motion.div>
        </div>
      </main>
    );
  }

  const isBookmarked = currentQuestion
    ? bookmarkedQuestions.has(currentQuestion.id)
    : false;
  const isLastQuestion = currentQuestionIndex >= totalQuestions - 1;

  // Shake animation keyframes for streak break
  const shakeAnimation = streakBroken
    ? {
        x: [0, -10, 10, -10, 10, -5, 5, 0],
        transition: { duration: 0.5 },
      }
    : {};

  // Check if user is on fire (3+ streak)
  const isOnFireStreak = correctStreak >= STREAK_THRESHOLD;

  // Hints are visible unless on hard difficulty with showHintsOnHard disabled
  const hintsVisible = selectedDifficulty !== "hard" || showHintsOnHard;

  return (
    <>
      {/* Quick green/gold flash on correct answer */}
      <AnimatePresence>
        {isSubmitted && isCorrectAnswer && (
          <motion.div
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="fixed inset-0 pointer-events-none z-50 bg-emerald/15"
          />
        )}
      </AnimatePresence>

      {/* Particle burst from answer button during fire streak */}
      {particleBurst && (
        <ParticleBurst
          key={particleBurst.id}
          x={particleBurst.x}
          y={particleBurst.y}
          id={particleBurst.id}
        />
      )}

      <motion.main
        className="relative min-h-screen bg-cream dark:bg-stone-950"
        animate={shakeAnimation}
      >
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(245,158,11,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div className="container mx-auto px-4 py-6 max-w-4xl relative z-10">
      {/* Progress Bar - hidden on mobile, shown below submit instead */}
      <div className="hidden md:block mb-6">
        <div className={`h-2 bg-muted dark:bg-stone-800 rounded-full overflow-hidden transition-shadow duration-500 ${
          isOnFireStreak ? "shadow-[0_0_12px_3px_rgba(249,115,22,0.6)]" : ""
        }`}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`h-full rounded-full transition-all duration-500 ${
              isOnFireStreak
                ? "bg-gradient-to-r from-orange-500 via-amber to-red-500 bg-[length:200%_100%] animate-[shimmer_2s_linear_infinite]"
                : "bg-gradient-to-r from-amber to-amber-light"
            }`}
          />
        </div>
      </div>

      {/* Navigation Bar - hidden on mobile, shown below submit instead */}
      <div className="hidden md:flex items-center justify-between gap-3 mb-6">
        {/* Left - Exit */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden h-9 w-9">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="default" className="hidden md:inline-flex gap-2">
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

        {/* Center - Previous chevron, question counter, streak */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevQuestion}
            disabled={currentQuestionIndex === 0}
            className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium text-muted-foreground">
            {currentQuestionIndex + 1} / {totalQuestions}
          </span>
          <button
            onClick={handleNextQuestion}
            disabled={!isSubmitted}
            className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          {correctStreak >= STREAK_THRESHOLD && (
            <motion.span
              key={correctStreak}
              initial={{ opacity: 0, scale: 0.5, rotate: -15 }}
              animate={{
                opacity: 1,
                scale: correctStreak >= 10 ? 1.2 : correctStreak >= 7 ? 1.1 : 1,
                rotate: 0,
              }}
              transition={{ type: "spring", bounce: 0.5 }}
              className={`inline-flex items-center gap-1 rounded-full font-bold border ${
                correctStreak >= 10
                  ? "px-3 py-1.5 text-sm bg-gradient-to-r from-red-500/30 via-orange-500/30 to-yellow-500/30 text-red-500 border-red-500/50 shadow-[0_0_10px_2px_rgba(239,68,68,0.3)]"
                  : correctStreak >= 7
                  ? "px-2.5 py-1 text-xs bg-gradient-to-r from-orange-500/25 to-red-500/25 text-orange-500 border-orange-500/40 shadow-[0_0_8px_2px_rgba(249,115,22,0.25)]"
                  : correctStreak >= 5
                  ? "px-2.5 py-1 text-xs bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-500 border-orange-500/30"
                  : "px-2 py-1 text-xs bg-gradient-to-r from-orange-500/15 to-red-500/15 text-orange-500 border-orange-500/25"
              }`}
            >
              <motion.span
                animate={correctStreak >= 7 ? {
                  scale: [1, 1.3, 1],
                  rotate: [0, -10, 10, 0],
                } : correctStreak >= 5 ? {
                  scale: [1, 1.15, 1],
                } : {}}
                transition={{
                  duration: correctStreak >= 7 ? 0.8 : 1,
                  repeat: Infinity,
                  repeatDelay: correctStreak >= 10 ? 0.3 : 0.8,
                }}
              >
                <Flame className={correctStreak >= 10 ? "h-4 w-4" : "h-3 w-3"} />
              </motion.span>
              {correctStreak}
              {correctStreak >= 10 && "🔥"}
            </motion.span>
          )}
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple/10 text-purple hidden sm:inline-flex">
            {category?.name}
          </span>
          {selectedDifficulty && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              selectedDifficulty === "easy"
                ? "bg-emerald/10 text-emerald"
                : selectedDifficulty === "medium"
                ? "bg-amber/10 text-amber"
                : "bg-red-500/10 text-red-500"
            }`}>
              {selectedDifficulty.charAt(0).toUpperCase() + selectedDifficulty.slice(1)}
            </span>
          )}
        </div>

        {/* Right - Save (icon on mobile, full on desktop) + Submit/Next (desktop only) */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleToggleBookmark}
            className={`md:hidden h-9 w-9 ${isBookmarked ? "text-amber border-amber" : ""}`}
          >
            {isBookmarked ? (
              <Star className="h-4 w-4 fill-amber" />
            ) : (
              <StarOff className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="default"
            onClick={handleToggleBookmark}
            className={`hidden md:inline-flex gap-2 ${isBookmarked ? "text-amber border-amber" : ""}`}
          >
            {isBookmarked ? (
              <Star className="h-4 w-4 fill-amber" />
            ) : (
              <StarOff className="h-4 w-4" />
            )}
            {isBookmarked ? "Saved" : "Save"}
          </Button>

          {/* Submit/Next - desktop only */}
          <div className="hidden md:block">
            {!isSubmitted ? (
              <Button
                onClick={handleSubmitAnswer}
                disabled={selectedAnswer === null}
                size="default"
                className="bg-amber hover:bg-amber/90 text-white gap-2"
              >
                Submit
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleNextQuestion}
                size="default"
                className="bg-amber hover:bg-amber/90 text-white gap-2"
              >
                {isLastQuestion ? "See Results" : "Next"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
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
          <Card className="mb-6 border-border dark:border-stone-800 bg-card dark:bg-stone-900/50">
            <CardContent className="pt-6">
              {/* Hint Button */}
              {hintsVisible && (
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => setQuizState(prev => ({ ...prev, showHint: !prev.showHint }))}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border transition-all ${
                    quizState.showHint
                      ? "bg-amber text-white border-amber"
                      : "bg-amber/10 text-amber border-amber/30 hover:bg-amber/20"
                  }`}
                >
                  <Lightbulb className="h-3.5 w-3.5" />
                  Hint
                  <motion.div
                    animate={{ rotate: quizState.showHint ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </motion.div>
                </button>
              </div>
              )}

              {/* Question Text */}
              <h2 className="text-lg md:text-xl font-semibold text-foreground leading-relaxed">
                {currentQuestion.questionText}
              </h2>

              {/* Expandable Hint Section - Below Question */}
              <AnimatePresence>
                {hintsVisible && quizState.showHint && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <div className="mt-5 p-4 rounded-xl backdrop-blur-md bg-white/10 dark:bg-black/20 border border-white/20 dark:border-white/10 shadow-xl">
                        {/* NEC Reference - Staggered Entry */}
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: 0.1 }}
                          className="flex items-start gap-3"
                        >
                          <div className="p-2 rounded-lg bg-purple/20">
                            <Book className="h-4 w-4 text-purple" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">NEC Reference</p>
                            <p className="text-sm font-semibold text-purple">
                              {currentQuestion.necReference}
                            </p>
                          </div>
                        </motion.div>

                        {/* Sparky Tip - Staggered Entry */}
                        {currentQuestion.sparkyTip && (
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: 0.25 }}
                            className="flex items-start gap-3 mt-4 pt-4 border-t border-white/20 dark:border-white/10"
                          >
                            <div className="p-2 rounded-lg bg-amber/20">
                              <Zap className="h-4 w-4 text-amber" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Sparky Tip</p>
                              <p className="text-sm text-foreground leading-relaxed">
                                {currentQuestion.sparkyTip}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                )}
              </AnimatePresence>
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
                optionClasses += "border-border bg-muted/50 dark:bg-stone-800/50 text-muted-foreground";
              } else {
                optionClasses +=
                  "border-border hover:border-amber/50 hover:bg-muted/50 dark:hover:bg-stone-800/50 cursor-pointer";
              }

              return (
                <motion.button
                  key={index}
                  ref={(el) => { answerButtonRefs.current[index] = el; }}
                  onClick={() => handleSelectAnswer(index)}
                  disabled={isSubmitted}
                  className={optionClasses}
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
                          : "bg-muted dark:bg-stone-800 text-muted-foreground"
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

          {/* Mobile Submit/Next Button - visible only on small screens */}
          <div className="flex justify-center mb-6 md:hidden">
            {!isSubmitted ? (
              <Button
                onClick={handleSubmitAnswer}
                disabled={selectedAnswer === null}
                size="lg"
                className="bg-amber hover:bg-amber/90 text-white gap-2 w-full"
              >
                Submit
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleNextQuestion}
                size="lg"
                className="bg-amber hover:bg-amber/90 text-white gap-2 w-full"
              >
                {isLastQuestion ? "See Results" : "Next Question"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Mobile Progress Bar & Nav - visible only on small screens */}
          <div className="md:hidden mb-4">
            {/* Mobile Progress Bar */}
            <div className={`h-2 bg-muted dark:bg-stone-800 rounded-full overflow-hidden transition-shadow duration-500 mb-3 ${
              isOnFireStreak ? "shadow-[0_0_12px_3px_rgba(249,115,22,0.6)]" : ""
            }`}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={`h-full rounded-full transition-all duration-500 ${
                  isOnFireStreak
                    ? "bg-gradient-to-r from-orange-500 via-amber to-red-500 bg-[length:200%_100%] animate-[shimmer_2s_linear_infinite]"
                    : "bg-gradient-to-r from-amber to-amber-light"
                }`}
              />
            </div>
            {/* Mobile Nav Row */}
            <div className="flex items-center justify-between">
              {/* Left - Exit */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9">
                    <ChevronLeft className="h-4 w-4" />
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

              {/* Center - Question counter, difficulty, category */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-medium text-muted-foreground">
                  {currentQuestionIndex + 1} / {totalQuestions}
                </span>
                <button
                  onClick={handleNextQuestion}
                  disabled={!isSubmitted}
                  className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                {selectedDifficulty && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    selectedDifficulty === "easy"
                      ? "bg-emerald/10 text-emerald"
                      : selectedDifficulty === "medium"
                      ? "bg-amber/10 text-amber"
                      : "bg-red-500/10 text-red-500"
                  }`}>
                    {selectedDifficulty.charAt(0).toUpperCase() + selectedDifficulty.slice(1)}
                  </span>
                )}
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple/10 text-purple">
                  {category?.name}
                </span>
              </div>

              {/* Right - Save */}
              <Button
                variant="outline"
                size="icon"
                onClick={handleToggleBookmark}
                className={`h-9 w-9 ${isBookmarked ? "text-amber border-amber" : ""}`}
              >
                {isBookmarked ? (
                  <Star className="h-4 w-4 fill-amber" />
                ) : (
                  <StarOff className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Feedback Section - Shows after answer is submitted */}
          <AnimatePresence>
            {isSubmitted && (
              <motion.div
                ref={feedbackRef}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="mb-6"
              >
                {/* XP and Streak badges - persist while on streak */}
                <div className="flex justify-center gap-3 mb-4 flex-wrap">
                  {/* XP Animation for correct answers */}
                  {isCorrectAnswer && (
                    <motion.span
                      initial={{ opacity: 0, y: 20, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-emerald/20 text-emerald rounded-full text-lg font-bold"
                    >
                      <CheckCircle2 className="h-5 w-5" />
                      +{XP_PER_CORRECT_ANSWER} XP
                    </motion.span>
                  )}
                  {/* Streak fire badge - persists while on streak */}
                  {correctStreak >= STREAK_THRESHOLD && (
                    <motion.span
                      key={`feedback-streak-${correctStreak}`}
                      initial={{ opacity: 0, scale: 0, rotate: -180 }}
                      animate={{
                        opacity: 1,
                        scale: correctStreak >= 10 ? 1.15 : 1,
                        rotate: 0,
                      }}
                      transition={{ duration: 0.5, type: "spring", bounce: 0.5 }}
                      className={`inline-flex items-center gap-1.5 rounded-full font-bold border ${
                        correctStreak >= 10
                          ? "px-4 py-2 text-base bg-gradient-to-r from-red-500/30 via-orange-500/30 to-yellow-500/30 text-red-500 border-red-500/50 shadow-[0_0_8px_2px_rgba(239,68,68,0.3)]"
                          : correctStreak >= 7
                          ? "px-3.5 py-1.5 text-sm bg-gradient-to-r from-orange-500/25 to-red-500/25 text-orange-500 border-orange-500/40 shadow-[0_0_6px_2px_rgba(249,115,22,0.25)]"
                          : "px-3 py-1.5 text-sm bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-500 border-orange-500/30"
                      }`}
                    >
                      <motion.span
                        animate={correctStreak >= 7 ? {
                          scale: [1, 1.3, 1],
                          rotate: [0, -10, 10, 0],
                        } : {
                          scale: [1, 1.15, 1],
                        }}
                        transition={{
                          duration: correctStreak >= 7 ? 0.8 : 1,
                          repeat: Infinity,
                          repeatDelay: correctStreak >= 10 ? 0.3 : 0.8,
                        }}
                      >
                        <Flame className={correctStreak >= 10 ? "h-6 w-6" : "h-5 w-5"} />
                      </motion.span>
                      {correctStreak} Streak!{correctStreak >= 10 && " 🔥"}
                    </motion.span>
                  )}
                </div>

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
                    <div className="mt-4 p-4 bg-muted/50 dark:bg-stone-800/50 rounded-lg">
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

                {/* Bottom Next Button */}
                <div className="flex justify-center mt-6">
                  <Button
                    onClick={handleNextQuestion}
                    size="lg"
                    className="bg-amber hover:bg-amber/90 text-white gap-2 px-8"
                  >
                    {isLastQuestion ? "See Results" : "Next Question"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      </AnimatePresence>

      {/* Session Timeout Warning */}
      <SessionTimeoutWarning
        open={showTimeoutWarning}
        remainingTime={timeoutRemainingTime}
        onContinue={dismissTimeoutWarning}
      />
      </div>
    </motion.main>
    </>
  );
}
