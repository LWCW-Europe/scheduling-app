# ADR 0001: Replace Airtable with a SQL database

- **Status:** Accepted
- **Date:** 2026-04-16
- **Tracking issue:** [#367](https://github.com/LWCW-Europe/schelling-board/issues/367)

## Context

The app currently uses Airtable as its primary datastore. Airtable was a good
fit when the project began: no backend to run, a usable admin UI for free, and
quick schema tweaks through a spreadsheet. As the project has grown — and as
this fork moves away from Vercel toward self-hosted Docker/VPS deployment —
Airtable has become a net drag.

Concrete problems we hit regularly:

- **No local instance.** There is no way to spin up Airtable locally. Tests
  hit a shared remote base, which makes them slow, flaky and hard to isolate.
  Parallel test runs fight over the same rows.
- **Account and quota friction for contributors.** Every developer needs an
  Airtable account. The free tier is quickly exhausted, which is a real
  barrier for new contributors and for anyone running the app on their own.
- **No programmatic schema migrations.** Schema changes have to be made by
  hand in the Airtable UI. Our `migrations/versions/*.ts` files can only
  _document_ what a human needs to click through; they cannot apply a
  change. `migrations/runner.ts` is largely an elaborate check that the
  human did the right thing, with a long error-message path for when they
  did not.
- **No automated deployment path.** Standing up a new instance of the app
  requires manually creating a base, creating every table, and configuring
  every field. This is a significant barrier to self-hosting and has been
  raised by downstream users.
- **Rate limiting.** Airtable enforces per-base request limits that bite
  under test load and under moderate real traffic.
- **Query model mismatch.** We already work around Airtable's `filterByFormula`
  by building query strings with untrusted input (see `db/votes.ts`,
  `db/guests.ts`, and the inline queries in `app/api/toggle-rsvp/route.ts`
  and `app/api/delete-session/route.ts`) — a shape that would be a straight
  SQL injection in any real database. Lookups and rollups (`Host name`, `Num RSVPs`, `votesCount`,
  `guestId`, `proposalId`, …) exist only to compensate for Airtable's lack
  of joins.
- **Vendor lock-in to a service we are leaving.** The move to self-hosting
  removes the main reason the project tolerated Airtable in the first place
  (not running infrastructure).

Airtable's remaining value for us is the admin UI — editing event phase
dates, inspecting records, fixing bad data. That is a real loss, but it is
scoped and can be replaced independently; see "Consequences" below.

## Decision

Replace Airtable with a SQL database accessed through an ORM. The initial
and only supported target is **SQLite** via **Drizzle ORM**. The data
layer is structured so that adding **PostgreSQL** later is a contained
change (single schema file, single client module, no dialect-specific
SQL bleeding into call sites), but we do not ship or test Postgres in
this change.

Rationale for each piece:

- **SQL, not another hosted document store.** We need joins, transactions,
  real migrations, and a local-first story. SQL databases are the obvious
  shape for this data (events, sessions, guests, RSVPs, votes — all
  relational).
- **SQLite as the only target for now.** Zero-dependency, file-based,
  trivial to set up locally and in CI, and perfectly adequate for the
  load this app sees. It makes self-hosting a `docker run` with a
  mounted volume.
- **Postgres-friendly structure, deferred implementation.** Drizzle
  supports Postgres through a parallel ORM surface (`pg-core` vs
  `sqlite-core`), so adding it later should be a contained change: a
  second schema file, a branch in `db/client.ts`, a second migrations
  directory. We do not pay for that now — no second schema, no second
  CI job, no half-tested code path — but we avoid SQLite-only query
  idioms in call sites so the future port is contained, not a rewrite.
  We explicitly do not claim it will be _mechanical_: column types,
  defaults, JSON handling, `returning()` semantics, and boolean
  representation all differ between the two dialects and will need
  per-column review.
- **Drizzle ORM.** TS-first schema as the single source of truth (no
  `prisma generate`-style codegen step), SQL-file migrations via
  `drizzle-kit`, small bundle, good fit for Next.js App Router, and —
  via the `better-sqlite3` driver — a natural match for the Node-based
  Docker/VPS deployment we are moving to. The cross-dialect story is a
  latent option, not something we use today. Known rough edges we
  accept: SQLite's limited `ALTER TABLE` forces `drizzle-kit` into
  table-rebuild statements for some schema changes (documented, not
  hidden); the community and ecosystem are smaller than Prisma's;
  type-checking is heavier than Prisma's in very large schemas. None
  are blocking at this project's size.

## Alternatives considered

### Stay on Airtable

- **Pros:** Zero migration work. Keeps the free admin UI. No new moving
  parts in deployment.
- **Cons:** All the problems listed in "Context" remain — and get worse as
  the test suite and contributor base grow. Blocks the self-hosting goal.
- **Verdict:** Rejected. The reasons the project originally chose Airtable
  (no ops, free UI) no longer outweigh the friction.

### Another spreadsheet-style DB (NocoDB, Baserow, Supabase tables, Google Sheets)

- **Pros:** Preserves the "edit rows in a web UI" affordance. Some are
  self-hostable and free.
- **Cons:** Adds a second service to run and back up. Still a coarse API
  on top of SQL — we would inherit the same lookup/rollup workarounds, or
  end up bypassing the UI and talking to the underlying Postgres directly,
  at which point we have chosen Postgres with extra steps. Specific
  notes: **NocoDB** relicensed from AGPLv3 to BSL 1.1 in late 2024, which
  is not an OSI-approved open-source license; **Baserow** targets
  spreadsheet-style end users rather than apps that just need a
  relational DB, and is comparatively heavy to run locally and in
  production.
- **Verdict:** Rejected as a _primary_ datastore, and not recommended as
  a bundled admin UI either. See "Consequences" for the alternatives we
  do recommend for ad-hoc data editing.

### MongoDB / other document DB

- **Pros:** Schemaless feels closer to Airtable's "just add a field"
  ergonomics.
- **Cons:** Our data is clearly relational; we would reinvent joins and
  lose referential integrity. Another service to run. No win over SQL
  here.
- **Verdict:** Rejected.

### Alternative SQL databases

- **MySQL/MariaDB:** Fine, but offers nothing the SQLite-now /
  Postgres-later path does not, and the TS ecosystem around SQLite and
  Postgres is noticeably better.
- **DuckDB:** Excellent for analytics, wrong shape for an OLTP web app.
- **Verdict:** Stick with SQLite, leave room for Postgres.

### Alternative ORMs / query layers

- **Prisma.** Mature, great DX, largest community and tooling ecosystem
  of the options here. Historically we would have rejected it on the
  Rust query-engine binary (large client, cold-start and bundling pain),
  but Prisma 7 (late 2025) replaced that with a pure TS/WASM Query
  Compiler, which closes most of that gap. Remaining cons vs Drizzle:
  `schema.prisma` is a separate DSL that duplicates the TS types and
  requires a `prisma generate` step to keep them in sync (a recurring
  source of "why are my types wrong?"); the client is still several
  times larger than Drizzle's; and the `prisma migrate dev` / `deploy`
  workflow is heavier machinery than a single-file SQLite app needs.
  Rejected on fit, not on disqualification — Prisma is a credible
  alternative we could live with.
- **Kysely.** Excellent type-safe SQL query builder. It _does_ ship a
  programmatic migrator (`Kysely.Migrator`), so "no migration tool" is
  not quite fair — but it is deliberately not an ORM, so there is no
  schema DSL acting as source of truth. Table-row types must be
  hand-maintained or generated from the live database via a third-party
  codegen tool (e.g. `kysely-codegen`), and we would lose the automatic
  schema-diff → SQL flow that `drizzle-kit generate` gives us. Rejected
  as primary; reconsider if Drizzle disappoints, since Kysely's
  query-builder ergonomics are genuinely good.
- **TypeORM.** Decorator-heavy, weaker TS inference, relies on
  experimental decorators, and development pace has visibly slowed.
  Rejected.
- **MikroORM.** Actively maintained and arguably the most "correct" TS
  ORM (Data Mapper + Unit of Work + Identity Map). But the entity /
  decorator / `em.flush()` model is heavier than this app needs, and
  the runtime footprint is larger than Drizzle's. Rejected on fit.
- **Raw SQL + `better-sqlite3`/`postgres`.** Minimal dependencies,
  maximum control. Tempting for a project this size, but we would
  hand-write types for every row shape and lose the cross-dialect
  story. Rejected; if Drizzle is ever removed, this is the fallback.

### ID strategy

- **Switch to plain nanoid.** Chosen. This is a clean break: the project
  has no production deployment with durable external links to preserve,
  and keeping the `rec…` prefix would be cargo-culted Airtable vocabulary
  in a codebase that no longer uses Airtable.
- **Keep Airtable-style `rec…` IDs.** Rejected — preserves no value once
  we accept a clean-break migration.

## Consequences

### Positive

- Tests run fully locally against a fresh SQLite file. No shared state,
  no rate limits, no secrets in CI.
- Contributors can clone, `bun install`, and run the app with no
  Airtable account.
- Real, automated schema migrations. `dev:migrate:up` actually applies
  changes instead of printing instructions.
- Self-hosting becomes `docker run` + a mounted volume. Deployment docs
  shrink.
- `filterByFormula` string interpolation goes away; queries use
  parameterised Drizzle `where` clauses.
- Lookups/rollups collapse into ordinary joins; the fallback logic in
  `db/events.ts` and the error-distinguishing gymnastics in
  `migrations/runner.ts` are deleted.

### Negative / costs

- **One-time migration effort.** Every file in `db/` and every API route
  that calls `getBase()` has to be rewritten.
- **Loss of the free admin UI.** This is the real cost. Mitigations, in
  order of preference: (a) a minimal custom `/admin` route in the Next.js
  app for the handful of fields that actually need editing (event phase
  dates, occasional record fixes); (b) for operators who want generic
  row-level access, any standard SQLite tool works against the database
  file — e.g. `sqlite3` CLI, sqlite-web, DB Browser for SQLite, or
  DBeaver. Tracked in [#368](https://github.com/LWCW-Europe/schelling-board/issues/368).
- **Operators now run a database.** For SQLite this is "a file in a
  volume" and is close to free.
- **No live multi-user editing of raw data.** Airtable let multiple admins
  poke at rows simultaneously. In practice this has not been used much,
  and the replacement admin UI can cover the cases that matter.
- **Backups are now our problem.** Document `sqlite3 .backup` (or a
  volume snapshot) in the deploy docs.

### Neutral / follow-ups

- `docs/SCHEMA.md` is deleted; `db/schema.ts` becomes the source of truth.
- The existing `migrations/versions/*.ts` files and
  `migrations/runner.ts` / `schema-validator.ts` are deleted. Their
  only purpose was documenting Airtable schema changes a human had to
  apply by hand; git history preserves them for anyone who wants the
  archaeology. The new Drizzle migration history starts from the
  current-state schema as a single initial migration — we do not
  replay the Airtable-era migration sequence.
- The admin backend replacement is explicitly out of scope for this ADR
  and is tracked in [#368](https://github.com/LWCW-Europe/schelling-board/issues/368).

## References

- Issue [#367](https://github.com/LWCW-Europe/schelling-board/issues/367)
- Drizzle ORM: <https://orm.drizzle.team>
- Drizzle Kit migration system (SQLite `ALTER TABLE` limitations → table-rebuild statements): <https://deepwiki.com/drizzle-team/drizzle-orm/3.2-migration-system>
- `better-sqlite3`: <https://github.com/WiseLibs/better-sqlite3>
- Prisma 7 TS/WASM rewrite — architecture shift announcement: <https://www.prisma.io/blog/from-rust-to-typescript-a-new-chapter-for-prisma-orm>
- Prisma 7 performance benchmarks after removing the Rust engine: <https://www.prisma.io/blog/prisma-orm-without-rust-latest-performance-benchmarks>
- Kysely migrations (built-in programmatic `Migrator`): <https://kysely.dev/docs/migrations>
- Kysely vs Drizzle comparison (typed query builders): <https://marmelab.com/blog/2025/06/26/kysely-vs-drizzle.html>
- MikroORM competitive landscape (2026 self-assessment): <https://github.com/mikro-orm/mikro-orm/issues/7170>
- 2026 TypeScript ORM survey — Encore: <https://encore.cloud/resources/typescript-orms>
- 2026 Drizzle / Prisma / Kysely tier list: <https://www.pkgpulse.com/blog/prisma-vs-drizzle-vs-kysely-typescript-orm-tier-list>
