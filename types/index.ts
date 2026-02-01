// SparkPass Type Definitions

// Re-export database types for convenience
export {
  type User,
  type NewUser,
  type AuthProvider,
  authProviderValues,
  type UserProgress,
  type NewUserProgress,
  type StudySession,
  type NewStudySession,
  type Bookmark,
  type NewBookmark,
  type SessionType,
  sessionTypeValues,
} from "@/lib/db/schema";

// Re-export question types
export {
  type Question,
  type Category,
  type CategorySlug,
  type Difficulty,
  CATEGORIES,
  getCategoryBySlug,
} from "./question";
