import { getBase } from "@/db/db";

export interface FieldValidation {
  name: string;
  description?: string;
}

/**
 * Validates that specific fields exist in a table by attempting to query them.
 * This is used by migrations to verify manual schema changes were completed.
 */
export async function validateTableFields(
  tableName: string,
  fields: FieldValidation[]
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  // First check if the table exists
  try {
    await getBase()(tableName).select({ maxRecords: 1 }).firstPage();
  } catch (error: any) {
    if (error.message?.includes("not authorized")) {
      errors.push(`Table "${tableName}" does not exist`);
      return { valid: false, errors };
    }
    throw error; // Re-throw other errors (auth issues, etc.)
  }

  // Check each field by trying to query it
  for (const field of fields) {
    try {
      await getBase()(tableName)
        .select({
          fields: [field.name],
          maxRecords: 1,
        })
        .firstPage();

      console.log(`✅ Field "${field.name}" exists in table "${tableName}"`);
    } catch (error: any) {
      if (error.message?.includes("Unknown field name")) {
        errors.push(
          `Field "${field.name}" is missing from table "${tableName}"`
        );
      } else {
        // Re-throw unexpected errors
        throw error;
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Helper function for migrations to validate their changes
 */
export async function validateMigrationChanges(
  tableName: string,
  fields: FieldValidation[]
): Promise<void> {
  console.log(`🔍 Validating migration changes for table "${tableName}"...`);

  const result = await validateTableFields(tableName, fields);

  if (result.valid) {
    console.log(`✅ All fields verified for table "${tableName}"`);
  } else {
    console.log(`❌ Validation failed for table "${tableName}":`);
    result.errors.forEach((error) => console.log(`  - ${error}`));

    throw new Error(
      `Migration validation failed. Please complete the manual schema changes first.`
    );
  }
}
