import { test, expect } from "./fixture";
import type { DB } from "./fixture";
import * as schema from "../../db/schema";
import { SqliteSessionsRepository } from "../../db/repositories/sqlite/sessions";

function seed(db: DB) {
  db.insert(schema.events)
    .values({ id: "evt1", name: "E1", start: "2025-06-10", end: "2025-06-12" })
    .run();
  db.insert(schema.guests)
    .values([
      { id: "g1", name: "Alice", email: "alice@example.com" },
      { id: "g2", name: "Bob", email: "bob@example.com" },
    ])
    .run();
  db.insert(schema.locations)
    .values({ id: "loc1", name: "Hall", imageUrl: "", description: "", capacity: 50, color: "#000", hidden: false, bookable: true, sortIndex: 1 })
    .run();
}

test("create session with hosts and locations", async ({ db }) => {
  seed(db);
  const repo = new SqliteSessionsRepository(db);

  const session = await repo.create({
    title: "Keynote",
    description: "Opening talk",
    startTime: new Date("2025-06-10T09:00:00Z"),
    endTime: new Date("2025-06-10T10:00:00Z"),
    capacity: 50,
    attendeeScheduled: true,
    blocker: false,
    closed: false,
    eventId: "evt1",
    hostIds: ["g1"],
    locationIds: ["loc1"],
  });

  expect(session.id).toBeTruthy();
  expect(session.title).toBe("Keynote");
  expect(session.hosts).toHaveLength(1);
  expect(session.hosts[0].name).toBe("Alice");
  expect(session.locations).toHaveLength(1);
  expect(session.locations[0].name).toBe("Hall");
  expect(session.numRsvps).toBe(0);
});

test("listScheduled filters unscheduled sessions", async ({ db }) => {
  seed(db);
  const repo = new SqliteSessionsRepository(db);

  await repo.create({
    title: "Scheduled",
    description: "",
    startTime: new Date("2025-06-10T09:00:00Z"),
    endTime: new Date("2025-06-10T10:00:00Z"),
    capacity: 50,
    attendeeScheduled: true,
    blocker: false,
    closed: false,
    hostIds: ["g1"],
    locationIds: ["loc1"],
  });
  await repo.create({
    title: "Unscheduled",
    description: "",
    capacity: 50,
    attendeeScheduled: false,
    blocker: false,
    closed: false,
    hostIds: [],
    locationIds: [],
  });

  const scheduled = await repo.listScheduled();
  expect(scheduled.map((s) => s.title)).toContain("Scheduled");
  expect(scheduled.map((s) => s.title)).not.toContain("Unscheduled");
});

test("update replaces hosts and locations", async ({ db }) => {
  seed(db);
  const repo = new SqliteSessionsRepository(db);

  const session = await repo.create({
    title: "Talk",
    description: "",
    capacity: 30,
    attendeeScheduled: true,
    blocker: false,
    closed: false,
    hostIds: ["g1"],
    locationIds: ["loc1"],
  });

  const updated = await repo.update(session.id, { title: "Talk v2", hostIds: ["g2"] });
  expect(updated.title).toBe("Talk v2");
  expect(updated.hosts).toHaveLength(1);
  expect(updated.hosts[0].id).toBe("g2");
  expect(updated.locations).toHaveLength(1);
});

test("delete removes session and its RSVPs", async ({ db }) => {
  seed(db);
  const repo = new SqliteSessionsRepository(db);

  const session = await repo.create({
    title: "Gone",
    description: "",
    capacity: 10,
    attendeeScheduled: true,
    blocker: false,
    closed: false,
    hostIds: [],
    locationIds: [],
  });
  db.insert(schema.rsvps)
    .values({ id: "r1", sessionId: session.id, guestId: "g1" })
    .run();

  await repo.delete(session.id);

  expect(await repo.findById(session.id)).toBeUndefined();
  const rsvps = db.select().from(schema.rsvps).all();
  expect(rsvps).toHaveLength(0);
});

test("numRsvps reflects rsvp count", async ({ db }) => {
  seed(db);
  const repo = new SqliteSessionsRepository(db);

  const session = await repo.create({
    title: "Popular",
    description: "",
    capacity: 100,
    attendeeScheduled: true,
    blocker: false,
    closed: false,
    hostIds: [],
    locationIds: [],
  });
  db.insert(schema.rsvps)
    .values([
      { id: "r1", sessionId: session.id, guestId: "g1" },
      { id: "r2", sessionId: session.id, guestId: "g2" },
    ])
    .run();

  const found = await repo.findById(session.id);
  expect(found?.numRsvps).toBe(2);
});
