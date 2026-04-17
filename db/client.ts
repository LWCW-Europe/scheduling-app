import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!_db) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    const filePath = url.replace(/^file:/, "");
    const sqlite = new Database(filePath);
    _db = drizzle(sqlite, { schema });
  }
  return _db;
}
