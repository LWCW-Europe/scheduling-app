import { Migration } from "../types";
import { validateMigrationChanges } from "../schema-validator";

const migration: Migration = {
  id: "20250814_224603_add_session_blockers",
  description: "Add session blockers to Sessions",

  async up() {
    console.log("Running migration: add session Blocker");

    // Note: Airtable doesn't support programmatic schema changes
    // Document manual steps here:
    console.log(`
⚠️  Manual Airtable Setup Required:

1. Add new field to table "Sessions":
  - Field name: "Blocker"
  - Field type: "checkbox"
  - Default: unchecked
    
2. Once completed, run this migration again to verify.
    `);

    // Verify the change by validating the field exists
    await validateMigrationChanges("Sessions", [{ name: "Blocker" }]);
  },

  async down() {
    console.log("Rolling back migration: add session blockers");

    console.log(`
⚠️  Manual Airtable Rollback Required:

1. Remove field "Blocker" from table "Sessions"
2. This action cannot be undone
    `);
  },
};

export default migration;
