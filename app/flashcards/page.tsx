"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Shuffle,
  CheckCircle2,
  Bookmark,
  Loader2,
  Star,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SparkyMessage } from "@/components/sparky";
import { CATEGORIES } from "@/types/question";
import {
  FLASHCARD_SETS,
  FLASHCARDS,
  type Flashcard,
  type FlashcardSet,
} from "@/app/flashcards/flashcards";

export default function FlashcardsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [savedCards, setSavedCards] = useState<Set<string>>(new Set());
  const [selectedSetId, setSelectedSetId] = useState<string>(
    FLASHCARD_SETS[0]?.id ?? "all"
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const activeSet: FlashcardSet | undefined = FLASHCARD_SETS.find(
      (set) => set.id === selectedSetId
    );
    const sourceCards = activeSet ? activeSet.cards : FLASHCARDS;
    const filtered =
      selectedCategory === "all"
        ? sourceCards
        : sourceCards.filter((card) => card.category === selectedCategory);
    setCards(filtered);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [selectedCategory, selectedSetId]);

  if (status === "loading") {
    return (
      <main className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-amber" />
      </main>
    );
  }

  const currentCard = cards[currentIndex];
  const progress = cards.length > 0 ? ((currentIndex + 1) / cards.length) * 100 : 0;

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
    }
  };

  const handleShuffle = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleToggleSave = () => {
    if (currentCard) {
      setSavedCards((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(currentCard.id)) {
          newSet.delete(currentCard.id);
        } else {
          newSet.add(currentCard.id);
        }
        return newSet;
      });
    }
  };

  const handleReset = () => {
    setSavedCards(new Set());
    setCurrentIndex(0);
    setIsFlipped(false);
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
          <span className="text-emerald">Flashcards</span>
        </h1>
        <p className="text-muted-foreground">
          Master key NEC concepts with our flashcard system. Flip to reveal answers!
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex flex-wrap gap-2 mb-6"
      >
        {FLASHCARD_SETS.map((set) => (
          <Button
            key={set.id}
            variant={selectedSetId === set.id ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setSelectedSetId(set.id);
              setSelectedCategory("all");
            }}
            className={selectedSetId === set.id ? "bg-emerald hover:bg-emerald/90" : ""}
          >
            {set.name}
          </Button>
        ))}
        <span className="border-l border-border mx-1" />
        {CATEGORIES.map((cat) => (
          <Button
            key={cat.slug}
            variant={selectedCategory === cat.slug ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(cat.slug)}
            className={selectedCategory === cat.slug ? "bg-emerald hover:bg-emerald/90" : ""}
          >
            {cat.name}
          </Button>
        ))}
      </motion.div>

      {/* Progress Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mb-6"
      >
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>
            Card {currentIndex + 1} of {cards.length}
          </span>
          <span className="flex items-center gap-1">
            <Bookmark className="h-3.5 w-3.5 text-amber" />
            {savedCards.size} saved
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-emerald rounded-full"
          />
        </div>
      </motion.div>

      {/* Flashcard */}
      {cards.length > 0 && currentCard ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-6"
        >
          <div
            className="relative h-[300px] md:h-[350px] cursor-pointer perspective-1000"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={isFlipped ? "back" : "front"}
                initial={{ rotateY: isFlipped ? -90 : 90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{ rotateY: isFlipped ? 90 : -90, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0"
              >
                <Card
                  className={`h-full flex flex-col justify-center items-center p-8 text-center relative ${
                    savedCards.has(currentCard.id)
                      ? "border-2 border-amber bg-amber/5 shadow-lg shadow-amber/20"
                      : isFlipped
                      ? "bg-emerald/5 border-emerald/30"
                      : "bg-card"
                  }`}
                >
                  {/* Saved indicator badge */}
                  {savedCards.has(currentCard.id) && (
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber text-white text-xs font-medium">
                      <Star className="h-3 w-3 fill-white" />
                      Study Later
                    </div>
                  )}
                  <CardContent className="flex flex-col items-center justify-center h-full">
                    {!isFlipped ? (
                      <>
                        <BookOpen className={`h-8 w-8 mb-4 ${savedCards.has(currentCard.id) ? "text-amber" : "text-emerald"}`} />
                        <p className="text-lg md:text-xl font-medium text-foreground mb-4">
                          {currentCard.front}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Click to reveal answer
                        </p>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className={`h-8 w-8 mb-4 ${savedCards.has(currentCard.id) ? "text-amber" : "text-emerald"}`} />
                        <p className="text-lg md:text-xl text-foreground mb-4">
                          {currentCard.back}
                        </p>
                        <p className={`text-sm font-medium ${savedCards.has(currentCard.id) ? "text-amber" : "text-emerald"}`}>
                          {currentCard.necReference}
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      ) : (
        <Card className="h-[300px] flex items-center justify-center mb-6">
          <p className="text-muted-foreground">No flashcards available for this category.</p>
        </Card>
      )}

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="flex flex-wrap justify-center gap-3 mb-8"
      >
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        <Button
          variant="outline"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <RotateCcw className="h-4 w-4 mr-1" />
          Flip
        </Button>
        <Button
          variant={currentCard && savedCards.has(currentCard.id) ? "default" : "outline"}
          className={currentCard && savedCards.has(currentCard.id) ? "bg-amber hover:bg-amber/90 text-white" : "border-amber text-amber hover:bg-amber/10"}
          onClick={handleToggleSave}
          disabled={!currentCard}
        >
          <Bookmark className={`h-4 w-4 mr-1 ${currentCard && savedCards.has(currentCard.id) ? "fill-white" : ""}`} />
          {currentCard && savedCards.has(currentCard.id) ? "Saved" : "Save for Later"}
        </Button>
        <Button
          variant="outline"
          onClick={handleNext}
          disabled={currentIndex === cards.length - 1}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex justify-center gap-3 mb-8"
      >
        <Button variant="outline" onClick={handleShuffle}>
          <Shuffle className="h-4 w-4 mr-2" />
          Shuffle
        </Button>
        <Button variant="outline" onClick={handleReset}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Clear Saved
        </Button>
      </motion.div>

      {/* Sparky Tip */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35 }}
      >
        <SparkyMessage
          size="medium"
          message="Flashcards are great for memorizing NEC references and key values! Try to recall the answer before flipping. Spaced repetition is your friend - come back daily for best results!"
        />
      </motion.div>
    </main>
  );
}
