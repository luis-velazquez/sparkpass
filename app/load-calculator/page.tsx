"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import confetti from "canvas-confetti";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator,
  HelpCircle,
  Lightbulb,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  RotateCcw,
  Save,
  Home,
  Zap,
  CheckCircle2,
  XCircle,
  BookOpen,
  Loader2,
  Trophy,
  ArrowRight,
  Delete,
  Equal,
  Plus,
  Minus,
  X,
  Divide,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SparkyMessage } from "@/components/sparky";
import {
  HOUSE_SCENARIOS,
  CALCULATION_STEPS,
  SPARKY_MESSAGES,
  getRandomMessage,
  getAccountedApplianceIds,
  TOTAL_VA_COMPONENT_STEPS,
  QUICK_REFERENCE_ITEMS,
  isQuickRefCovered,
  STEP_APPLIANCE_MAP,
  MOTOR_CONVERSION_STEPS,
  DIFFICULTY_LEVELS,
  type HouseScenario,
  type CalculationStep,
  type DifficultyLevel,
} from "./calculator-data";

interface CalculatorState {
  difficulty: DifficultyLevel | null;
  selectedScenario: HouseScenario | null;
  currentStepIndex: number;
  answers: Record<string, number>;
  userInput: string;
  showHint: boolean;
  lastAnswerCorrect: boolean | null;
  sparkyMessage: string;
  isComplete: boolean;
  manualScratchedOff: Set<string>; // For intermediate mode manual tracking
}

interface SavedProgress {
  difficulty: DifficultyLevel;
  scenarioId: string;
  currentStepIndex: number;
  answers: Record<string, number>;
  isComplete: boolean;
}

// Helper to get hint text (handles both string and function hints)
function getHintText(
  step: CalculationStep,
  scenario: HouseScenario | null,
  answers: Record<string, number>
): string {
  if (typeof step.hint === "function") {
    return scenario ? step.hint(scenario, answers) : "";
  }
  return step.hint;
}

// Fire confetti celebration
function fireConfetti() {
  // Fire from left side
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { x: 0.1, y: 0.6 },
  });
  // Fire from right side
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { x: 0.9, y: 0.6 },
  });
}

// Format number with commas for display
function formatNumberWithCommas(value: string): string {
  // Remove all non-numeric characters except decimal point
  const cleaned = value.replace(/[^\d.]/g, "");

  // Split by decimal point
  const parts = cleaned.split(".");

  // Format the integer part with commas
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  // Rejoin with decimal if present
  return parts.length > 1 ? `${parts[0]}.${parts[1]}` : parts[0];
}

// Parse formatted number back to raw value
function parseFormattedNumber(value: string): number {
  return parseFloat(value.replace(/,/g, ""));
}

// Collapsible card component for mobile
function CollapsibleCard({
  title,
  icon,
  iconColor,
  children,
  defaultExpanded = false,
}: {
  title: string;
  icon: React.ReactNode;
  iconColor: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const shouldShowContent = !isMobile || isExpanded;

  return (
    <Card>
      <CardHeader
        className={`pb-3 ${isMobile ? "cursor-pointer" : ""}`}
        onClick={() => isMobile && setIsExpanded(!isExpanded)}
      >
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className={iconColor}>{icon}</span>
            {title}
          </span>
          {/* Only show chevron on mobile */}
          {isMobile && (
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </motion.div>
          )}
        </CardTitle>
      </CardHeader>
      <AnimatePresence initial={false}>
        {shouldShowContent && (
          <motion.div
            initial={isMobile ? { height: 0, opacity: 0 } : false}
            animate={{ height: "auto", opacity: 1 }}
            exit={isMobile ? { height: 0, opacity: 0 } : undefined}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <CardContent className="pt-0">{children}</CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

// Simple calculator component
function MiniCalculator({ onResult }: { onResult: (value: string) => void }) {
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === "0" ? digit : display + digit);
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay("0.");
      setWaitingForOperand(false);
    } else if (!display.includes(".")) {
      setDisplay(display + ".");
    }
  };

  const clear = () => {
    setDisplay("0");
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const performOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      let result = currentValue;

      switch (operation) {
        case "+":
          result = currentValue + inputValue;
          break;
        case "-":
          result = currentValue - inputValue;
          break;
        case "×":
          result = currentValue * inputValue;
          break;
        case "÷":
          result = currentValue / inputValue;
          break;
      }

      setDisplay(String(result));
      setPreviousValue(result);
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const calculate = () => {
    if (!operation || previousValue === null) return;

    const inputValue = parseFloat(display);
    let result = previousValue;

    switch (operation) {
      case "+":
        result = previousValue + inputValue;
        break;
      case "-":
        result = previousValue - inputValue;
        break;
      case "×":
        result = previousValue * inputValue;
        break;
      case "÷":
        result = previousValue / inputValue;
        break;
    }

    setDisplay(String(Math.round(result * 100) / 100));
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(true);
  };

  const useResult = () => {
    onResult(display);
  };

  const CalcButton = ({ children, onClick, className = "" }: { children: React.ReactNode; onClick: () => void; className?: string }) => (
    <button
      type="button"
      onClick={onClick}
      className={`h-10 rounded-lg font-medium transition-colors flex items-center justify-center ${className}`}
    >
      {children}
    </button>
  );

  return (
    <div className="space-y-2">
      {/* Display */}
      <div className="bg-muted rounded-lg p-3 text-right">
        <div className="text-xs text-muted-foreground h-4">
          {previousValue !== null && `${previousValue.toLocaleString()} ${operation || ""}`}
        </div>
        <div className="text-2xl font-mono text-foreground truncate">
          {isNaN(parseFloat(display)) ? display : parseFloat(display).toLocaleString()}
        </div>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-4 gap-1.5">
        <CalcButton onClick={clear} className="bg-red-500/10 text-red-500 hover:bg-red-500/20">C</CalcButton>
        <CalcButton onClick={() => setDisplay(display.slice(0, -1) || "0")} className="bg-muted hover:bg-muted/80">
          <Delete className="h-4 w-4" />
        </CalcButton>
        <CalcButton onClick={() => performOperation("÷")} className="bg-amber/10 text-amber hover:bg-amber/20">
          <Divide className="h-4 w-4" />
        </CalcButton>
        <CalcButton onClick={() => performOperation("×")} className="bg-amber/10 text-amber hover:bg-amber/20">
          <X className="h-4 w-4" />
        </CalcButton>

        <CalcButton onClick={() => inputDigit("7")} className="bg-muted hover:bg-muted/80">7</CalcButton>
        <CalcButton onClick={() => inputDigit("8")} className="bg-muted hover:bg-muted/80">8</CalcButton>
        <CalcButton onClick={() => inputDigit("9")} className="bg-muted hover:bg-muted/80">9</CalcButton>
        <CalcButton onClick={() => performOperation("-")} className="bg-amber/10 text-amber hover:bg-amber/20">
          <Minus className="h-4 w-4" />
        </CalcButton>

        <CalcButton onClick={() => inputDigit("4")} className="bg-muted hover:bg-muted/80">4</CalcButton>
        <CalcButton onClick={() => inputDigit("5")} className="bg-muted hover:bg-muted/80">5</CalcButton>
        <CalcButton onClick={() => inputDigit("6")} className="bg-muted hover:bg-muted/80">6</CalcButton>
        <CalcButton onClick={() => performOperation("+")} className="bg-amber/10 text-amber hover:bg-amber/20">
          <Plus className="h-4 w-4" />
        </CalcButton>

        <CalcButton onClick={() => inputDigit("1")} className="bg-muted hover:bg-muted/80">1</CalcButton>
        <CalcButton onClick={() => inputDigit("2")} className="bg-muted hover:bg-muted/80">2</CalcButton>
        <CalcButton onClick={() => inputDigit("3")} className="bg-muted hover:bg-muted/80">3</CalcButton>
        <CalcButton onClick={calculate} className="bg-emerald/10 text-emerald hover:bg-emerald/20 row-span-2">
          <Equal className="h-4 w-4" />
        </CalcButton>

        <CalcButton onClick={() => inputDigit("0")} className="bg-muted hover:bg-muted/80 col-span-2">0</CalcButton>
        <CalcButton onClick={inputDecimal} className="bg-muted hover:bg-muted/80">.</CalcButton>
      </div>

      {/* Use Result Button */}
      <Button
        onClick={useResult}
        variant="outline"
        size="sm"
        className="w-full border-emerald text-emerald hover:bg-emerald/10"
      >
        <ArrowRight className="h-4 w-4 mr-2" />
        Use This Answer
      </Button>
    </div>
  );
}

const STORAGE_KEY = "sparkpass-load-calculator";

export default function LoadCalculatorPage() {
  const { status } = useSession();
  const router = useRouter();

  const [state, setState] = useState<CalculatorState>({
    difficulty: null,
    selectedScenario: null,
    currentStepIndex: 0,
    answers: {},
    userInput: "",
    showHint: false,
    lastAnswerCorrect: null,
    sparkyMessage: SPARKY_MESSAGES.welcome,
    isComplete: false,
    manualScratchedOff: new Set(),
  });

  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [savedProgress, setSavedProgress] = useState<SavedProgress | null>(null);

  const hasPlayedConfetti = useRef(false);

  // Fire confetti when calculation is complete
  useEffect(() => {
    if (state.isComplete && !hasPlayedConfetti.current) {
      hasPlayedConfetti.current = true;
      fireConfetti();
    }
    // Reset flag when starting over
    if (!state.isComplete) {
      hasPlayedConfetti.current = false;
    }
  }, [state.isComplete]);

  // Check for saved progress from localStorage
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as SavedProgress;
        // Validate saved data
        if (parsed.scenarioId && parsed.difficulty) {
          const scenario = HOUSE_SCENARIOS.find(s => s.id === parsed.scenarioId);
          if (scenario) {
            // Store saved progress and show the resume prompt
            setSavedProgress(parsed);
            setShowResumePrompt(true);
          }
        }
      } catch {
        // Invalid saved state, ignore
      }
    }
  }, [status, router]);

  // Handle continuing saved progress
  const handleContinueProgress = useCallback(() => {
    if (!savedProgress) return;

    const scenario = HOUSE_SCENARIOS.find(s => s.id === savedProgress.scenarioId);
    if (scenario) {
      setState(prev => ({
        ...prev,
        difficulty: savedProgress.difficulty,
        selectedScenario: scenario,
        currentStepIndex: savedProgress.currentStepIndex || 0,
        answers: savedProgress.answers || {},
        isComplete: savedProgress.isComplete || false,
        sparkyMessage: savedProgress.isComplete
          ? SPARKY_MESSAGES.complete
          : CALCULATION_STEPS[savedProgress.currentStepIndex || 0]?.sparkyPrompt || prev.sparkyMessage,
      }));
    }
    setShowResumePrompt(false);
    setSavedProgress(null);
  }, [savedProgress]);

  // Handle starting fresh
  const handleStartFresh = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setShowResumePrompt(false);
    setSavedProgress(null);
  }, []);

  // Save progress to localStorage
  const saveProgress = useCallback((currentState: CalculatorState) => {
    if (currentState.selectedScenario && currentState.difficulty) {
      const toSave = {
        difficulty: currentState.difficulty,
        scenarioId: currentState.selectedScenario.id,
        currentStepIndex: currentState.currentStepIndex,
        answers: currentState.answers,
        isComplete: currentState.isComplete,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    }
  }, []);

  // Handle scenario selection
  // Handle difficulty selection
  const handleSelectDifficulty = useCallback((difficulty: DifficultyLevel) => {
    setState(prev => ({
      ...prev,
      difficulty,
      sparkyMessage: SPARKY_MESSAGES.selectScenario,
    }));
  }, []);

  const handleSelectScenario = useCallback((scenario: HouseScenario) => {
    const newState: CalculatorState = {
      difficulty: state.difficulty,
      selectedScenario: scenario,
      currentStepIndex: 0,
      answers: {},
      userInput: "",
      showHint: false,
      lastAnswerCorrect: null,
      sparkyMessage: CALCULATION_STEPS[0].sparkyPrompt,
      isComplete: false,
      manualScratchedOff: new Set(),
    };
    setState(newState);
    saveProgress(newState);
  }, [saveProgress, state.difficulty]);

  // Toggle manual scratch-off for intermediate mode
  const handleToggleScratchOff = useCallback((applianceId: string) => {
    setState(prev => {
      const newSet = new Set(prev.manualScratchedOff);
      if (newSet.has(applianceId)) {
        newSet.delete(applianceId);
      } else {
        newSet.add(applianceId);
      }
      return { ...prev, manualScratchedOff: newSet };
    });
  }, []);

  // Handle answer submission
  const handleSubmitAnswer = useCallback(() => {
    if (!state.selectedScenario || state.isComplete) return;

    const currentStep = CALCULATION_STEPS[state.currentStepIndex];
    const userAnswer = parseFormattedNumber(state.userInput);

    if (isNaN(userAnswer)) {
      setState(prev => ({
        ...prev,
        sparkyMessage: "Please enter a valid number!",
      }));
      return;
    }

    const expectedAnswer = currentStep.expectedAnswer?.(state.selectedScenario, state.answers) ?? 0;
    const isCorrect = currentStep.validateAnswer?.(userAnswer, expectedAnswer) ?? false;

    const newAnswers = { ...state.answers, [currentStep.id]: userAnswer };
    const isLastStep = state.currentStepIndex === CALCULATION_STEPS.length - 1;

    if (isCorrect) {
      if (isLastStep) {
        const completeState: CalculatorState = {
          ...state,
          answers: newAnswers,
          lastAnswerCorrect: true,
          sparkyMessage: SPARKY_MESSAGES.complete,
          isComplete: true,
          userInput: "",
          showHint: false,
        };
        setState(completeState);
        saveProgress(completeState);
      } else {
        const nextStep = CALCULATION_STEPS[state.currentStepIndex + 1];
        const newState: CalculatorState = {
          ...state,
          currentStepIndex: state.currentStepIndex + 1,
          answers: newAnswers,
          userInput: "",
          showHint: false,
          lastAnswerCorrect: true,
          sparkyMessage: `${getRandomMessage(SPARKY_MESSAGES.correct)} ${nextStep.sparkyPrompt}`,
        };
        setState(newState);
        saveProgress(newState);
      }
    } else {
      setState(prev => ({
        ...prev,
        lastAnswerCorrect: false,
        sparkyMessage: `${getRandomMessage(SPARKY_MESSAGES.incorrect)} The correct answer is ${expectedAnswer.toLocaleString()}. Check the hint for details!`,
        showHint: true,
      }));
    }
  }, [state, saveProgress]);

  // Handle trying again after incorrect answer
  const handleTryAgain = useCallback(() => {
    setState(prev => ({
      ...prev,
      userInput: "",
      lastAnswerCorrect: null,
      sparkyMessage: CALCULATION_STEPS[prev.currentStepIndex].sparkyPrompt,
    }));
  }, []);

  // Handle going to previous step
  const handlePreviousStep = useCallback(() => {
    if (state.currentStepIndex > 0) {
      const prevStep = CALCULATION_STEPS[state.currentStepIndex - 1];
      const newState: CalculatorState = {
        ...state,
        currentStepIndex: state.currentStepIndex - 1,
        userInput: state.answers[prevStep.id] ? state.answers[prevStep.id].toLocaleString() : "",
        showHint: false,
        lastAnswerCorrect: null,
        sparkyMessage: prevStep.sparkyPrompt,
      };
      setState(newState);
    }
  }, [state]);

  // Reset calculator
  const handleReset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState({
      difficulty: null,
      selectedScenario: null,
      currentStepIndex: 0,
      answers: {},
      userInput: "",
      showHint: false,
      lastAnswerCorrect: null,
      sparkyMessage: SPARKY_MESSAGES.welcome,
      isComplete: false,
      manualScratchedOff: new Set(),
    });
  }, []);

  if (status === "loading") {
    return (
      <main className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-amber" />
      </main>
    );
  }

  // Show resume prompt if there's saved progress
  if (showResumePrompt && savedProgress) {
    const savedScenario = HOUSE_SCENARIOS.find(s => s.id === savedProgress.scenarioId);
    const progressPercent = Math.round(
      ((savedProgress.currentStepIndex + (savedProgress.isComplete ? 1 : 0)) / CALCULATION_STEPS.length) * 100
    );

    return (
      <main className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <Card>
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-amber/10 flex items-center justify-center mx-auto mb-4">
                <Save className="h-8 w-8 text-amber" />
              </div>
              <CardTitle className="text-xl">Welcome Back!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">
                  You have saved progress from a previous session.
                </p>

                {savedScenario && (
                  <div className="bg-muted rounded-lg p-4 text-left space-y-2">
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-amber" />
                      <span className="font-medium">{savedScenario.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Zap className="h-3.5 w-3.5" />
                      <span>
                        {savedProgress.difficulty === "beginner" ? "Beginner" : "Intermediate"} Mode
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calculator className="h-3.5 w-3.5" />
                      <span>
                        {savedProgress.isComplete
                          ? "Completed"
                          : `Step ${savedProgress.currentStepIndex + 1} of ${CALCULATION_STEPS.length}`}
                      </span>
                    </div>
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
                )}
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
                  className="w-full"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Start a New Calculation
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    );
  }

  const currentStep = state.selectedScenario ? CALCULATION_STEPS[state.currentStepIndex] : null;
  const progress = state.selectedScenario
    ? ((state.currentStepIndex + (state.isComplete ? 1 : 0)) / CALCULATION_STEPS.length) * 100
    : 0;

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <button
              type="button"
              onClick={handleReset}
              className="text-left"
            >
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2 cursor-pointer hover:opacity-80 transition-opacity">
                <span className="text-amber">Load Calculator</span>
              </h1>
            </button>
            <p className="text-muted-foreground">
              Learn residential service load calculations step by step with Sparky!
            </p>
          </div>
          {state.selectedScenario && (
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Start Over
            </Button>
          )}
        </div>
      </motion.div>

      {/* Progress Bar */}
      {state.selectedScenario && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>
              Step {state.currentStepIndex + 1} of {CALCULATION_STEPS.length}
            </span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-amber rounded-full"
            />
          </div>
        </motion.div>
      )}

      {/* Main Content - 3 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Equipment + Quick Reference */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-3 space-y-4 order-2 lg:order-1"
        >
          {/* Equipment List */}
          {state.selectedScenario && (
            <CollapsibleCard
              title={`${state.selectedScenario.name} Equipment`}
              icon={<Home className="h-4 w-4" />}
              iconColor="text-amber"
              defaultExpanded={true}
            >
              <div className="space-y-2 text-sm">
                {state.difficulty === "intermediate" && (
                  <p className="text-xs text-muted-foreground italic pb-1 border-b mb-2">
                    Click items to mark as accounted for
                  </p>
                )}
                {(() => {
                  const isBeginner = state.difficulty === "beginner";
                  const isIntermediate = state.difficulty === "intermediate";
                  const accountedIds = getAccountedApplianceIds(state.currentStepIndex - 1);
                  const isAccountedFor = isBeginner && accountedIds.has("square-footage");
                  const isManuallyScratchedOff = isIntermediate && state.manualScratchedOff.has("square-footage");
                  const currentStepId = CALCULATION_STEPS[state.currentStepIndex]?.id;
                  const currentStepAppliances = currentStepId ? STEP_APPLIANCE_MAP[currentStepId] || [] : [];
                  const isHighlighted = isBeginner && !isAccountedFor && currentStepAppliances.includes("square-footage");

                  return (
                    <div
                      onClick={isIntermediate ? () => handleToggleScratchOff("square-footage") : undefined}
                      className={`flex justify-between items-center transition-all duration-300 rounded-md px-2 py-1 -mx-2 ${
                        isIntermediate ? "cursor-pointer hover:bg-muted/50" : ""
                      } ${
                        isHighlighted
                          ? "bg-amber/20 border border-amber/40"
                          : isAccountedFor || isManuallyScratchedOff
                          ? "text-muted-foreground/50"
                          : "text-muted-foreground"
                      }`}
                    >
                      <span className={`truncate mr-2 flex items-center gap-2 ${
                        isAccountedFor || isManuallyScratchedOff ? "line-through" : ""
                      } ${isHighlighted ? "text-amber font-medium" : ""}`}>
                        {(isAccountedFor || isManuallyScratchedOff) && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald flex-shrink-0" />
                        )}
                        {isHighlighted && (
                          <Plus className="h-3 w-3 text-amber flex-shrink-0" />
                        )}
                        Square Footage
                      </span>
                      <span className={`font-mono whitespace-nowrap ${
                        isHighlighted
                          ? "text-amber font-semibold"
                          : isAccountedFor || isManuallyScratchedOff
                          ? "text-muted-foreground/50 line-through"
                          : "text-foreground"
                      }`}>
                        {state.selectedScenario!.squareFootage.toLocaleString()} sq ft
                      </span>
                    </div>
                  );
                })()}
                {state.selectedScenario.appliances.map((appliance) => {
                  const isBeginner = state.difficulty === "beginner";
                  const isIntermediate = state.difficulty === "intermediate";
                  const accountedIds = getAccountedApplianceIds(state.currentStepIndex - 1);
                  const isAccountedFor = isBeginner && accountedIds.has(appliance.id);
                  const isManuallyScratchedOff = isIntermediate && state.manualScratchedOff.has(appliance.id);
                  const currentStepId = CALCULATION_STEPS[state.currentStepIndex]?.id;

                  // Check if this is a motor and if it's been converted
                  const isMotor = appliance.isMotor && appliance.horsepower;
                  const motorConversionStepId = Object.entries(MOTOR_CONVERSION_STEPS).find(
                    ([, appId]) => appId === appliance.id
                  )?.[0];
                  const convertedWatts = motorConversionStepId ? state.answers[motorConversionStepId] : undefined;
                  const hasBeenConverted = convertedWatts !== undefined && convertedWatts > 0;

                  // Highlight appliances relevant to the current step (beginner only)
                  const currentStepAppliances = currentStepId ? STEP_APPLIANCE_MAP[currentStepId] || [] : [];
                  // Also highlight motors during their conversion step
                  const isMotorConversionStep = motorConversionStepId === currentStepId;
                  const isHighlighted = isBeginner && !isAccountedFor && (currentStepAppliances.includes(appliance.id) || isMotorConversionStep);

                  return (
                    <div
                      key={appliance.id}
                      onClick={isIntermediate ? () => handleToggleScratchOff(appliance.id) : undefined}
                      className={`flex justify-between items-center transition-all duration-300 rounded-md px-2 py-1 -mx-2 ${
                        isIntermediate ? "cursor-pointer hover:bg-muted/50" : ""
                      } ${
                        isHighlighted
                          ? "bg-amber/20 border border-amber/40"
                          : isAccountedFor || isManuallyScratchedOff
                          ? "text-muted-foreground/50"
                          : "text-muted-foreground"
                      }`}
                    >
                      <span className={`truncate mr-2 flex items-center gap-2 ${
                        isAccountedFor || isManuallyScratchedOff ? "line-through" : ""
                      } ${isHighlighted ? "text-amber font-medium" : ""}`}>
                        {(isAccountedFor || isManuallyScratchedOff) && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald flex-shrink-0" />
                        )}
                        {isHighlighted && (
                          <Plus className="h-3 w-3 text-amber flex-shrink-0" />
                        )}
                        {appliance.name}
                      </span>
                      <span className={`font-mono whitespace-nowrap flex items-center gap-1 ${
                        isHighlighted
                          ? "text-amber font-semibold"
                          : isAccountedFor || isManuallyScratchedOff
                          ? "text-muted-foreground/50 line-through"
                          : "text-foreground"
                      }`}>
                        {isMotor ? (
                          hasBeenConverted ? (
                            <span className="text-emerald font-semibold">= {convertedWatts.toLocaleString()}W</span>
                          ) : (
                            <span>{appliance.horsepower} HP</span>
                          )
                        ) : (
                          <span>{appliance.watts.toLocaleString()}W</span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CollapsibleCard>
          )}

          {/* Quick Reference - only show after scenario is selected */}
          {state.selectedScenario && (
          <CollapsibleCard
            title="Quick Reference"
            icon={<BookOpen className="h-4 w-4" />}
            iconColor="text-purple"
            defaultExpanded={false}
          >
            <div className="space-y-3 text-sm">
              {QUICK_REFERENCE_ITEMS.map((item) => {
                const isBeginner = state.difficulty === "beginner";
                const isCovered = isBeginner && state.selectedScenario && isQuickRefCovered(item.id, state.currentStepIndex);

                return (
                  <div
                    key={item.id}
                    className={`transition-all duration-300 ${
                      isCovered ? "opacity-50" : ""
                    }`}
                  >
                    <p className={`font-medium flex items-center gap-2 ${
                      isCovered ? "text-muted-foreground line-through" : "text-foreground"
                    }`}>
                      {isCovered && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald flex-shrink-0" />
                      )}
                      {item.label}
                    </p>
                    <p className={`${
                      isCovered ? "text-muted-foreground/50 line-through" : "text-muted-foreground"
                    }`}>
                      {item.value}
                    </p>
                  </div>
                );
              })}
            </div>
          </CollapsibleCard>
          )}
        </motion.div>

        {/* MIDDLE COLUMN: Questions / Sparky Q&A */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="lg:col-span-6 order-1 lg:order-2"
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-amber" />
                {state.isComplete ? "Calculation Complete!" : state.selectedScenario ? currentStep?.title : "Select a Scenario"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Sparky Message */}
              <div className="mb-6">
                <SparkyMessage
                  size="medium"
                  message={state.sparkyMessage}
                />
              </div>

              {/* Scenario Selection */}
              {/* Difficulty Selection */}
              {!state.difficulty && !state.selectedScenario && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <p className="text-sm text-muted-foreground mb-4">
                    Choose your difficulty level to get started.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {DIFFICULTY_LEVELS.map((level) => (
                      <Card
                        key={level.id}
                        className={`cursor-pointer hover:shadow-md transition-all ${
                          level.id === "beginner"
                            ? "hover:border-emerald/50"
                            : "hover:border-amber/50"
                        }`}
                        onClick={() => handleSelectDifficulty(level.id)}
                      >
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              level.id === "beginner" ? "bg-emerald/10" : "bg-amber/10"
                            }`}>
                              <Zap className={`h-5 w-5 ${
                                level.id === "beginner" ? "text-emerald" : "text-amber"
                              }`} />
                            </div>
                            <div>
                              <h3 className="font-semibold">{level.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {level.description}
                              </p>
                            </div>
                          </div>
                          <ul className="text-xs text-muted-foreground space-y-1 mt-3">
                            {level.features.map((feature, i) => (
                              <li key={i} className="flex items-center gap-2">
                                <CheckCircle2 className={`h-3 w-3 ${
                                  level.id === "beginner" ? "text-emerald" : "text-amber"
                                }`} />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Scenario Selection */}
              {state.difficulty && !state.selectedScenario && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-muted-foreground">
                      {SPARKY_MESSAGES.selectScenario}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      state.difficulty === "beginner"
                        ? "bg-emerald/10 text-emerald"
                        : "bg-amber/10 text-amber"
                    }`}>
                      {state.difficulty === "beginner" ? "Beginner" : "Intermediate"}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {HOUSE_SCENARIOS.map((scenario) => (
                      <Card
                        key={scenario.id}
                        className="cursor-pointer hover:border-amber/50 hover:shadow-md transition-all"
                        onClick={() => handleSelectScenario(scenario)}
                      >
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-amber/10 flex items-center justify-center">
                              <Home className="h-5 w-5 text-amber" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{scenario.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {scenario.squareFootage.toLocaleString()} sq ft
                              </p>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {scenario.description}
                          </p>
                          <p className="text-xs text-amber mt-2">
                            {scenario.appliances.length} appliances
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Active Calculation Step */}
              {state.selectedScenario && !state.isComplete && currentStep && (
                <motion.div
                  key={currentStep.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  {/* Formula Display */}
                  {currentStep.formula && (
                    <div className="bg-purple-soft rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="h-4 w-4 text-purple" />
                        <span className="text-sm font-medium text-purple">Formula</span>
                      </div>
                      <p className="text-foreground font-mono">{currentStep.formula}</p>
                    </div>
                  )}

                  {/* Answer Input */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Your Answer (VA or Amps)</label>
                    <div className="flex gap-3">
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="Enter your calculation..."
                        value={state.userInput}
                        onChange={(e) => {
                          const formatted = formatNumberWithCommas(e.target.value);
                          setState(prev => ({ ...prev, userInput: formatted }));
                        }}
                        onKeyDown={(e) => {
                          // Allow: backspace, delete, tab, escape, enter, decimal point
                          const allowedKeys = ["Backspace", "Delete", "Tab", "Escape", "Enter", ".", "ArrowLeft", "ArrowRight", "Home", "End"];
                          // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                          if (allowedKeys.includes(e.key) || (e.ctrlKey || e.metaKey)) {
                            if (e.key === "Enter" && state.lastAnswerCorrect !== false) {
                              handleSubmitAnswer();
                            }
                            return;
                          }
                          // Block non-numeric keys
                          if (!/^\d$/.test(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        disabled={state.lastAnswerCorrect === false}
                        className="text-lg"
                      />
                      {state.lastAnswerCorrect === false ? (
                        <Button onClick={handleTryAgain} className="bg-amber hover:bg-amber/90">
                          Try Again
                          <RotateCcw className="h-4 w-4 ml-2" />
                        </Button>
                      ) : (
                        <Button onClick={handleSubmitAnswer} className="bg-emerald hover:bg-emerald/90">
                          Submit
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Answer Feedback */}
                  <AnimatePresence>
                    {state.lastAnswerCorrect !== null && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`flex items-center gap-2 p-3 rounded-lg ${
                          state.lastAnswerCorrect
                            ? "bg-emerald/10 text-emerald"
                            : "bg-red-500/10 text-red-500"
                        }`}
                      >
                        {state.lastAnswerCorrect ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <XCircle className="h-5 w-5" />
                        )}
                        <span className="font-medium">
                          {state.lastAnswerCorrect ? "Correct!" : "Not quite - check the explanation above"}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Hint Toggle */}
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setState(prev => ({ ...prev, showHint: !prev.showHint }))}
                      className="border-amber text-amber hover:bg-amber/10"
                    >
                      <Lightbulb className="h-4 w-4 mr-2" />
                      {state.showHint ? "Hide Hint" : "Show Hint"}
                    </Button>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <HelpCircle className="h-3 w-3" />
                      {currentStep.necReference}
                    </span>
                  </div>

                  {/* Hint Display */}
                  <AnimatePresence>
                    {state.showHint && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-amber/10 border border-amber/30 rounded-lg p-4"
                      >
                        <div className="flex items-start gap-2">
                          <Lightbulb className="h-5 w-5 text-amber flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-amber mb-1">Hint</p>
                            <p className="text-sm text-foreground whitespace-pre-line">
                              {getHintText(currentStep, state.selectedScenario, state.answers)}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Navigation */}
                  <div className="flex justify-between pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={handlePreviousStep}
                      disabled={state.currentStepIndex === 0}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground self-center">
                      Step {state.currentStepIndex + 1} / {CALCULATION_STEPS.length}
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Completion Screen */}
              {state.isComplete && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-20 h-20 rounded-full bg-emerald/10 flex items-center justify-center mx-auto mb-4">
                    <Trophy className="h-10 w-10 text-emerald" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Calculation Complete!
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    You calculated a <span className="text-amber font-semibold">{state.answers["service-amps"]?.toLocaleString()}A</span> service
                    for this {state.selectedScenario?.squareFootage.toLocaleString()} sq ft home.
                  </p>
                  <div className="flex justify-center gap-4">
                    <Button variant="outline" onClick={handleReset}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Try Another
                    </Button>
                    <Button onClick={() => router.push("/quiz/load-calculations")} className="bg-emerald hover:bg-emerald/90">
                      Practice Quiz
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* RIGHT COLUMN: Your Calculations + Calculator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="lg:col-span-3 space-y-4 order-3"
        >
          {/* Running Calculation */}
          {state.selectedScenario && (
            <CollapsibleCard
              title="Your Calculations"
              icon={<Zap className="h-4 w-4" />}
              iconColor="text-emerald"
              defaultExpanded={true}
            >
              {Object.keys(state.answers).length > 0 ? (
                <div className="space-y-2 text-sm">
                  {CALCULATION_STEPS.map((step) => {
                    // Skip motor conversion steps - they show on the equipment card instead
                    if (step.id in MOTOR_CONVERSION_STEPS) return null;

                    const answer = state.answers[step.id];
                    if (answer === undefined) return null;

                    const isBeginner = state.difficulty === "beginner";
                    const currentStepId = CALCULATION_STEPS[state.currentStepIndex]?.id;
                    const isHighlighted = isBeginner && currentStepId === "total-va" && TOTAL_VA_COMPONENT_STEPS.includes(step.id);

                    return (
                      <div
                        key={step.id}
                        className={`flex justify-between items-center rounded-md px-2 py-1 -mx-2 transition-all ${
                          isHighlighted
                            ? "bg-amber/20 border border-amber/40"
                            : ""
                        }`}
                      >
                        <span className={`truncate mr-2 flex items-center gap-1 ${
                          isHighlighted ? "text-amber font-medium" : "text-muted-foreground"
                        }`}>
                          {isHighlighted && <Plus className="h-3 w-3 flex-shrink-0" />}
                          {step.title}
                        </span>
                        <span className={`font-mono whitespace-nowrap ${
                          isHighlighted ? "text-amber font-semibold" : "text-foreground"
                        }`}>
                          {step.id === "service-amps"
                            ? `${answer.toLocaleString()}A`
                            : `${answer.toLocaleString()} VA`}
                        </span>
                      </div>
                    );
                  })}

                  {state.isComplete && (
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between items-center font-semibold">
                        <span className="text-foreground">Service Size</span>
                        <span className="text-emerald text-lg">
                          {state.answers["service-amps"]?.toLocaleString()}A
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Your completed calculations will appear here
                </p>
              )}
            </CollapsibleCard>
          )}

          {/* Calculator */}
          {state.selectedScenario && !state.isComplete && (
            <CollapsibleCard
              title="Calculator"
              icon={<Calculator className="h-4 w-4" />}
              iconColor="text-amber"
              defaultExpanded={false}
            >
              <MiniCalculator
                key={state.currentStepIndex}
                onResult={(value) => setState(prev => ({ ...prev, userInput: formatNumberWithCommas(value) }))}
              />
            </CollapsibleCard>
          )}

          {/* Save Indicator */}
          {state.selectedScenario && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Save className="h-4 w-4" />
              Progress saved automatically
            </div>
          )}
        </motion.div>
      </div>
    </main>
  );
}
