import { resetDatabase } from "./reset-database";

function globalSetup() {
  console.log("🚀 Setting up test environment...");

  // Reset and seed the database with test data
  resetDatabase();

  console.log("✅ Test environment ready!");
}

export default globalSetup;
