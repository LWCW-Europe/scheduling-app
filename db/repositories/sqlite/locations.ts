import { and, eq } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { nanoid } from "nanoid";
import * as schema from "../../schema";
import type { Location, LocationsRepository } from "../interfaces";

type DB = BetterSQLite3Database<typeof schema>;

function rowToLocation(row: typeof schema.locations.$inferSelect): Location {
  return {
    id: row.id,
    name: row.name,
    imageUrl: row.imageUrl,
    description: row.description,
    capacity: row.capacity,
    color: row.color,
    hidden: row.hidden,
    bookable: row.bookable,
    sortIndex: row.sortIndex,
    areaDescription: row.areaDescription ?? undefined,
  };
}

export class SqliteLocationsRepository implements LocationsRepository {
  constructor(private readonly db: DB) {}

  async listVisible(): Promise<Location[]> {
    return this.db
      .select()
      .from(schema.locations)
      .where(eq(schema.locations.hidden, false))
      .orderBy(schema.locations.sortIndex)
      .all()
      .map(rowToLocation);
  }

  async listBookable(): Promise<Location[]> {
    return this.db
      .select()
      .from(schema.locations)
      .where(
        and(
          eq(schema.locations.hidden, false),
          eq(schema.locations.bookable, true)
        )
      )
      .orderBy(schema.locations.sortIndex)
      .all()
      .map(rowToLocation);
  }

  async findById(id: string): Promise<Location | undefined> {
    const row = this.db
      .select()
      .from(schema.locations)
      .where(eq(schema.locations.id, id))
      .get();
    return row ? rowToLocation(row) : undefined;
  }

  async create(data: Omit<Location, "id">): Promise<Location> {
    const id = nanoid();
    this.db
      .insert(schema.locations)
      .values({
        id,
        name: data.name,
        imageUrl: data.imageUrl,
        description: data.description,
        capacity: data.capacity,
        color: data.color,
        hidden: data.hidden,
        bookable: data.bookable,
        sortIndex: data.sortIndex,
        areaDescription: data.areaDescription ?? null,
      })
      .run();
    return { id, ...data };
  }
}
