import { Migration } from "../types";
import { validateMigrationChanges } from "../schema-validator";

const migration: Migration = {
  id: "20250801_000000_add_events_phase_fields",
  description: "Add phase timing fields to Events table",

  async up() {
    console.log("Adding phase fields to Events table...");

    console.log(`
⚠️  Manual Airtable Setup Required:

1. Add new fields to the existing "Events" table:
   - proposalPhaseStart: Date & time
   - proposalPhaseEnd: Date & time  
   - votingPhaseStart: Date & time
   - votingPhaseEnd: Date & time
   - schedulingPhaseStart: Date & time
   - schedulingPhaseEnd: Date & time
   
2. All fields are optional and control event phases
3. Once completed, run this migration again to verify.
    `);

    // Verify the new fields exist (all optional)
    await validateMigrationChanges("Events", [
      { name: "proposalPhaseStart" },
      { name: "proposalPhaseEnd" },
      { name: "votingPhaseStart" },
      { name: "votingPhaseEnd" },
      { name: "schedulingPhaseStart" },
      { name: "schedulingPhaseEnd" },
    ]);
  },

  async down() {
    console.log(`
⚠️  Manual Airtable Rollback Required:

To rollback this migration:
1. Remove the following fields from "Events" table:
   - proposalPhaseStart
   - proposalPhaseEnd
   - votingPhaseStart  
   - votingPhaseEnd
   - schedulingPhaseStart
   - schedulingPhaseEnd
2. This action cannot be undone
    `);
  },
};

export default migration;
