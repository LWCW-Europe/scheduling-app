#!/usr/bin/env node

import fs from "fs";
import path from "path";

function generateMigrationId(): string {
  const now = new Date();
  const timestamp = now.toISOString().slice(0, 10).replace(/-/g, "");
  const time = now.toTimeString().slice(0, 8).replace(/:/g, "");
  return `${timestamp}_${time}`;
}

function createMigrationTemplate(id: string, description: string): string {
  return `import { Migration } from "../types";
import { base } from "@/db/db";

const migration: Migration = {
  id: "${id}",
  description: "${description}",

  async up() {
    // Add your migration logic here
    console.log("Running migration: ${description}");

    // Example: Adding a new field to an existing table
    // Note: Airtable doesn't support programmatic schema changes
    // Document manual steps here:
    console.log(\`
⚠️  Manual Airtable Setup Required:

1. Add new field to [TABLE_NAME]:
    - Field name: [FIELD_NAME]
    - Field type: [FIELD_TYPE]
    
2. Once completed, this migration will be marked as complete.
      \`);

    // Verify the change by trying to access the field
    // try {
    //   await base("TableName").select({
    //     fields: ["NewFieldName"],
    //     maxRecords: 1
    //   }).firstPage();
    //   console.log("✅ New field verified");
    // } catch (error) {
    //   throw new Error("New field not found. Please add it manually first.");
    // }
  },

  async down() {
    // Add rollback logic here
    console.log("Rolling back migration: ${description}");

    console.log(\`
⚠️  Manual Airtable Rollback Required:

1. Remove field [FIELD_NAME] from table [TABLE_NAME]
2. This action cannot be undone
    \`);
  },
};

export default migration;
`;
}

async function main() {
  const description = process.argv[2];

  if (!description) {
    console.error("Usage: npm run migrate:create <description>");
    console.error("Example: npm run migrate:create add_user_preferences");
    process.exit(1);
  }

  const id =
    generateMigrationId() +
    "_" +
    description.replace(/\s+/g, "_").toLowerCase();
  const filename = `${id}.ts`;
  const filepath = path.join(__dirname, "../versions", filename);

  // Ensure versions directory exists
  const versionsDir = path.join(__dirname, "../versions");
  if (!fs.existsSync(versionsDir)) {
    fs.mkdirSync(versionsDir, { recursive: true });
  }

  // Create migration file
  const content = createMigrationTemplate(id, description);
  fs.writeFileSync(filepath, content);

  console.log(`✅ Created migration: ${filename}`);
  console.log(`📝 Edit the file at: ${filepath}`);
  console.log(`🚀 Run 'npm run migrate:up' when ready to apply`);
}

if (require.main === module) {
  main();
}
