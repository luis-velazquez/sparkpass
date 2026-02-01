// Database connection for SparkPass
// Uses better-sqlite3 for local development
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import path from "path";

// Create SQLite database connection
const dbPath = path.join(process.cwd(), "sparkpass.db");
const sqlite = new Database(dbPath);

// Create Drizzle ORM instance
export const db = drizzle(sqlite, { schema });

// Export schema for convenience
export * from "./schema";
