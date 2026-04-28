import { eq } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { nanoid } from "nanoid";
import * as schema from "../../schema";
import type { Event, EventsRepository } from "../interfaces";

type DB = BetterSQLite3Database<typeof schema>;

function rowToEvent(row: typeof schema.events.$inferSelect): Event {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    website: row.website,
    start: new Date(row.start),
    end: new Date(row.end),
    proposalPhaseStart: row.proposalPhaseStart
      ? new Date(row.proposalPhaseStart)
      : undefined,
    proposalPhaseEnd: row.proposalPhaseEnd
      ? new Date(row.proposalPhaseEnd)
      : undefined,
    votingPhaseStart: row.votingPhaseStart
      ? new Date(row.votingPhaseStart)
      : undefined,
    votingPhaseEnd: row.votingPhaseEnd
      ? new Date(row.votingPhaseEnd)
      : undefined,
    schedulingPhaseStart: row.schedulingPhaseStart
      ? new Date(row.schedulingPhaseStart)
      : undefined,
    schedulingPhaseEnd: row.schedulingPhaseEnd
      ? new Date(row.schedulingPhaseEnd)
      : undefined,
    maxSessionDuration: row.maxSessionDuration,
    timezone: row.timezone,
    icon: row.icon ?? undefined,
  };
}

export class SqliteEventsRepository implements EventsRepository {
  constructor(private readonly db: DB) {}

  async list(): Promise<Event[]> {
    return this.db.select().from(schema.events).all().map(rowToEvent);
  }

  async findById(id: string): Promise<Event | undefined> {
    const row = this.db
      .select()
      .from(schema.events)
      .where(eq(schema.events.id, id))
      .get();
    return row ? rowToEvent(row) : undefined;
  }

  async findByName(name: string): Promise<Event | undefined> {
    const row = this.db
      .select()
      .from(schema.events)
      .where(eq(schema.events.name, name))
      .get();
    return row ? rowToEvent(row) : undefined;
  }

  async create(data: Omit<Event, "id">): Promise<Event> {
    const id = nanoid();
    this.db
      .insert(schema.events)
      .values({
        id,
        name: data.name,
        description: data.description,
        website: data.website,
        start: data.start.toISOString(),
        end: data.end.toISOString(),
        proposalPhaseStart: data.proposalPhaseStart?.toISOString() ?? null,
        proposalPhaseEnd: data.proposalPhaseEnd?.toISOString() ?? null,
        votingPhaseStart: data.votingPhaseStart?.toISOString() ?? null,
        votingPhaseEnd: data.votingPhaseEnd?.toISOString() ?? null,
        schedulingPhaseStart: data.schedulingPhaseStart?.toISOString() ?? null,
        schedulingPhaseEnd: data.schedulingPhaseEnd?.toISOString() ?? null,
        maxSessionDuration: data.maxSessionDuration,
        timezone: data.timezone,
        icon: data.icon ?? null,
      })
      .run();
    return { id, ...data };
  }
}
