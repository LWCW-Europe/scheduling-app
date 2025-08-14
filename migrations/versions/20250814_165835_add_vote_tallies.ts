import { Migration } from "../types";
import { validateMigrationChanges } from "../schema-validator";

const migration: Migration = {
  id: "20250814_165835_add_vote_tallies",
  description: "add_vote_tallies",

  async up() {
    console.log("Running migration: add vote tallies");

    // Note: Airtable doesn't support programmatic schema changes
    // Document manual steps here:
    console.log(`
⚠️  Manual Airtable Setup Required:

1. Add new fields to table "SessionProposals":
   - interestedVotesCount: Count, count source: votes, condition: Where choice is interested
   - maybeVotesCount: Count, count source: votes, condition: Where choice is maybe
   
2. Once completed, run this migration again to verify.
    `);

    // Verify the change by validating the fields exist
    await validateMigrationChanges("SessionProposals", [
      { name: "interestedVotesCount" },
      { name: "maybeVotesCount" },
    ]);
  },

  async down() {
    console.log("Rolling back migration: add vote tallies");

    console.log(`
⚠️  Manual Airtable Rollback Required:

1. Remove fields interestedVotesCount, maybeVotesCount from table SessionProposals
2. This action cannot be undone
    `);
  },
};

export default migration;
