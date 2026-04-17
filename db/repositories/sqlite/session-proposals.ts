import { and, eq, inArray, isNotNull } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { nanoid } from "nanoid";
import * as schema from "../../schema";
import type {
  ProposalHost,
  SessionProposal,
  SessionProposalCreateInput,
  SessionProposalUpdateInput,
  SessionProposalsRepository,
} from "../interfaces";

type DB = BetterSQLite3Database<typeof schema>;
type ProposalRow = typeof schema.sessionProposals.$inferSelect;

export class SqliteSessionProposalsRepository implements SessionProposalsRepository {
  constructor(private readonly db: DB) {}

  private enrichProposals(rows: ProposalRow[]): SessionProposal[] {
    if (rows.length === 0) return [];

    const ids = rows.map((r) => r.id);

    const hostRows = this.db
      .select({
        proposalId: schema.proposalHosts.proposalId,
        id: schema.guests.id,
        name: schema.guests.name,
        email: schema.guests.email,
      })
      .from(schema.proposalHosts)
      .innerJoin(
        schema.guests,
        eq(schema.proposalHosts.guestId, schema.guests.id)
      )
      .all()
      .filter((r) => ids.includes(r.proposalId));

    const voteRows = this.db
      .select({
        proposalId: schema.votes.proposalId,
        choice: schema.votes.choice,
      })
      .from(schema.votes)
      .all()
      .filter((r) => ids.includes(r.proposalId));

    const sessionRows = this.db
      .select({
        proposalId: schema.sessions.proposalId,
        id: schema.sessions.id,
      })
      .from(schema.sessions)
      .where(isNotNull(schema.sessions.proposalId))
      .all()
      .filter((r) => ids.includes(r.proposalId!));

    const hostsByProposal = new Map<string, ProposalHost[]>();
    for (const r of hostRows) {
      const list = hostsByProposal.get(r.proposalId) ?? [];
      list.push({ id: r.id, name: r.name, email: r.email });
      hostsByProposal.set(r.proposalId, list);
    }

    const voteCountsByProposal = new Map<
      string,
      { total: number; interested: number; maybe: number }
    >();
    for (const r of voteRows) {
      const counts = voteCountsByProposal.get(r.proposalId) ?? {
        total: 0,
        interested: 0,
        maybe: 0,
      };
      counts.total++;
      if (r.choice === "interested") counts.interested++;
      if (r.choice === "maybe") counts.maybe++;
      voteCountsByProposal.set(r.proposalId, counts);
    }

    const sessionIdsByProposal = new Map<string, string[]>();
    for (const r of sessionRows) {
      const list = sessionIdsByProposal.get(r.proposalId!) ?? [];
      list.push(r.id);
      sessionIdsByProposal.set(r.proposalId!, list);
    }

    return rows.map((row) => {
      const votes = voteCountsByProposal.get(row.id) ?? {
        total: 0,
        interested: 0,
        maybe: 0,
      };
      return {
        id: row.id,
        eventId: row.eventId,
        title: row.title,
        description: row.description ?? undefined,
        durationMinutes: row.durationMinutes ?? undefined,
        createdTime: new Date(row.createdTime),
        hosts: hostsByProposal.get(row.id) ?? [],
        votesCount: votes.total,
        interestedVotesCount: votes.interested,
        maybeVotesCount: votes.maybe,
        sessionIds: sessionIdsByProposal.get(row.id) ?? [],
      };
    });
  }

  async listByEvent(eventId: string): Promise<SessionProposal[]> {
    const rows = this.db
      .select()
      .from(schema.sessionProposals)
      .where(eq(schema.sessionProposals.eventId, eventId))
      .all();
    return this.enrichProposals(rows);
  }

  async findById(id: string): Promise<SessionProposal | undefined> {
    const row = this.db
      .select()
      .from(schema.sessionProposals)
      .where(eq(schema.sessionProposals.id, id))
      .get();
    if (!row) return undefined;
    return this.enrichProposals([row])[0];
  }

  async create(data: SessionProposalCreateInput): Promise<SessionProposal> {
    const id = nanoid();
    const createdTime = new Date().toISOString();
    this.db.transaction(() => {
      this.db
        .insert(schema.sessionProposals)
        .values({
          id,
          eventId: data.eventId,
          title: data.title,
          description: data.description ?? null,
          durationMinutes: data.durationMinutes ?? null,
          createdTime,
        })
        .run();
      for (const guestId of data.hostIds) {
        this.db
          .insert(schema.proposalHosts)
          .values({ proposalId: id, guestId })
          .run();
      }
    });
    return (await this.findById(id))!;
  }

  async update(
    id: string,
    patch: SessionProposalUpdateInput
  ): Promise<SessionProposal> {
    this.db.transaction(() => {
      const values: Partial<typeof schema.sessionProposals.$inferInsert> = {};
      if (patch.title !== undefined) values.title = patch.title;
      if (patch.description !== undefined)
        values.description = patch.description ?? null;
      if ("durationMinutes" in patch)
        values.durationMinutes = patch.durationMinutes ?? null;

      if (Object.keys(values).length > 0) {
        this.db
          .update(schema.sessionProposals)
          .set(values)
          .where(eq(schema.sessionProposals.id, id))
          .run();
      }

      if (patch.hostIds !== undefined) {
        this.db
          .delete(schema.proposalHosts)
          .where(eq(schema.proposalHosts.proposalId, id))
          .run();
        for (const guestId of patch.hostIds) {
          this.db
            .insert(schema.proposalHosts)
            .values({ proposalId: id, guestId })
            .run();
        }
        // Hosts can't vote for their own proposal; remove their votes.
        if (patch.hostIds.length > 0) {
          this.db
            .delete(schema.votes)
            .where(
              and(
                eq(schema.votes.proposalId, id),
                inArray(schema.votes.guestId, patch.hostIds)
              )
            )
            .run();
        }
      }
    });
    return (await this.findById(id))!;
  }

  async delete(id: string): Promise<void> {
    this.db.transaction(() => {
      this.db.delete(schema.votes).where(eq(schema.votes.proposalId, id)).run();
      this.db
        .delete(schema.proposalHosts)
        .where(eq(schema.proposalHosts.proposalId, id))
        .run();
      this.db
        .delete(schema.sessionProposals)
        .where(eq(schema.sessionProposals.id, id))
        .run();
    });
  }
}
