import { test, expect } from "./fixture";
import { SqliteGuestsRepository } from "../../db/repositories/sqlite/guests";
import * as schema from "../../db/schema";

test("create and find by email", async ({ db }) => {
  const repo = new SqliteGuestsRepository(db);
  const created = await repo.create({
    name: "Alice",
    email: "alice@example.com",
  });
  expect(created.id).toBeTruthy();

  const found = await repo.findByEmail("alice@example.com");
  expect(found?.id).toBe(created.id);
  expect(found?.name).toBe("Alice");
});

test("list returns all guests", async ({ db }) => {
  const repo = new SqliteGuestsRepository(db);
  await repo.create({ name: "Alice", email: "alice@example.com" });
  await repo.create({ name: "Bob", email: "bob@example.com" });
  expect(await repo.list()).toHaveLength(2);
});

test("listByEvent returns only guests linked to that event", async ({ db }) => {
  const repo = new SqliteGuestsRepository(db);
  const alice = await repo.create({
    name: "Alice",
    email: "alice@example.com",
  });
  const bob = await repo.create({ name: "Bob", email: "bob@example.com" });

  db.insert(schema.events)
    .values({ id: "evt1", name: "E1", start: "2025-06-10", end: "2025-06-12" })
    .run();
  db.insert(schema.eventGuests)
    .values({ eventId: "evt1", guestId: alice.id })
    .run();

  const results = await repo.listByEvent("evt1");
  expect(results).toHaveLength(1);
  expect(results[0].id).toBe(alice.id);
  expect(results.find((g) => g.id === bob.id)).toBeUndefined();
});

test("findById returns undefined for unknown id", async ({ db }) => {
  const repo = new SqliteGuestsRepository(db);
  expect(await repo.findById("nope")).toBeUndefined();
});
