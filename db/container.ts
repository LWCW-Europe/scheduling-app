import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
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

let _repositories: Repositories | null = null;

export function getRepositories(): Repositories {
  if (!_repositories) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    const sqlite = new Database(url.replace(/^file:/, ""));
    const db = drizzle(sqlite, { schema });
    _repositories = {
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
  return _repositories;
}
