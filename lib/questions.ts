import questionsData from "@/data/questions.json";
import type { Question, CategorySlug, Difficulty } from "@/types/question";

// Type assertion for imported JSON data
const questions = questionsData.questions as Question[];

/**
 * Get all questions
 */
export function getAllQuestions(): Question[] {
  return questions;
}

/**
 * Get questions by category
 */
export function getQuestionsByCategory(category: CategorySlug): Question[] {
  return questions.filter((q) => q.category === category);
}

/**
 * Get questions by difficulty
 */
export function getQuestionsByDifficulty(difficulty: Difficulty): Question[] {
  return questions.filter((q) => q.difficulty === difficulty);
}

/**
 * Get questions by category and difficulty
 */
export function getQuestionsByCategoryAndDifficulty(
  category: CategorySlug,
  difficulty: Difficulty
): Question[] {
  return questions.filter((q) => q.category === category && q.difficulty === difficulty);
}

/**
 * Get a random selection of questions from a category
 */
export function getRandomQuestions(category: CategorySlug, count: number = 15): Question[] {
  const categoryQuestions = getQuestionsByCategory(category);
  const shuffled = [...categoryQuestions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Get a single question by ID
 */
export function getQuestionById(id: string): Question | undefined {
  return questions.find((q) => q.id === id);
}

/**
 * Get question count by category
 */
export function getQuestionCountByCategory(category: CategorySlug): number {
  return getQuestionsByCategory(category).length;
}

/**
 * Get question counts for all categories
 */
export function getCategoryCounts(): Record<CategorySlug, number> {
  return {
    "load-calculations": getQuestionCountByCategory("load-calculations"),
    "grounding-bonding": getQuestionCountByCategory("grounding-bonding"),
    services: getQuestionCountByCategory("services"),
    "textbook-navigation": getQuestionCountByCategory("textbook-navigation"),
  };
}

/**
 * Get total question count
 */
export function getTotalQuestionCount(): number {
  return questions.length;
}
