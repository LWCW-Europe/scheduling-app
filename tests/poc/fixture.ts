import { test as base } from "@playwright/test";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as fs from "fs";
import * as schema from "../../db/schema";

export type DB = ReturnType<typeof drizzle<typeof schema>>;

export const test = base.extend<{ db: DB }>({
  // eslint-disable-next-line no-empty-pattern
  db: async ({}, use, testInfo) => {
    const dbPath = `./data.test.poc.${testInfo.parallelIndex}.db`;
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
    const sqlite = new Database(dbPath);
    const db = drizzle(sqlite, { schema });
    migrate(db, { migrationsFolder: "./drizzle" });
    await use(db);
    sqlite.close();
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
  },
});

export { expect } from "@playwright/test";
