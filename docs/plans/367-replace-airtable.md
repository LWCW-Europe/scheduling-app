# Plan: Replace Airtable with SQLite

Tracking: [#367](https://github.com/LWCW-Europe/scheduling-app/issues/367)

## Recommended stack

- **ORM: Drizzle ORM** — TS-first schema, SQL-file migrations via
  `drizzle-kit`, lightweight, works cleanly in Next.js App Router without a
  binary engine.
- **SQLite driver: `better-sqlite3`** — Node, sync, fastest, standard choice.
- **Postgres:** not shipped in this change. Drizzle supports it through
  `pg-core` + the `postgres` (postgres.js) driver if we add it later.
- Rejected: Prisma, Kysely, TypeORM, MikroORM. See ADR for reasoning.

## Architecture

### Repository pattern, dependency-injected

All data access goes through a **Repository per aggregate**. The app
domain (everything outside `db/`) never sees an ORM object, a Drizzle
row type, or an Airtable record — only domain types returned by
repository methods.

- `db/repositories/interfaces.ts` — pure interfaces and domain types.
  The only file `app/**` imports from the data layer.
- `db/repositories/sqlite/*.ts` — Drizzle implementations. The only
  place `drizzle-orm/sqlite-core` row types appear outside
  `db/schema.ts`.
- `db/container.ts` — `getRepositories()` returns a bundle of
  repositories, cached as a process-level singleton. Call sites
  destructure what they need; `better-sqlite3` is sync and the
  `Database` handle is safe to share across requests.

### Domain model vs. database schema

The domain model (what `app/**` sees) and the database schema (what
`db/schema.ts` defines) are allowed to diverge. Repositories translate
between them. This keeps the domain shaped around app logic and the
schema shaped around storage, without one dragging the other around.

Apply DDD but also be pragmatic.

### Transactions

**A transaction stays inside a single repository method and covers
exactly one aggregate.** The container does not expose
`withTransaction(tx => …)`. If a feature seems to need an atomic write
across two repositories, treat that as a signal the aggregate
boundaries are wrong, not as a reason to plumb transactions through
the domain.

### Drizzle-specific pieces

- `db/schema.ts` — SQLite schema, single source of truth for storage.
- `db/client.ts` — instantiates Drizzle from `DATABASE_URL` (currently
  only `file:…`). Adding Postgres later extends this module and URL
  parsing; no call site changes.
- `drizzle/` — generated SQL migrations. A single initial migration
  creates the current-state schema; we do not replay Airtable-era
  history.
- `dev:migrate:{up,status,create}` map to `drizzle-kit` commands.

### Future directions (not part of this migration)

- If the domain layer grows, extract domain types and interfaces to a
  separate `domain/` package. Not worth the move today.
- Postgres support via a second client branch plus `db/schema.pg.ts`,
  behind the same repository interfaces.

## Schema mapping

One initial Drizzle migration creates all tables matching the current
Airtable shape:

- `guests`, `events`, `locations`, `days`, `sessions`, `rsvps`,
  `session_proposals`, `votes`. The old Airtable `migrations` tracking
  table is not recreated — Drizzle manages its own state in
  `__drizzle_migrations`.
- Link fields → FKs. Many-to-many relations (Events↔Guests,
  Events↔Locations, Sessions↔Hosts, Sessions↔Locations) → join tables,
  loaded as part of their parent aggregate.
- Airtable lookups/rollups (`Host name`, `Location name`, `Num RSVPs`,
  `votesCount`, `Event name`, `guestId`, `proposalId`) → computed in
  the repository layer via joins; domain types expose the fields app
  code actually needs, not a one-for-one of storage.
- IDs: `TEXT` primary keys generated with plain nanoid (no `rec`
  prefix).
- `filterByFormula` strings become Drizzle `where` clauses — which also
  fixes the SQL-injection-shaped string interpolation currently in
  `db/votes.ts`, `db/guests.ts`, and the inline queries in
  `app/api/toggle-rsvp/route.ts` and `app/api/delete-session/route.ts`.

## Work breakdown

Four stages, one commit each. Airtable and SQLite never both serve the
running app — no dual-backend runtime at any point.

### Stage 1 — Drizzle infrastructure (additive, no app changes)

- Add `drizzle-orm`, `better-sqlite3`, `drizzle-kit` dependencies.
- Add `db/schema.ts` with the full SQLite schema.
- Add `db/client.ts`, `drizzle.config.ts`.
- Generate the initial migration (`drizzle/0000_*.sql`).
- Add `DATABASE_URL` to `set-env.js` with SQLite defaults
  (`file:./data.db` dev, `file:./data.test.db` test).
- Airtable env vars and the Airtable-era `migrations/` tree untouched.
- App is unchanged, still runs on Airtable.

### Stage 2 — POC: standalone integration test against SQLite

- Add `db/repositories/interfaces.ts` seeded with `DaysRepository` and
  the `Day` domain type.
- Implement `db/repositories/sqlite/days.ts`.
- Add `tests/poc/sqlite-days.spec.ts`: fresh SQLite file, run
  `drizzle-kit migrate`, exercise CRUD through the interface, assert
  round-trip.
- No container, no app wiring, no Airtable env vars needed. App still
  runs on Airtable.
- Validates: Drizzle setup, migration flow, schema, interface seam,
  domain-types-only boundary, CI has a working SQLite path.

### Stage 3 — Implement remaining repositories (additive)

- Flesh out `db/repositories/interfaces.ts` with every aggregate's
  interface and domain type: `Event`, `Guest`, `Location`, `Session`
  (bundling hosts and locations), `Rsvp`, `SessionProposal`, `Vote`.
- Implement `db/repositories/sqlite/*.ts` for each, each with
  repository-level integration tests.
- Add `db/container.ts` with `getRepositories()`.
- `db/*.ts` Airtable files and `app/**` call sites untouched. The new
  repositories are dead code until stage 4.

### Stage 4 — Flip to SQLite, delete Airtable

- Migrate every call site in `app/**` to `getRepositories()`, including
  the inline Airtable queries in `app/api/toggle-rsvp/route.ts` and
  `app/api/delete-session/route.ts`. Rename Airtable-era field accesses
  (`"Location names"`, `"Host name"`, `Start`/`End` strings, …) to the
  idiomatic names defined on the new domain types.
- Rewrite `tests/reset-database.ts` as pure Drizzle inserts. Have
  `tests/init.ts` run `drizzle-kit migrate` then seed, using per-worker
  `data.test.${workerIndex}.db` files so Playwright's
  `fullyParallel: true` keeps working.
- Delete:
  - `airtable` package.
  - `db/db.ts` and every `db/*.ts` Airtable file.
  - `migrations/{cli,versions}/`, `migrations/runner.ts`,
    `migrations/schema-validator.ts`, `migrations/types.ts`,
    `migrations/README.md`.
  - `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID` from `set-env.js` and
    `.env.*.local`.
  - `docs/SCHEMA.md` (schema lives in `db/schema.ts`).
- Update `README.md` and deploy docs: Docker/self-host with a mounted
  volume for the SQLite file; backup guidance (`sqlite3 .backup`).

## Test strategy

- Playwright tests use per-worker SQLite files
  (`data.test.${workerIndex}.db`). `tests/init.ts` deletes stale
  files, runs `drizzle-kit migrate`, then seeds.
- Stage 2's POC test owns its own SQLite file and does not share
  fixtures with the Playwright suite.
- No mocks — integration tests hit real SQLite files.
- CI from stage 4 onward: no secrets, no network, no rate-limit flakes.

## Out of scope

- Admin backend replacement — tracked in [#368](https://github.com/LWCW-Europe/scheduling-app/issues/368).
- Data migration from existing Airtable bases — clean break (no
  production deployment to migrate).
- Postgres support — deliberately deferred.
- Extracting domain types to a separate `domain/` package — noted as a
  future direction.

## Resolved decisions

- **Four stages, no dual-backend runtime.** Airtable and SQLite never
  both serve the running app. Stage 1 is additive infra, stage 2 is a
  standalone POC test, stage 3 implements repositories without wiring
  them, stage 4 flips and deletes Airtable in one commit.
- **Repository pattern with DI; ORM types never leak.** Interfaces and
  domain types in `db/repositories/interfaces.ts` are the only surface
  `app/**` imports. Drizzle types stay inside
  `db/repositories/sqlite/*` and `db/schema.ts`.
- **Single `getRepositories()` bundle, process singleton.** Not
  per-aggregate accessors. Not per-request.
- **Transactions hidden inside repository methods, single-aggregate
  only.** No container-level `withTransaction`. Cross-aggregate
  atomicity is a modelling smell; fix the boundary.
- **Domain model may diverge from DB schema.** Repositories translate.
- **Domain-type fields use idiomatic TypeScript names.** No Airtable-era
  quoted keys with spaces, no date-as-string fields. Renames happen at
  the interface boundary in stage 3; call sites pick them up in stage 4.
- **`Session` bundles its host and location link rows.** One
  `SessionsRepository` owns the `sessions`, `session_hosts`, and
  `session_locations` tables; `Session` is returned with populated
  host and location projections via joins. `Guest` and `Location`
  remain their own aggregates and are mutated only through their own
  repositories.
- **Per-worker Playwright DB files.** `data.test.${workerIndex}.db`,
  keeps `fullyParallel: true`.
- **Clean break, no importer.**
- **SQLite only for now, Postgres-friendly structure.**
- **Plain nanoid IDs.** No `rec…` prefix.
- **SQLite file at `/var/lib/scheduling-app/data.db` in prod** (mounted
  volume); `./data.db` in dev; `./data.test.*.db` in tests.
