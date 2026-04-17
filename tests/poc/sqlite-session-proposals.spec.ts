import { test, expect } from "./fixture";
import type { DB } from "./fixture";
import * as schema from "../../db/schema";
import { SqliteSessionProposalsRepository } from "../../db/repositories/sqlite/session-proposals";
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
}

test("create proposal with hosts and retrieve it", async ({ db }) => {
  seed(db);
  const repo = new SqliteSessionProposalsRepository(db);

  const proposal = await repo.create({
    eventId: "evt1",
    title: "My Talk",
    description: "About stuff",
    hostIds: ["g1"],
    durationMinutes: 45,
  });

  expect(proposal.id).toBeTruthy();
  expect(proposal.title).toBe("My Talk");
  expect(proposal.hosts).toHaveLength(1);
  expect(proposal.hosts[0].name).toBe("Alice");
  expect(proposal.durationMinutes).toBe(45);
  expect(proposal.votesCount).toBe(0);
  expect(proposal.sessionIds).toHaveLength(0);
});

test("listByEvent returns proposals for that event only", async ({ db }) => {
  seed(db);
  db.insert(schema.events)
    .values({ id: "evt2", name: "E2", start: "2025-07-01", end: "2025-07-03" })
    .run();
  const repo = new SqliteSessionProposalsRepository(db);

  await repo.create({ eventId: "evt1", title: "P1", hostIds: [] });
  await repo.create({ eventId: "evt2", title: "P2", hostIds: [] });

  const results = await repo.listByEvent("evt1");
  expect(results).toHaveLength(1);
  expect(results[0].title).toBe("P1");
});

test("vote counts are computed correctly", async ({ db }) => {
  seed(db);
  const repo = new SqliteSessionProposalsRepository(db);
  const proposal = await repo.create({ eventId: "evt1", title: "Talk", hostIds: [] });

  db.insert(schema.votes)
    .values([
      { id: "v1", proposalId: proposal.id, guestId: "g1", choice: VoteChoice.interested },
      { id: "v2", proposalId: proposal.id, guestId: "g2", choice: VoteChoice.maybe },
    ])
    .run();

  const found = await repo.findById(proposal.id);
  expect(found?.votesCount).toBe(2);
  expect(found?.interestedVotesCount).toBe(1);
  expect(found?.maybeVotesCount).toBe(1);
});

test("update title and durationMinutes", async ({ db }) => {
  seed(db);
  const repo = new SqliteSessionProposalsRepository(db);
  const proposal = await repo.create({ eventId: "evt1", title: "Old", hostIds: [], durationMinutes: 30 });

  const updated = await repo.update(proposal.id, { title: "New", durationMinutes: null });
  expect(updated.title).toBe("New");
  expect(updated.durationMinutes).toBeUndefined();
});

test("update hostIds removes votes from new hosts", async ({ db }) => {
  seed(db);
  const repo = new SqliteSessionProposalsRepository(db);
  const proposal = await repo.create({ eventId: "evt1", title: "Talk", hostIds: [] });

  db.insert(schema.votes)
    .values({ id: "v1", proposalId: proposal.id, guestId: "g1", choice: VoteChoice.interested })
    .run();

  await repo.update(proposal.id, { hostIds: ["g1"] });

  const found = await repo.findById(proposal.id);
  expect(found?.hosts[0].id).toBe("g1");
  expect(found?.votesCount).toBe(0);
});

test("delete removes proposal, hosts, and votes", async ({ db }) => {
  seed(db);
  const repo = new SqliteSessionProposalsRepository(db);
  const proposal = await repo.create({ eventId: "evt1", title: "Bye", hostIds: ["g1"] });
  db.insert(schema.votes)
    .values({ id: "v1", proposalId: proposal.id, guestId: "g2", choice: VoteChoice.maybe })
    .run();

  await repo.delete(proposal.id);

  expect(await repo.findById(proposal.id)).toBeUndefined();
  expect(db.select().from(schema.proposalHosts).all()).toHaveLength(0);
  expect(db.select().from(schema.votes).all()).toHaveLength(0);
});
