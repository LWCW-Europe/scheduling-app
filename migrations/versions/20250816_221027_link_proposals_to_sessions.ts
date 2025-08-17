import { Migration } from "../types";
import { validateMigrationChanges } from "../schema-validator";

const migration: Migration = {
  id: "20250816_221027_link_proposals_to_sessions",
  description: "Link proposals to sessions",

  async up() {
    console.log("Running migration: link proposals to sessions");

    // Note: Airtable doesn't support programmatic schema changes
    // Document manual steps here:
    console.log(`
⚠️  Manual Airtable Setup Required:

1. Add new field to table "Sessions":
  - Field name: "proposal"
  - Field type: Link to another record (SessionProposals) - uncheck "allow linking to multiple records"

2. Add new field to table "SessionProposals" (might be automatically created):
  - Field name: "sessions"
  - Field type: Link to another record (Sessions) - check "allow linking to multiple records"

3. Once completed, run this migration again to verify.
    `);

    // Verify the change by validating the fields exist
    await validateMigrationChanges("Sessions", [{ name: "proposal" }]);
    await validateMigrationChanges("SessionProposals", [{ name: "sessions" }]);
  },

  async down() {
    console.log("Rolling back migration: add session blockers");

    console.log(`
⚠️  Manual Airtable Rollback Required:

1. Remove field "proposal" from table "Sessions"
2. Remove field "sessions" from table "SessionProposals"
3. This action cannot be undone
    `);
  },
};

export default migration;
