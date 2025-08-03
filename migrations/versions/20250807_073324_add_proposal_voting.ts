import { Migration } from "../types";
import { base } from "@/db/db";

const migration: Migration = {
  id: "20250807_073324_add_proposal_voting",
  description: "add_proposal_voting",

  async up() {
    console.log("Running migration: add_proposal_voting");

    console.log(`
⚠️  Manual Airtable Setup Required:

STEP 1: Create new Votes table:
1. Create a new table called "Votes"
2. Add the following fields:
   - id: Formula field with formula: RECORD_ID() - Primary field
   - choice: Single select with options: interested, maybe, skip
   - guest: Link to another record (Guests) - Only one record
   - proposal: Link to another record (SessionProposals) - Only one record
   - guestId: Lookup field from guest table (ID field)
   - proposalId: Lookup field from proposal table (ID field)  
   - event: Lookup field from proposal table (event field)

STEP 2: Add new fields to SessionProposals table:
1. Add field "votes": Link to another record (Votes) - Multiple records
2. Add field "votesCount": Count field that counts linked records from votes field

STEP 3: Once completed, this migration will be marked as complete.
    `);

    // Verify the changes by trying to access the new fields
    try {
      // Test accessing the new Votes table
      await base("Votes")
        .select({
          fields: ["id", "choice", "guest", "proposal"],
          maxRecords: 1,
        })
        .firstPage();
      console.log("✅ Votes table verified");

      // Test accessing the new fields in SessionProposals
      await base("SessionProposals")
        .select({
          fields: ["votes", "votesCount"],
          maxRecords: 1,
        })
        .firstPage();
      console.log("✅ SessionProposals new fields verified");

      console.log("✅ Migration completed successfully");
    } catch (error) {
      throw new Error(
        "Required tables/fields not found. Please complete the manual setup first: " +
          error
      );
    }
  },

  async down() {
    console.log("Rolling back migration: add_proposal_voting");

    console.log(`
⚠️  Manual Airtable Rollback Required:

STEP 1: Remove fields from SessionProposals table:
1. Delete field "votes" from SessionProposals table
2. Delete field "votesCount" from SessionProposals table

STEP 2: Delete Votes table:
1. Delete the entire "Votes" table and all its data

⚠️  WARNING: This action will permanently delete all voting data and cannot be undone.
    `);
  },
};

export default migration;
