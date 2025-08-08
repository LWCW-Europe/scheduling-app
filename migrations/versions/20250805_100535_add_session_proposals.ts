import { Migration } from "../types";
import { validateMigrationChanges } from "../schema-validator";

const migration: Migration = {
  id: "20250805_100535_add_session_proposals",
  description: "Add SessionProposals table with required fields",

  async up() {
    // Note: Airtable doesn't allow programmatic table creation
    // This migration documents the manual steps needed
    console.log(`
⚠️  Manual Airtable Setup Required:

1. Create a new table called "SessionProposals" in your Airtable base
2. Add the following fields:
   - id: Formula, 'RECORD_ID()' (Primary field)
   - title: Single line text (Required)
   - description: Long text
   - event: Link to another record (Events) - Only one (Required)
   - hosts: Link to another record (Guests) - Multiple (Required)
   - durationMinutes: Number

3. Once created, run this migration again to verify.
    `);

    // Verify the table and required fields exist
    await validateMigrationChanges("SessionProposals", [
      { name: "id" },
      { name: "title" },
      { name: "description" },
      { name: "event" },
      { name: "hosts" },
      { name: "durationMinutes" },
    ]);
  },

  async down() {
    console.log(`
⚠️  Manual Airtable Rollback Required:

To rollback this migration:
1. Delete the "SessionProposals" table from your Airtable base
2. This will permanently delete all session proposal data
    `);

    // We can't actually delete the table programmatically
    // Just log what needs to be done manually
  },
};

export default migration;
