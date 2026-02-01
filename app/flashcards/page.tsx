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
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SparkyMessage } from "@/components/sparky";
import { CATEGORIES } from "@/types/question";

interface Flashcard {
  id: string;
  front: string;
  back: string;
  category: string;
  necReference: string;
}

// Sample flashcards data - in production this would come from an API
const FLASHCARDS: Flashcard[] = [
  {
    id: "fc1",
    front: "What is the standard voltage drop limit for branch circuits?",
    back: "3% for branch circuits, 5% total for feeder and branch circuits combined (NEC 210.19(A) Informational Note No. 4)",
    category: "load-calculations",
    necReference: "NEC 210.19(A)",
  },
  {
    id: "fc2",
    front: "What size grounding electrode conductor is required for a 200A service?",
    back: "4 AWG copper or 2 AWG aluminum (Table 250.66)",
    category: "grounding-bonding",
    necReference: "NEC Table 250.66",
  },
  {
    id: "fc3",
    front: "What is the minimum height for service drop clearance over residential driveways?",
    back: "12 feet minimum clearance (NEC 230.24(B)(1))",
    category: "services",
    necReference: "NEC 230.24(B)(1)",
  },
  {
    id: "fc4",
    front: "What is the demand factor for the first 10 kW of electric range load?",
    back: "100% - The first 10 kW is calculated at full demand (Table 220.55)",
    category: "load-calculations",
    necReference: "NEC Table 220.55",
  },
  {
    id: "fc5",
    front: "What is the minimum size equipment grounding conductor for a 60A circuit?",
    back: "10 AWG copper or 8 AWG aluminum (Table 250.122)",
    category: "grounding-bonding",
    necReference: "NEC Table 250.122",
  },
  {
    id: "fc6",
    front: "What is the maximum number of service disconnects allowed?",
    back: "Up to 6 disconnects grouped in any single enclosure or group of separate enclosures (NEC 230.71(A))",
    category: "services",
    necReference: "NEC 230.71(A)",
  },
  {
    id: "fc7",
    front: "What is the general lighting load for a dwelling unit?",
    back: "3 VA per square foot (Table 220.12)",
    category: "load-calculations",
    necReference: "NEC Table 220.12",
  },
  {
    id: "fc8",
    front: "When is a ground rod required to be supplemented?",
    back: "When a single ground rod has a resistance to earth greater than 25 ohms (NEC 250.53(A)(2))",
    category: "grounding-bonding",
    necReference: "NEC 250.53(A)(2)",
  },
  {
    id: "fc9",
    front: "What is the minimum service entrance conductor size for a single-family dwelling?",
    back: "100 amperes, 3-wire (NEC 230.79(C))",
    category: "services",
    necReference: "NEC 230.79(C)",
  },
];

export default function FlashcardsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredCards, setMasteredCards] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const filtered =
      selectedCategory === "all"
        ? FLASHCARDS
        : FLASHCARDS.filter((card) => card.category === selectedCategory);
    setCards(filtered);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [selectedCategory]);

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

  const handleMarkMastered = () => {
    if (currentCard) {
      setMasteredCards((prev) => new Set(prev).add(currentCard.id));
      handleNext();
    }
  };

  const handleReset = () => {
    setMasteredCards(new Set());
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

      {/* Category Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex flex-wrap gap-2 mb-6"
      >
        <Button
          variant={selectedCategory === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory("all")}
          className={selectedCategory === "all" ? "bg-emerald hover:bg-emerald/90" : ""}
        >
          All Categories
        </Button>
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
        transition={{ duration: 0.5, delay: 0.15 }}
        className="mb-6"
      >
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>
            Card {currentIndex + 1} of {cards.length}
          </span>
          <span>{masteredCards.size} mastered</span>
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
                  className={`h-full flex flex-col justify-center items-center p-8 text-center ${
                    isFlipped ? "bg-emerald/5 border-emerald/30" : "bg-card"
                  } ${masteredCards.has(currentCard.id) ? "border-emerald" : ""}`}
                >
                  <CardContent className="flex flex-col items-center justify-center h-full">
                    {!isFlipped ? (
                      <>
                        <BookOpen className="h-8 w-8 text-emerald mb-4" />
                        <p className="text-lg md:text-xl font-medium text-foreground mb-4">
                          {currentCard.front}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Click to reveal answer
                        </p>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-8 w-8 text-emerald mb-4" />
                        <p className="text-lg md:text-xl text-foreground mb-4">
                          {currentCard.back}
                        </p>
                        <p className="text-sm text-emerald font-medium">
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
          variant="default"
          className="bg-emerald hover:bg-emerald/90"
          onClick={handleMarkMastered}
          disabled={!currentCard || masteredCards.has(currentCard?.id || "")}
        >
          <CheckCircle2 className="h-4 w-4 mr-1" />
          Mark Mastered
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
          Reset Progress
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
