#!/usr/bin/env node

import { AirtableMigrationRunner } from "../runner";

async function main() {
  const runner = new AirtableMigrationRunner();

  try {
    const appliedMigrations = await runner.getAppliedMigrations();
    const pendingMigrations = await runner.getPendingMigrations();

    console.log("📊 Migration Status\n");

    console.log(`Applied migrations (${appliedMigrations.length}):`);
    if (appliedMigrations.length === 0) {
      console.log("  (none)");
    } else {
      appliedMigrations.forEach((m) => {
        console.log(`  ✅ ${m.id} (applied: ${m.appliedAt.toISOString()})`);
      });
    }

    console.log(`\nPending migrations (${pendingMigrations.length}):`);
    if (pendingMigrations.length === 0) {
      console.log("  (none)");
    } else {
      pendingMigrations.forEach((m) => {
        console.log(`  ⏳ ${m.id}: ${m.description}`);
      });
    }

    if (pendingMigrations.length > 0) {
      console.log(`\n💡 Run 'npm run migrate:up' to apply pending migrations`);
    }
  } catch (error: any) {
    console.error("❌ Failed to check migration status:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
