import { test as base, expect } from "./fixture";
import { SqliteDaysRepository } from "../../db/repositories/sqlite/days";
import * as schema from "../../db/schema";

type Fixtures = { repo: SqliteDaysRepository };

const test = base.extend<Fixtures>({
  repo: async ({ db }, use) => {
    await use(new SqliteDaysRepository(db));
  },
});

test("round-trip: create and retrieve a day", async ({ repo }) => {
  const input = {
    start: new Date("2025-06-10T09:00:00Z"),
    end: new Date("2025-06-10T18:00:00Z"),
    startBookings: new Date("2025-06-01T00:00:00Z"),
    endBookings: new Date("2025-06-09T23:59:59Z"),
  };

  const created = await repo.create(input);

  expect(created.id).toBeTruthy();
  expect(created.start).toEqual(input.start);
  expect(created.end).toEqual(input.end);
  expect(created.startBookings).toEqual(input.startBookings);
  expect(created.endBookings).toEqual(input.endBookings);
  expect(created.eventId).toBeUndefined();

  const found = await repo.findById(created.id);
  expect(found).toBeDefined();
  expect(found!.id).toBe(created.id);
  expect(found!.start).toEqual(input.start);
  expect(found!.startBookings).toEqual(input.startBookings);
});

test("list returns days sorted by start ascending", async ({ repo }) => {
  const dayA = await repo.create({
    start: new Date("2025-06-12T09:00:00Z"),
    end: new Date("2025-06-12T18:00:00Z"),
    startBookings: new Date("2025-06-01T00:00:00Z"),
    endBookings: new Date("2025-06-11T23:59:59Z"),
  });
  const dayB = await repo.create({
    start: new Date("2025-06-11T09:00:00Z"),
    end: new Date("2025-06-11T18:00:00Z"),
    startBookings: new Date("2025-06-01T00:00:00Z"),
    endBookings: new Date("2025-06-10T23:59:59Z"),
  });

  const all = await repo.list();
  const ids = all.map((d) => d.id);
  expect(ids.indexOf(dayB.id)).toBeLessThan(ids.indexOf(dayA.id));
});

test("listByEvent filters by eventId", async ({ db, repo }) => {
  const eventId = "evt-poc-1";
  db.insert(schema.events)
    .values({
      id: eventId,
      name: "POC Event",
      start: "2025-06-10",
      end: "2025-06-12",
    })
    .run();

  const dayForEvent = await repo.create({
    start: new Date("2025-06-13T09:00:00Z"),
    end: new Date("2025-06-13T18:00:00Z"),
    startBookings: new Date("2025-06-01T00:00:00Z"),
    endBookings: new Date("2025-06-12T23:59:59Z"),
    eventId,
  });
  await repo.create({
    start: new Date("2025-06-14T09:00:00Z"),
    end: new Date("2025-06-14T18:00:00Z"),
    startBookings: new Date("2025-06-01T00:00:00Z"),
    endBookings: new Date("2025-06-13T23:59:59Z"),
  });

  const results = await repo.listByEvent(eventId);
  expect(results).toHaveLength(1);
  expect(results[0].id).toBe(dayForEvent.id);
  expect(results[0].eventId).toBe(eventId);
});

test("findById returns undefined for missing id", async ({ repo }) => {
  const result = await repo.findById("does-not-exist");
  expect(result).toBeUndefined();
});
