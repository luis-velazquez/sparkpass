// Saved items storage utility for flashcards and quiz questions

const SAVED_FLASHCARDS_KEY = "sparkypass-saved-flashcards";
const SAVED_QUESTIONS_KEY = "sparkypass-saved-questions";

export interface SavedFlashcard {
  id: string;
  front: string;
  back: string;
  necReference: string;
  savedAt: string;
}

export interface SavedQuestion {
  id: string;
  question: string;
  category: string;
  savedAt: string;
}

// Flashcards
export function getSavedFlashcards(): SavedFlashcard[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(SAVED_FLASHCARDS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function getSavedFlashcardIds(): Set<string> {
  const flashcards = getSavedFlashcards();
  return new Set(flashcards.map((f) => f.id));
}

export function saveFlashcard(flashcard: Omit<SavedFlashcard, "savedAt">): void {
  if (typeof window === "undefined") return;
  const saved = getSavedFlashcards();
  const exists = saved.find((f) => f.id === flashcard.id);
  if (!exists) {
    saved.push({ ...flashcard, savedAt: new Date().toISOString() });
    localStorage.setItem(SAVED_FLASHCARDS_KEY, JSON.stringify(saved));
  }
}

export function unsaveFlashcard(id: string): void {
  if (typeof window === "undefined") return;
  const saved = getSavedFlashcards().filter((f) => f.id !== id);
  localStorage.setItem(SAVED_FLASHCARDS_KEY, JSON.stringify(saved));
}

export function toggleSavedFlashcard(flashcard: Omit<SavedFlashcard, "savedAt">): boolean {
  const ids = getSavedFlashcardIds();
  if (ids.has(flashcard.id)) {
    unsaveFlashcard(flashcard.id);
    return false;
  } else {
    saveFlashcard(flashcard);
    return true;
  }
}

// Questions
export function getSavedQuestions(): SavedQuestion[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(SAVED_QUESTIONS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function getSavedQuestionIds(): Set<string> {
  const questions = getSavedQuestions();
  return new Set(questions.map((q) => q.id));
}

export function saveQuestion(question: Omit<SavedQuestion, "savedAt">): void {
  if (typeof window === "undefined") return;
  const saved = getSavedQuestions();
  const exists = saved.find((q) => q.id === question.id);
  if (!exists) {
    saved.push({ ...question, savedAt: new Date().toISOString() });
    localStorage.setItem(SAVED_QUESTIONS_KEY, JSON.stringify(saved));
  }
}

export function unsaveQuestion(id: string): void {
  if (typeof window === "undefined") return;
  const saved = getSavedQuestions().filter((q) => q.id !== id);
  localStorage.setItem(SAVED_QUESTIONS_KEY, JSON.stringify(saved));
}

export function toggleSavedQuestion(question: Omit<SavedQuestion, "savedAt">): boolean {
  const ids = getSavedQuestionIds();
  if (ids.has(question.id)) {
    unsaveQuestion(question.id);
    return false;
  } else {
    saveQuestion(question);
    return true;
  }
}
