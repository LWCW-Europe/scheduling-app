import { Migration } from "../types";
import { getBase } from "@/db/db";

const migration: Migration = {
  id: "20250828_124557_add_closed_field_to_sessions",
  description: "add_closed_field_to_sessions",

  async up() {
    console.log("Running migration: add_closed_field_to_sessions");

    // Note: Airtable doesn't support programmatic schema changes
    // Document manual steps here:
    console.log(`
⚠️  Manual Airtable Setup Required:

1. Add new field to table "Sessions":
    - Field name: Closed
    - Field type: Checkbox
    - Default value: Unchecked (false)
    
2. Once completed, run this migration again to verify.
    `);

    // Verify the change by trying to access the field
    try {
      await getBase()("Sessions")
        .select({
          fields: ["Closed"],
          maxRecords: 1,
        })
        .firstPage();
      console.log("✅ Closed field verified in Sessions table");
    } catch (error) {
      throw new Error(
        "Closed field not found in Sessions table. Please add it manually first."
      );
    }
  },

  async down() {
    console.log("Rolling back migration: add_closed_field_to_sessions");

    console.log(`
⚠️  Manual Airtable Rollback Required:

1. Remove field "Closed" from table "Sessions"
2. This action cannot be undone
    `);
  },
};

export default migration;
