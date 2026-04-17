import { test, expect } from "./fixture";
import { SqliteEventsRepository } from "../../db/repositories/sqlite/events";

const base = {
  name: "Manifest",
  description: "Annual unconference",
  website: "https://manifest.example",
  start: new Date("2025-06-10T00:00:00Z"),
  end: new Date("2025-06-12T00:00:00Z"),
};

test("create and find by name", async ({ db }) => {
  const repo = new SqliteEventsRepository(db);
  const created = await repo.create(base);
  expect(created.id).toBeTruthy();
  expect(created.name).toBe("Manifest");

  const found = await repo.findByName("Manifest");
  expect(found?.id).toBe(created.id);
  expect(found?.start).toEqual(base.start);
  expect(found?.end).toEqual(base.end);
});

test("list returns all events", async ({ db }) => {
  const repo = new SqliteEventsRepository(db);
  await repo.create(base);
  await repo.create({ ...base, name: "Manifest 2" });
  const all = await repo.list();
  expect(all).toHaveLength(2);
});

test("optional phase dates round-trip", async ({ db }) => {
  const repo = new SqliteEventsRepository(db);
  const proposalStart = new Date("2025-03-01T00:00:00Z");
  const proposalEnd = new Date("2025-04-01T00:00:00Z");
  const created = await repo.create({
    ...base,
    proposalPhaseStart: proposalStart,
    proposalPhaseEnd: proposalEnd,
  });
  const found = await repo.findById(created.id);
  expect(found?.proposalPhaseStart).toEqual(proposalStart);
  expect(found?.proposalPhaseEnd).toEqual(proposalEnd);
  expect(found?.votingPhaseStart).toBeUndefined();
});

test("findByName returns undefined for missing event", async ({ db }) => {
  const repo = new SqliteEventsRepository(db);
  expect(await repo.findByName("nope")).toBeUndefined();
});
