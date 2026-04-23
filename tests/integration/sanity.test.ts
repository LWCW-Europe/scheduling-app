import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { setupTestDb, resetTestDb } from "../helpers/db";
import { createEvent } from "../helpers/factories";
import { getRepositories } from "@/db/container";

describe("integration sanity", () => {
  beforeAll(() => {
    setupTestDb();
  });

  beforeEach(() => {
    resetTestDb();
  });

  it("creates and reads back an event", async () => {
    const event = await createEvent({ phase: "proposal" });
    const { events } = getRepositories();
    const found = await events.findById(event.id);
    expect(found).toBeDefined();
    expect(found?.name).toBe(event.name);
  });
});
