import { resetDatabase } from "./reset-database";

async function globalSetup() {
  console.log("🚀 Setting up test environment...");

  // Reset and seed the database with test data
  await resetDatabase();

  console.log("✅ Test environment ready!");
}

export default globalSetup;
