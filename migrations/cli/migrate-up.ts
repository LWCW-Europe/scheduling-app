#!/usr/bin/env node

import { AirtableMigrationRunner } from "../runner";

async function main() {
  const runner = new AirtableMigrationRunner();

  try {
    const pendingMigrations = await runner.getPendingMigrations();

    if (pendingMigrations.length === 0) {
      console.log("✅ No pending migrations");
      return;
    }

    console.log(`Found ${pendingMigrations.length} pending migration(s):`);
    pendingMigrations.forEach((m) => {
      console.log(`  - ${m.id}: ${m.description}`);
    });

    console.log("\nRunning migrations...");

    for (const migration of pendingMigrations) {
      await runner.runMigration(migration);
    }

    console.log("\n🎉 All migrations completed successfully!");
  } catch (error: any) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
