import { Migration } from "../types";
import { validateMigrationChanges } from "../schema-validator";

const migration: Migration = {
  id: "20250800_000000_add_migrations_table",
  description: "Add Migrations table for tracking schema changes",

  async up() {
    console.log("Setting up Migrations table...");

    console.log(`
⚠️  Manual Airtable Setup Required:

1. Create a new table called "Migrations" in your Airtable base
2. Add the following fields:
   - id: Single line text (Primary field, Required)
   - appliedAt: Date & time (Required)
   
3. Once created, run this migration again to verify.
    `);

    // Verify the table and required fields exist
    await validateMigrationChanges("Migrations", [
      { name: "id" },
      { name: "appliedAt" },
    ]);
  },

  async down() {
    console.log(`
⚠️  Manual Airtable Rollback Required:

To rollback this migration:
1. Delete the "Migrations" table from your Airtable base
2. This will permanently delete migration history
    `);
  },
};

export default migration;
