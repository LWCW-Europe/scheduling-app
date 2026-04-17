import { and, count, eq, isNotNull } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { nanoid } from "nanoid";
import * as schema from "../../schema";
import type {
  Session,
  SessionCreateInput,
  SessionHost,
  SessionLocation,
  SessionsRepository,
  SessionUpdateInput,
} from "../interfaces";

type DB = BetterSQLite3Database<typeof schema>;
type SessionRow = typeof schema.sessions.$inferSelect;

function buildSessions(
  rows: SessionRow[],
  hostsBySession: Map<string, SessionHost[]>,
  locationsBySession: Map<string, SessionLocation[]>,
  rsvpCountBySession: Map<string, number>
): Session[] {
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    startTime: row.startTime ? new Date(row.startTime) : undefined,
    endTime: row.endTime ? new Date(row.endTime) : undefined,
    capacity: row.capacity,
    attendeeScheduled: row.attendeeScheduled,
    blocker: row.blocker,
    closed: row.closed,
    proposalId: row.proposalId ?? undefined,
    eventId: row.eventId ?? undefined,
    hosts: hostsBySession.get(row.id) ?? [],
    locations: locationsBySession.get(row.id) ?? [],
    numRsvps: rsvpCountBySession.get(row.id) ?? 0,
  }));
}

export class SqliteSessionsRepository implements SessionsRepository {
  constructor(private readonly db: DB) {}

  private enrichSessions(rows: SessionRow[]): Session[] {
    if (rows.length === 0) return [];

    const ids = rows.map((r) => r.id);

    const hostRows = this.db
      .select({
        sessionId: schema.sessionHosts.sessionId,
        id: schema.guests.id,
        name: schema.guests.name,
        email: schema.guests.email,
      })
      .from(schema.sessionHosts)
      .innerJoin(schema.guests, eq(schema.sessionHosts.guestId, schema.guests.id))
      .all()
      .filter((r) => ids.includes(r.sessionId));

    const locationRows = this.db
      .select({
        sessionId: schema.sessionLocations.sessionId,
        id: schema.locations.id,
        name: schema.locations.name,
        color: schema.locations.color,
      })
      .from(schema.sessionLocations)
      .innerJoin(
        schema.locations,
        eq(schema.sessionLocations.locationId, schema.locations.id)
      )
      .all()
      .filter((r) => ids.includes(r.sessionId));

    const rsvpRows = this.db
      .select({ sessionId: schema.rsvps.sessionId, cnt: count() })
      .from(schema.rsvps)
      .groupBy(schema.rsvps.sessionId)
      .all()
      .filter((r) => ids.includes(r.sessionId));

    const hostsBySession = new Map<string, SessionHost[]>();
    for (const r of hostRows) {
      const list = hostsBySession.get(r.sessionId) ?? [];
      list.push({ id: r.id, name: r.name, email: r.email });
      hostsBySession.set(r.sessionId, list);
    }

    const locationsBySession = new Map<string, SessionLocation[]>();
    for (const r of locationRows) {
      const list = locationsBySession.get(r.sessionId) ?? [];
      list.push({ id: r.id, name: r.name, color: r.color });
      locationsBySession.set(r.sessionId, list);
    }

    const rsvpCountBySession = new Map<string, number>();
    for (const r of rsvpRows) {
      rsvpCountBySession.set(r.sessionId, r.cnt);
    }

    return buildSessions(rows, hostsBySession, locationsBySession, rsvpCountBySession);
  }

  async list(): Promise<Session[]> {
    const rows = this.db.select().from(schema.sessions).all();
    return this.enrichSessions(rows);
  }

  async listScheduled(): Promise<Session[]> {
    const rows = this.db
      .select()
      .from(schema.sessions)
      .where(
        and(
          isNotNull(schema.sessions.startTime),
          isNotNull(schema.sessions.endTime)
        )
      )
      .all();
    return this.enrichSessions(rows);
  }

  async listByEvent(eventId: string): Promise<Session[]> {
    const rows = this.db
      .select()
      .from(schema.sessions)
      .where(eq(schema.sessions.eventId, eventId))
      .all();
    return this.enrichSessions(rows);
  }

  async listScheduledByEvent(eventId: string): Promise<Session[]> {
    const rows = this.db
      .select()
      .from(schema.sessions)
      .where(
        and(
          eq(schema.sessions.eventId, eventId),
          isNotNull(schema.sessions.startTime),
          isNotNull(schema.sessions.endTime)
        )
      )
      .all();
    return this.enrichSessions(rows);
  }

  async findById(id: string): Promise<Session | undefined> {
    const row = this.db
      .select()
      .from(schema.sessions)
      .where(eq(schema.sessions.id, id))
      .get();
    if (!row) return undefined;
    return this.enrichSessions([row])[0];
  }

  async create(data: SessionCreateInput): Promise<Session> {
    const id = nanoid();
    this.db.transaction(() => {
      this.db
        .insert(schema.sessions)
        .values({
          id,
          title: data.title,
          description: data.description,
          startTime: data.startTime?.toISOString() ?? null,
          endTime: data.endTime?.toISOString() ?? null,
          capacity: data.capacity,
          attendeeScheduled: data.attendeeScheduled,
          blocker: data.blocker,
          closed: data.closed,
          proposalId: data.proposalId ?? null,
          eventId: data.eventId ?? null,
        })
        .run();

      for (const guestId of data.hostIds) {
        this.db
          .insert(schema.sessionHosts)
          .values({ sessionId: id, guestId })
          .run();
      }
      for (const locationId of data.locationIds) {
        this.db
          .insert(schema.sessionLocations)
          .values({ sessionId: id, locationId })
          .run();
      }
    });
    return (await this.findById(id))!;
  }

  async update(id: string, patch: SessionUpdateInput): Promise<Session> {
    this.db.transaction(() => {
      const values: Partial<typeof schema.sessions.$inferInsert> = {};
      if (patch.title !== undefined) values.title = patch.title;
      if (patch.description !== undefined) values.description = patch.description;
      if ("startTime" in patch)
        values.startTime = patch.startTime?.toISOString() ?? null;
      if ("endTime" in patch)
        values.endTime = patch.endTime?.toISOString() ?? null;
      if (patch.capacity !== undefined) values.capacity = patch.capacity;
      if (patch.attendeeScheduled !== undefined)
        values.attendeeScheduled = patch.attendeeScheduled;
      if (patch.blocker !== undefined) values.blocker = patch.blocker;
      if (patch.closed !== undefined) values.closed = patch.closed;
      if ("proposalId" in patch)
        values.proposalId = patch.proposalId ?? null;
      if ("eventId" in patch) values.eventId = patch.eventId ?? null;

      if (Object.keys(values).length > 0) {
        this.db
          .update(schema.sessions)
          .set(values)
          .where(eq(schema.sessions.id, id))
          .run();
      }

      if (patch.hostIds !== undefined) {
        this.db
          .delete(schema.sessionHosts)
          .where(eq(schema.sessionHosts.sessionId, id))
          .run();
        for (const guestId of patch.hostIds) {
          this.db
            .insert(schema.sessionHosts)
            .values({ sessionId: id, guestId })
            .run();
        }
      }

      if (patch.locationIds !== undefined) {
        this.db
          .delete(schema.sessionLocations)
          .where(eq(schema.sessionLocations.sessionId, id))
          .run();
        for (const locationId of patch.locationIds) {
          this.db
            .insert(schema.sessionLocations)
            .values({ sessionId: id, locationId })
            .run();
        }
      }
    });
    return (await this.findById(id))!;
  }

  async delete(id: string): Promise<void> {
    this.db.transaction(() => {
      this.db
        .delete(schema.rsvps)
        .where(eq(schema.rsvps.sessionId, id))
        .run();
      this.db
        .delete(schema.sessionHosts)
        .where(eq(schema.sessionHosts.sessionId, id))
        .run();
      this.db
        .delete(schema.sessionLocations)
        .where(eq(schema.sessionLocations.sessionId, id))
        .run();
      this.db
        .delete(schema.sessions)
        .where(eq(schema.sessions.id, id))
        .run();
    });
  }
}
