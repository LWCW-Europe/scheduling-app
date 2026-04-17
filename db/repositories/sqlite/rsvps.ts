import { and, eq, inArray } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { nanoid } from "nanoid";
import * as schema from "../../schema";
import type { Rsvp, RsvpsRepository } from "../interfaces";

type DB = BetterSQLite3Database<typeof schema>;

function rowToRsvp(row: typeof schema.rsvps.$inferSelect): Rsvp {
  return { id: row.id, sessionId: row.sessionId, guestId: row.guestId };
}

export class SqliteRsvpsRepository implements RsvpsRepository {
  constructor(private readonly db: DB) {}

  async listByGuest(guestId: string): Promise<Rsvp[]> {
    return this.db
      .select()
      .from(schema.rsvps)
      .where(eq(schema.rsvps.guestId, guestId))
      .all()
      .map(rowToRsvp);
  }

  async listBySession(sessionId: string): Promise<Rsvp[]> {
    return this.db
      .select()
      .from(schema.rsvps)
      .where(eq(schema.rsvps.sessionId, sessionId))
      .all()
      .map(rowToRsvp);
  }

  async create(data: { sessionId: string; guestId: string }): Promise<Rsvp> {
    const id = nanoid();
    this.db
      .insert(schema.rsvps)
      .values({ id, ...data })
      .run();
    return { id, ...data };
  }

  async deleteBySessionAndGuest(
    sessionId: string,
    guestId: string
  ): Promise<void> {
    this.db
      .delete(schema.rsvps)
      .where(
        and(
          eq(schema.rsvps.sessionId, sessionId),
          eq(schema.rsvps.guestId, guestId)
        )
      )
      .run();
  }

  async deleteBySessionAndGuests(
    sessionId: string,
    guestIds: string[]
  ): Promise<void> {
    if (guestIds.length === 0) return;
    this.db
      .delete(schema.rsvps)
      .where(
        and(
          eq(schema.rsvps.sessionId, sessionId),
          inArray(schema.rsvps.guestId, guestIds)
        )
      )
      .run();
  }
}
