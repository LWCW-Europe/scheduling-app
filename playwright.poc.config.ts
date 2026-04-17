import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/poc",
  fullyParallel: true,
  reporter: "line",
});
