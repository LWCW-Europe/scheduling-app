import {
  getRepositories,
  resetRepositories,
  serializeDb,
  restoreDb,
} from "@/db/container";

let _snapshot: Buffer | null = null;

export function setupTestDb(): void {
  process.env.DATABASE_URL = "file::memory:";
  resetRepositories();
  getRepositories();
  _snapshot = serializeDb();
}

export function resetTestDb(): void {
  if (!_snapshot) throw new Error("Call setupTestDb() first");
  restoreDb(_snapshot);
}
