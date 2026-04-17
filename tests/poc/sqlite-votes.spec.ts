import { test, expect } from "./fixture";
import type { DB } from "./fixture";
import * as schema from "../../db/schema";
import { SqliteVotesRepository } from "../../db/repositories/sqlite/votes";
import { VoteChoice } from "../../db/repositories/interfaces";

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
  db.insert(schema.sessionProposals)
    .values([
      {
        id: "p1",
        eventId: "evt1",
        title: "P1",
        createdTime: new Date().toISOString(),
      },
      {
        id: "p2",
        eventId: "evt1",
        title: "P2",
        createdTime: new Date().toISOString(),
      },
    ])
    .run();
}

test("create and list by guest and event", async ({ db }) => {
  seed(db);
  const repo = new SqliteVotesRepository(db);

  const vote = await repo.create({
    proposalId: "p1",
    guestId: "g1",
    choice: VoteChoice.interested,
  });
  expect(vote.id).toBeTruthy();
  expect(vote.choice).toBe(VoteChoice.interested);

  const votes = await repo.listByGuestAndEvent("g1", "evt1");
  expect(votes).toHaveLength(1);
  expect(votes[0].proposalId).toBe("p1");
});

test("listByGuestAndEvent scopes to event", async ({ db }) => {
  seed(db);
  db.insert(schema.events)
    .values({ id: "evt2", name: "E2", start: "2025-07-01", end: "2025-07-03" })
    .run();
  db.insert(schema.sessionProposals)
    .values({
      id: "p3",
      eventId: "evt2",
      title: "P3",
      createdTime: new Date().toISOString(),
    })
    .run();
  const repo = new SqliteVotesRepository(db);

  await repo.create({
    proposalId: "p1",
    guestId: "g1",
    choice: VoteChoice.interested,
  });
  await repo.create({
    proposalId: "p3",
    guestId: "g1",
    choice: VoteChoice.maybe,
  });

  const votes = await repo.listByGuestAndEvent("g1", "evt1");
  expect(votes).toHaveLength(1);
  expect(votes[0].proposalId).toBe("p1");
});

test("deleteByGuestAndProposal removes one vote", async ({ db }) => {
  seed(db);
  const repo = new SqliteVotesRepository(db);

  await repo.create({
    proposalId: "p1",
    guestId: "g1",
    choice: VoteChoice.interested,
  });
  await repo.create({
    proposalId: "p2",
    guestId: "g1",
    choice: VoteChoice.maybe,
  });

  await repo.deleteByGuestAndProposal("g1", "p1");

  const remaining = await repo.listByGuestAndEvent("g1", "evt1");
  expect(remaining).toHaveLength(1);
  expect(remaining[0].proposalId).toBe("p2");
});

test("deleteByProposal removes all votes for a proposal", async ({ db }) => {
  seed(db);
  const repo = new SqliteVotesRepository(db);

  await repo.create({
    proposalId: "p1",
    guestId: "g1",
    choice: VoteChoice.interested,
  });
  await repo.create({
    proposalId: "p1",
    guestId: "g2",
    choice: VoteChoice.maybe,
  });
  await repo.create({
    proposalId: "p2",
    guestId: "g1",
    choice: VoteChoice.skip,
  });

  await repo.deleteByProposal("p1");

  expect(await repo.listByGuestAndEvent("g1", "evt1")).toHaveLength(1);
  expect(db.select().from(schema.votes).all()).toHaveLength(1);
});

test("deleteByProposalAndGuests removes only matching guests", async ({
  db,
}) => {
  seed(db);
  const repo = new SqliteVotesRepository(db);

  await repo.create({
    proposalId: "p1",
    guestId: "g1",
    choice: VoteChoice.interested,
  });
  await repo.create({
    proposalId: "p1",
    guestId: "g2",
    choice: VoteChoice.maybe,
  });

  await repo.deleteByProposalAndGuests("p1", ["g1"]);

  const remaining = db.select().from(schema.votes).all();
  expect(remaining).toHaveLength(1);
  expect(remaining[0].guestId).toBe("g2");
});
