// Question Types for SparkPass Quiz System

export type Difficulty = "easy" | "medium" | "hard";

export type CategorySlug = "load-calculations" | "grounding-bonding" | "services" | "textbook-navigation" | "chapter-9-tables";

export interface Category {
  slug: CategorySlug;
  name: string;
  necArticle: string;
  description: string;
}

export interface Question {
  id: string;
  category: CategorySlug;
  necArticle: string;
  difficulty: Difficulty;
  questionText: string;
  options: string[];
  correctAnswer: number; // Index of correct option (0-3)
  explanation: string;
  necReference: string;
  sparkyTip: string;
}

// Category definitions
export const CATEGORIES: Category[] = [
  {
    slug: "load-calculations",
    name: "Load Calculations",
    necArticle: "Article 220",
    description: "Branch circuit and feeder calculations, demand factors, and service sizing",
  },
  {
    slug: "grounding-bonding",
    name: "Grounding & Bonding",
    necArticle: "Article 250",
    description: "Equipment grounding, bonding requirements, and grounding electrode systems",
  },
  {
    slug: "services",
    name: "Services",
    necArticle: "Article 230",
    description: "Service entrance equipment, conductors, and disconnecting means",
  },
  {
    slug: "textbook-navigation",
    name: "Textbook Navigation",
    necArticle: "Article 90",
    description: "How to navigate the NEC code book, chapter organization, and finding rules",
  },
  {
    slug: "chapter-9-tables",
    name: "Chapter 9 Tables",
    necArticle: "Chapter 9",
    description: "Conduit fill calculations, conductor properties, and raceway dimensions",
  },
];

// Helper to get category by slug
export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
