import { and, eq, inArray } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { nanoid } from "nanoid";
import * as schema from "../../schema";
import type { Vote, VoteChoice, VotesRepository } from "../interfaces";

type DB = BetterSQLite3Database<typeof schema>;

function rowToVote(row: typeof schema.votes.$inferSelect): Vote {
  return {
    id: row.id,
    proposalId: row.proposalId,
    guestId: row.guestId,
    choice: row.choice as VoteChoice,
  };
}

export class SqliteVotesRepository implements VotesRepository {
  constructor(private readonly db: DB) {}

  async listByGuestAndEvent(guestId: string, eventId: string): Promise<Vote[]> {
    const rows = this.db
      .select({
        id: schema.votes.id,
        proposalId: schema.votes.proposalId,
        guestId: schema.votes.guestId,
        choice: schema.votes.choice,
      })
      .from(schema.votes)
      .innerJoin(
        schema.sessionProposals,
        eq(schema.votes.proposalId, schema.sessionProposals.id)
      )
      .where(
        and(
          eq(schema.votes.guestId, guestId),
          eq(schema.sessionProposals.eventId, eventId)
        )
      )
      .all();
    return rows.map(rowToVote);
  }

  async create(data: {
    proposalId: string;
    guestId: string;
    choice: VoteChoice;
  }): Promise<Vote> {
    const id = nanoid();
    this.db
      .insert(schema.votes)
      .values({
        id,
        proposalId: data.proposalId,
        guestId: data.guestId,
        choice: data.choice,
      })
      .run();
    return { id, ...data };
  }

  async deleteByGuestAndProposal(
    guestId: string,
    proposalId: string
  ): Promise<void> {
    this.db
      .delete(schema.votes)
      .where(
        and(
          eq(schema.votes.guestId, guestId),
          eq(schema.votes.proposalId, proposalId)
        )
      )
      .run();
  }

  async deleteByProposal(proposalId: string): Promise<void> {
    this.db
      .delete(schema.votes)
      .where(eq(schema.votes.proposalId, proposalId))
      .run();
  }

  async deleteByProposalAndGuests(
    proposalId: string,
    guestIds: string[]
  ): Promise<void> {
    if (guestIds.length === 0) return;
    this.db
      .delete(schema.votes)
      .where(
        and(
          eq(schema.votes.proposalId, proposalId),
          inArray(schema.votes.guestId, guestIds)
        )
      )
      .run();
  }
}
