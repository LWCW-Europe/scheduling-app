import { Migration } from "../types";
import { validateMigrationChanges } from "../schema-validator";

const migration: Migration = {
  id: "20250806_073432_add_created_time_to_session_proposals",
  description: "Add createdTime field to SessionProposals table",

  async up() {
    console.log("Running migration: add createdTime field to SessionProposals");

    // Note: Airtable doesn't support programmatic schema changes
    // Document manual steps here:
    console.log(`
⚠️  Manual Airtable Setup Required:

1. Add new field to table "SessionProposals":
   - Field Name: "createdTime"
   - Field Type: "Created time"
   
2. Once completed, run this migration again to verify.
    `);

    // Verify the change by validating the field exists
    await validateMigrationChanges("SessionProposals", [
      { name: "createdTime" },
    ]);
  },

  async down() {
    console.log("Rolling back migration: remove createdTime field");

    console.log(`
⚠️  Manual Airtable Rollback Required:

1. Remove field "createdTime" from table "SessionProposals"
2. This action cannot be undone
    `);
  },
};

export default migration;
