import { eq } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { nanoid } from "nanoid";
import * as schema from "../../schema";
import type { Day, DaysRepository } from "../interfaces";

type DB = BetterSQLite3Database<typeof schema>;

function rowToDay(row: typeof schema.days.$inferSelect): Day {
  return {
    id: row.id,
    start: new Date(row.start),
    end: new Date(row.end),
    startBookings: new Date(row.startBookings),
    endBookings: new Date(row.endBookings),
    eventId: row.eventId ?? undefined,
  };
}

export class SqliteDaysRepository implements DaysRepository {
  constructor(private readonly db: DB) {}

  async list(): Promise<Day[]> {
    const rows = this.db.select().from(schema.days).all();
    return rows
      .map(rowToDay)
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }

  async listByEvent(eventId: string): Promise<Day[]> {
    const rows = this.db
      .select()
      .from(schema.days)
      .where(eq(schema.days.eventId, eventId))
      .all();
    return rows
      .map(rowToDay)
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }

  async findById(id: string): Promise<Day | undefined> {
    const row = this.db
      .select()
      .from(schema.days)
      .where(eq(schema.days.id, id))
      .get();
    return row ? rowToDay(row) : undefined;
  }

  async create(data: Omit<Day, "id">): Promise<Day> {
    const id = nanoid();
    this.db
      .insert(schema.days)
      .values({
        id,
        start: data.start.toISOString(),
        end: data.end.toISOString(),
        startBookings: data.startBookings.toISOString(),
        endBookings: data.endBookings.toISOString(),
        eventId: data.eventId ?? null,
      })
      .run();
    return { id, ...data };
  }
}
