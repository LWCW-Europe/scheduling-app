import { test, expect } from "./fixture";
import type { DB } from "./fixture";
import * as schema from "../../db/schema";
import { SqliteRsvpsRepository } from "../../db/repositories/sqlite/rsvps";

function seed(db: DB) {
  db.insert(schema.guests)
    .values([
      { id: "g1", name: "Alice", email: "alice@example.com" },
      { id: "g2", name: "Bob", email: "bob@example.com" },
    ])
    .run();
  db.insert(schema.sessions)
    .values({ id: "s1", title: "Talk", description: "", capacity: 10, attendeeScheduled: true, blocker: false, closed: false })
    .run();
}

test("create and list by guest", async ({ db }) => {
  seed(db);
  const repo = new SqliteRsvpsRepository(db);

  const rsvp = await repo.create({ sessionId: "s1", guestId: "g1" });
  expect(rsvp.id).toBeTruthy();

  const byGuest = await repo.listByGuest("g1");
  expect(byGuest).toHaveLength(1);
  expect(byGuest[0].sessionId).toBe("s1");
});

test("deleteBySessionAndGuest removes exactly one rsvp", async ({ db }) => {
  seed(db);
  const repo = new SqliteRsvpsRepository(db);

  await repo.create({ sessionId: "s1", guestId: "g1" });
  await repo.create({ sessionId: "s1", guestId: "g2" });

  await repo.deleteBySessionAndGuest("s1", "g1");

  const remaining = await repo.listBySession("s1");
  expect(remaining).toHaveLength(1);
  expect(remaining[0].guestId).toBe("g2");
});

test("deleteBySessionAndGuests removes multiple rsvps", async ({ db }) => {
  seed(db);
  const repo = new SqliteRsvpsRepository(db);

  await repo.create({ sessionId: "s1", guestId: "g1" });
  await repo.create({ sessionId: "s1", guestId: "g2" });

  await repo.deleteBySessionAndGuests("s1", ["g1", "g2"]);

  expect(await repo.listBySession("s1")).toHaveLength(0);
});
