import { getBase } from "@/db/db";
import { Migration, MigrationState, MigrationRunner } from "./types";
import fs from "fs";
import path from "path";

export class AirtableMigrationRunner implements MigrationRunner {
  private readonly migrationsTable = "Migrations";

  private displayTableNotFoundError(): void {
    console.error("\n❌ Migrations table not found in Airtable");
    console.error("\n📝 To set up the migrations system, please:");
    console.error("   1. Go to your Airtable base");
    console.error("   2. Create a new table called 'Migrations'");
    console.error("   3. Add the following fields:");
    console.error("      - 'id' (Single line text) - Primary field");
    console.error("      - 'appliedAt' (Date & time)");
    console.error("   4. Save the table and try running migrations again\n");
  }

  private displayAuthorizationError(): void {
    console.error("\n❌ Airtable authorization error");
    console.error("\n🔐 To fix this issue, please check:");
    console.error("   1. Your Airtable API key is set correctly");
    console.error("   2. Your Airtable base ID is correct");
    console.error("   3. The API key has the required permissions:");
    console.error("      - data.records:read");
    console.error("      - data.records:write");
    console.error("      - schema.bases:read");
    console.error(
      "   4. The base is shared with the account that owns the API key"
    );
    console.error("   5. Check your environment variables (.env.local):\n");
    console.error("      AIRTABLE_API_KEY=your_api_key_here");
    console.error("      AIRTABLE_BASE_ID=your_base_id_here\n");
  }

  /*
   * Distinguishes between different error types:
   * - 'table-not-found': The Migrations table does not exist
   * - 'authorization': Authorization failed (invalid API key or permissions)
   * - 'other': Any other error
   *
   * Airtable's API returns "not authorized" for both table not found and auth
   * issues. This method tries to access known tables to determine if it's an
   * auth issue or a missing table.
   */
  private async distinguishError(
    error: any
  ): Promise<"table-not-found" | "authorization" | "other"> {
    if (!error.message?.includes("not authorized")) {
      return "other";
    }

    // Try to test authorization by accessing existing tables in your base
    try {
      // Try to access the Events table - this should exist in your base
      await getBase()("Events").select({ maxRecords: 1 }).firstPage();
      // If this succeeds, our credentials are valid, so the original error was likely table not found
      return "table-not-found";
    } catch (testError: any) {
      try {
        // If Events doesn't work, try Sessions table
        await getBase()("Sessions").select({ maxRecords: 1 }).firstPage();
        return "table-not-found";
      } catch (secondTestError: any) {
        try {
          // Try Locations table as a last resort
          await getBase()("Locations").select({ maxRecords: 1 }).firstPage();
          return "table-not-found";
        } catch (thirdTestError: any) {
          // If all real tables fail with "not authorized", it's an auth issue
          if (thirdTestError.message?.includes("not authorized")) {
            return "authorization";
          }
          // If they fail with different errors, it's likely table not found for the original
          return "table-not-found";
        }
      }
    }
  }

  async getAppliedMigrations(): Promise<MigrationState[]> {
    try {
      const records = await getBase()(this.migrationsTable).select().all();

      return records.map((record) => ({
        id: record.get("id") as string,
        appliedAt: new Date(record.get("appliedAt") as string),
      }));
    } catch (error: any) {
      const errorType = await this.distinguishError(error);

      if (errorType === "table-not-found") {
        this.displayTableNotFoundError();
        return [];
      }

      if (errorType === "authorization") {
        this.displayAuthorizationError();
        throw new Error(
          "Airtable authorization failed. Please check your API credentials and permissions."
        );
      }

      console.error("❌ Error fetching applied migrations:", error.message);
      throw error;
    }
  }

  async markMigrationApplied(id: string): Promise<void> {
    try {
      await getBase()(this.migrationsTable).create([
        {
          fields: {
            id,
            appliedAt: new Date().toISOString(),
          },
        },
      ]);
    } catch (error: any) {
      const errorType = await this.distinguishError(error);

      if (errorType === "table-not-found") {
        console.error(
          "\n❌ Cannot record migration - Migrations table not found"
        );
        this.displayTableNotFoundError();
        throw new Error(
          "Migrations table not found. Please create it in Airtable first."
        );
      }

      if (errorType === "authorization") {
        console.error(
          "\n❌ Airtable authorization error - Cannot record migration"
        );
        console.error(
          "\n🔐 Please check your Airtable credentials and permissions:"
        );
        console.error("   1. Verify your API key has write permissions");
        console.error("   2. Ensure the base is shared with your account");
        console.error("   3. Check environment variables are set correctly\n");
        throw new Error(
          "Airtable authorization failed. Cannot record migration as applied."
        );
      }

      console.error("❌ Error marking migration as applied:", error.message);
      throw error;
    }
  }

  async markMigrationRolledBack(id: string): Promise<void> {
    try {
      const records = await getBase()(this.migrationsTable)
        .select({
          filterByFormula: `{id} = "${id}"`,
        })
        .all();

      if (records.length > 0) {
        await getBase()(this.migrationsTable).destroy([records[0].id]);
      }
    } catch (error: any) {
      const errorType = await this.distinguishError(error);

      if (errorType === "table-not-found") {
        console.error(
          "\n❌ Cannot rollback migration record - Migrations table not found"
        );
        console.error(
          "💡 The migration rollback was executed, but couldn't be recorded."
        );
        this.displayTableNotFoundError();
        return; // Don't throw error for rollback recording failure
      }

      if (errorType === "authorization") {
        console.error(
          "\n❌ Airtable authorization error - Cannot access migration records"
        );
        console.error(
          "💡 The migration rollback was executed, but couldn't be recorded."
        );
        console.error(
          "\n🔐 To fix future rollback tracking, check your Airtable permissions\n"
        );
        return; // Don't throw error for rollback recording failure
      }

      console.error(
        "❌ Error marking migration as rolled back:",
        error.message
      );
      throw error;
    }
  }

  async getPendingMigrations(): Promise<Migration[]> {
    const appliedMigrations = await this.getAppliedMigrations();
    console.log(`Found ${appliedMigrations.length} applied migrations`);
    const appliedIds = new Set(appliedMigrations.map((m) => m.id));

    // Import all migration files
    const migrationsDir = path.join(__dirname, "versions");
    const migrations: Migration[] = [];

    if (fs.existsSync(migrationsDir)) {
      const files = fs
        .readdirSync(migrationsDir)
        .filter((file) => file.endsWith(".ts"));

      for (const file of files) {
        const migrationModule = await import(path.join(migrationsDir, file));
        const migration = migrationModule.default;
        if (!appliedIds.has(migration.id)) {
          migrations.push(migration);
        }
      }
    }

    return migrations.sort((a, b) => a.id.localeCompare(b.id));
  }

  async runMigration(migration: Migration): Promise<void> {
    console.log(
      `Running migration: ${migration.id} - ${migration.description}`
    );
    await migration.up();
    await this.markMigrationApplied(migration.id);
    console.log(`✅ Migration ${migration.id} completed`);
  }

  async rollbackMigration(migration: Migration): Promise<void> {
    console.log(
      `Rolling back migration: ${migration.id} - ${migration.description}`
    );
    await migration.down();
    await this.markMigrationRolledBack(migration.id);
    console.log(`✅ Migration ${migration.id} rolled back`);
  }
}
