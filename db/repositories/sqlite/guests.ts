import { eq } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { nanoid } from "nanoid";
import * as schema from "../../schema";
import type { Guest, GuestsRepository } from "../interfaces";

type DB = BetterSQLite3Database<typeof schema>;

function rowToGuest(row: typeof schema.guests.$inferSelect): Guest {
  return { id: row.id, name: row.name, email: row.email };
}

export class SqliteGuestsRepository implements GuestsRepository {
  constructor(private readonly db: DB) {}

  async list(): Promise<Guest[]> {
    return this.db.select().from(schema.guests).all().map(rowToGuest);
  }

  async listByEvent(eventId: string): Promise<Guest[]> {
    const rows = this.db
      .select({
        id: schema.guests.id,
        name: schema.guests.name,
        email: schema.guests.email,
      })
      .from(schema.guests)
      .innerJoin(
        schema.eventGuests,
        eq(schema.guests.id, schema.eventGuests.guestId)
      )
      .where(eq(schema.eventGuests.eventId, eventId))
      .all();
    return rows;
  }

  async findById(id: string): Promise<Guest | undefined> {
    const row = this.db
      .select()
      .from(schema.guests)
      .where(eq(schema.guests.id, id))
      .get();
    return row ? rowToGuest(row) : undefined;
  }

  async findByEmail(email: string): Promise<Guest | undefined> {
    const row = this.db
      .select()
      .from(schema.guests)
      .where(eq(schema.guests.email, email))
      .get();
    return row ? rowToGuest(row) : undefined;
  }

  async create(data: Omit<Guest, "id">): Promise<Guest> {
    const id = nanoid();
    this.db
      .insert(schema.guests)
      .values({ id, ...data })
      .run();
    return { id, ...data };
  }
}
