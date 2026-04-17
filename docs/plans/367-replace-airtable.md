# Plan: Replace Airtable with SQLite

Tracking: [#367](https://github.com/LWCW-Europe/scheduling-app/issues/367)

## Recommended stack

- **ORM: Drizzle ORM** — TS-first schema, SQL-file migrations via
  `drizzle-kit`, lightweight, works cleanly in Next.js App Router without a
  binary engine.
- **SQLite driver: `better-sqlite3`** — Node, sync, fastest, standard choice.
- **Postgres:** not shipped in this change. Drizzle supports it through
  `pg-core` + the `postgres` (postgres.js) driver if we add it later.
- Rejected: Prisma (credible after the Prisma 7 TS/WASM rewrite, but
  `schema.prisma` still duplicates types and needs `prisma generate`;
  heavier workflow than this app needs), Kysely (has a migrator but no
  schema DSL — row types must be hand-kept or codegen'd from the live
  DB), TypeORM (decorator-heavy, weaker TS, slowing down), MikroORM
  (heavier entity/UoW model than needed here). See ADR for full reasoning.

## Architecture

- New `db/client.ts` is the single place that instantiates Drizzle. It reads
  `DATABASE_URL` (currently only `file:…` accepted) and returns a `getDb()`
  handle. Adding Postgres later means extending this module and its URL
  parsing — no other file should need to change.
- New `db/schema.ts` holds the SQLite schema (`drizzle-orm/sqlite-core`) as the
  single source of truth. It is the only file that imports from `sqlite-core`,
  so a future Postgres schema can sit beside it as `db/schema.pg.ts` without
  touching call sites.
- Call sites in `db/*.ts` go through the Drizzle query builder only. No raw
  SQL, no SQLite-specific functions (`json_extract`, `GLOB`, `LIKE` with
  SQLite's default case-insensitive ASCII semantics, integer-booleans, etc.)
  leak into the data layer. Where a SQLite idiom is unavoidable it is isolated
  in a helper inside `db/` and documented as dialect-specific.
- The entire `migrations/` tree is deleted (`versions/*.ts`, `runner.ts`,
  `schema-validator.ts`). Drizzle migrations live in `drizzle/` as generated
  SQL, starting from a single initial migration that creates the current-state
  schema — we do not replay the Airtable-era migration history.
  `dev:migrate:{up,status,create}` map to `drizzle-kit` commands.
- Existing domain types in `db/*.ts` (`Guest`, `Event`, `Session`, …) are
  preserved so call sites in `app/**` barely change. Only the internal query
  bodies are rewritten.

## Schema mapping

One initial Drizzle migration creates all tables matching the current Airtable
shape:

- `guests`, `events`, `locations`, `days`, `sessions`, `rsvps`,
  `session_proposals`, `votes`. The old Airtable `migrations` tracking
  table is not recreated — Drizzle manages its own migration state in
  `__drizzle_migrations`.
- Link fields → FKs. Many-to-many relations (Events↔Guests, Events↔Locations,
  Sessions↔Hosts, Sessions↔Locations) → join tables.
- Airtable lookups/rollups (`Host name`, `Location name`, `Num RSVPs`,
  `votesCount`, `Event name`, `guestId`, `proposalId`) → computed in the query
  layer via joins; DTOs expose the same field names.
- IDs: `TEXT` primary keys generated with plain nanoid (no `rec` prefix).
  Existing `ID: string` typing stays intact; any `rec…`-assuming code is
  updated in the same pass.
- `filterByFormula` strings are replaced with Drizzle `where` clauses — which
  also fixes the SQL-injection-shaped string interpolation currently in
  `db/votes.ts` and `db/guests.ts`.

## Call sites to migrate

Everything touching `getBase()`:

- `db/{days,events,guests,locations,rsvps,sessions,sessionProposals,votes}.ts`
  — rewrite internals against Drizzle.
- `db/db.ts` — deleted; `getBase()` has no replacement.
- `app/api/{add-vote,update-session,add-session}/route.ts` — usually
  unchanged if domain types are preserved, confirm per route.
- `app/api/toggle-rsvp/route.ts`, `app/api/delete-session/route.ts` —
  contain their own inline Airtable queries (`filterByFormula` with
  string-interpolated input); rewrite against Drizzle, do not just
  re-check the signature.
- `tests/reset-database.ts` — rewritten as pure Drizzle inserts against a
  fresh SQLite file.
- `migrations/` — deleted wholesale, not ported.

Port one module at a time, run the Playwright suite against the new SQLite
backend after each.

## Test strategy

- Playwright tests get a fresh SQLite file per run: `tests/init.ts` deletes
  `data.test.db`, runs `drizzle-kit migrate`, then calls the rewritten
  `reset-database.ts` (now pure Drizzle inserts, no Airtable batching limits).
- No mocks — integration tests hit a real SQLite file, which is the whole point
  of the change.
- CI: no secrets, no network, no rate-limit flakes.

## Docs and env

- Remove `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID` from `set-env.js`, docs,
  examples.
- Add `DATABASE_URL` with SQLite default for dev (`file:./data.db`).
- Update `README.md` and deploy docs to describe Docker/self-host with a
  mounted volume for the SQLite file.
- `docs/SCHEMA.md` is deleted; `db/schema.ts` is the source of truth.

## Work breakdown

One big-bang PR, internally ordered as:

1. Add Drizzle + `better-sqlite3`, `db/schema.ts`, `db/client.ts`, initial
   migration, seed rewrite. Wire `dev:db:reset` to SQLite.
2. Port `db/guests.ts`, `db/locations.ts`, `db/days.ts` and their API callers.
3. Port `db/events.ts` (drop the fallback/phase-field error handling — it
   exists only because Airtable schema can drift).
4. Port `db/sessions.ts`, `db/rsvps.ts` and related API routes.
5. Port `db/sessionProposals.ts`, `db/votes.ts` and related API routes.
6. Delete the `airtable` package, the entire `migrations/` tree, and
   `getBase()`. Update docs.

## Out of scope

- Admin backend replacement — tracked in [#368](https://github.com/LWCW-Europe/scheduling-app/issues/368).
- Data migration from existing Airtable production bases — clean break, see resolved decisions.
- Postgres support — deliberately deferred; see resolved decisions.

## Resolved decisions

- **Clean break, no importer.** Existing deployments start fresh. No
  one-shot Airtable → SQLite migration tool.
- **SQLite only for now, Postgres-friendly encapsulation.** Ship SQLite
  as the only backend. Keep the data layer structured so a later
  Postgres port is contained: `db/client.ts` is the only place that
  instantiates a driver, `db/schema.ts` is the only file that imports
  from `sqlite-core`, and call sites use the Drizzle query builder
  without leaking SQLite-specific idioms. Rejected alternatives: a
  dialect factory (too much wrapping) and shipping two parallel
  schemas with a drift test (pays for a Postgres backend we do not
  actually run in CI).
- **Plain nanoid IDs.** Drop the Airtable `rec…` prefix.
- **SQLite file at `/var/lib/scheduling-app/data.db` in prod** (mounted
  volume); `./data.db` in dev; `./data.test.db` in tests, selected via
  `DATABASE_URL` in the test environment so tests never clobber a dev
  database. Revisit if the Docker/self-host layout changes.
- **Big-bang PR.** The Playwright suite gives enough coverage to port the
  whole data layer in one PR rather than running both backends behind a
  flag.
