import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "path";
import { fileURLToPath } from "url";
import * as schema from "./schema";
import { SqliteDaysRepository } from "./repositories/sqlite/days";
import { SqliteEventsRepository } from "./repositories/sqlite/events";
import { SqliteGuestsRepository } from "./repositories/sqlite/guests";
import { SqliteLocationsRepository } from "./repositories/sqlite/locations";
import { SqliteRsvpsRepository } from "./repositories/sqlite/rsvps";
import { SqliteSessionProposalsRepository } from "./repositories/sqlite/session-proposals";
import { SqliteSessionsRepository } from "./repositories/sqlite/sessions";
import { SqliteVotesRepository } from "./repositories/sqlite/votes";
import type {
  DaysRepository,
  EventsRepository,
  GuestsRepository,
  LocationsRepository,
  RsvpsRepository,
  SessionProposalsRepository,
  SessionsRepository,
  VotesRepository,
} from "./repositories/interfaces";

export type Repositories = {
  days: DaysRepository;
  events: EventsRepository;
  guests: GuestsRepository;
  locations: LocationsRepository;
  sessions: SessionsRepository;
  rsvps: RsvpsRepository;
  sessionProposals: SessionProposalsRepository;
  votes: VotesRepository;
};

const DEFAULT_DB_URL = "file:./data.db";

let _sqlite: Database.Database | null = null;
let _repositories: Repositories | null = null;

function buildRepositories(sqlite: Database.Database): Repositories {
  const db = drizzle(sqlite, { schema });
  return {
    days: new SqliteDaysRepository(db),
    events: new SqliteEventsRepository(db),
    guests: new SqliteGuestsRepository(db),
    locations: new SqliteLocationsRepository(db),
    sessions: new SqliteSessionsRepository(db),
    rsvps: new SqliteRsvpsRepository(db),
    sessionProposals: new SqliteSessionProposalsRepository(db),
    votes: new SqliteVotesRepository(db),
  };
}

export function getRepositories(): Repositories {
  if (!_repositories) {
    const url = process.env.DATABASE_URL ?? DEFAULT_DB_URL;
    _sqlite = new Database(url.replace(/^file:/, ""));
    const db = drizzle(_sqlite, { schema });
    const migrationsFolder = path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      "../drizzle"
    );
    migrate(db, { migrationsFolder });
    _repositories = buildRepositories(_sqlite);
  }
  return _repositories;
}

export function resetRepositories(): void {
  _sqlite = null;
  _repositories = null;
}

export function serializeDb(): Buffer {
  if (!_sqlite)
    throw new Error("DB not initialized — call getRepositories() first");
  return _sqlite.serialize();
}

export function restoreDb(snapshot: Buffer): void {
  _sqlite = new Database(snapshot);
  _repositories = buildRepositories(_sqlite);
}
