# ADR 0002: Testing strategy

- **Status:** Accepted
- **Date:** 2026-04-23

## Context

The app has end-to-end tests (Playwright) against three seeded events and no
other automated tests. Coverage of business rules — session overlap
validation, vote tallying, phase gating, timezone-aware session parsing — is
thin and lives only inside full browser flows. Several of these rules are
exactly the kind of logic that breaks quietly under refactor.

We want more confidence without the usual failure mode of a growing test
suite: tests that mirror implementation, fail on every rename, mock out the
interesting parts, and catch no real bugs. A test should fail when a user's
outcome changes, and ideally only then.

Constraints that shape the decision:

- Next.js 16 App Router, Drizzle + `better-sqlite3`, Bun, Playwright, strict
  TS. Repositories are already behind interfaces in
  `db/repositories/interfaces.ts`, which makes DB-backed tests cheap to set
  up.
- SQLite is the only supported datastore (see ADR 0001) and can run
  in-memory per test. There is no reason to mock it.
- Much of the interesting logic sits in server actions and API route
  handlers, not in pure functions. A strategy that only tests pure units
  will miss most of it.

## Decision

Three test layers, each with a distinct role. Tests go into the layer where
the behavior they protect actually lives.

### 1. Unit tests — Vitest, no I/O

For pure functions and isolated business rules: session overlap,
session-time parsing, duration/break math, slug helpers, vote→emoji
mapping, and similar. Fast, deterministic, no DB, no Next runtime.

### 2. Integration tests — Vitest + real SQLite `:memory:`

For server actions and API route handlers. Tests import the handler,
construct inputs a user's browser would produce (`FormData`, `Request`),
invoke the handler, and assert on the returned response. The repository
layer, validation, and the DB all run for real.

Post-condition state is verified through a read surface, not by inspecting
DB rows. In order of preference:

1. The corresponding GET endpoint or read action a user's browser would
   hit (e.g., create via `POST /api/add-vote`, verify via
   `GET /api/votes`).
2. The repository's read methods (e.g., `sessionsRepo.listByEvent`) — the
   same interface server components use to render the page. Use this when
   no HTTP read surface exists.
3. Direct DB row inspection — last resort, reserved for state that has no
   read surface at any layer.

This keeps tests coupled to externally observable behavior, not to the
table schema. Asserting on raw rows means a schema rename breaks the test
even when user-visible behavior is unchanged — the failure mode this ADR
is meant to avoid.

The only things mocked are the Next.js boundary primitives that don't
belong in a unit process: `redirect()` from `next/navigation` (recorded
instead of thrown) and `revalidatePath()` from `next/cache` (no-op).
Everything else — repos, schema, migrations, Drizzle, `better-sqlite3` —
is the real production code path.

### 3. End-to-end tests — Playwright, existing runner

For behavior that only manifests in a browser: routing, phase-dependent UI
rendering, modals, form interaction, mobile layout. Expanded to cover
user-facing flows that are not adequately reached by the other layers, not
used to duplicate what integration tests already check.

### Tooling

- **Vitest** (`bun x vitest`) for layers 1 and 2. Chosen over `bun test` for
  a larger Next.js/TS ecosystem, mature mocking surface (`vi.mock`), and
  better editor/CI tooling. Run speed difference is not material at this
  project's size. `bun test` would be reconsidered if Vitest's Next.js
  integration ever becomes a drag.
- **Playwright** unchanged.
- **Directory layout:**
  ```
  tests/
    e2e/          # Playwright (*.spec.ts) — existing specs moved here
    unit/         # Vitest (*.test.ts) — pure functions
    integration/  # Vitest (*.test.ts) — actions + API routes + real DB
    helpers/      # shared: DB setup, factories, Next.js mocks
  ```
  Separating by directory makes it obvious which runner owns each file and
  keeps Playwright config and Vitest config from having to share a
  `testMatch` pattern. Playwright `testDir` points to `tests/e2e/`;
  Vitest `include` covers `tests/unit/` and `tests/integration/`.
- **DB setup:** Vitest integration tests open an in-memory
  `better-sqlite3` DB and apply migrations from `drizzle/` at suite start.
  State is reset between tests. No shared fixtures across tests; each test
  builds the minimum entities it needs via a small factory helper.

### Coverage measurement

Coverage is collected on the Vitest layers (`@vitest/coverage-v8`). It
serves two roles:

1. **Discovery tool (always).** Run it to find completely uncovered
   modules or code paths that look risky. Ask whether the gap represents
   untested user-facing behavior. If yes, write a test; if no, move on.
   The right question is: _"What user-visible behavior would regress
   silently if we deleted this test?"_ A number cannot answer that; it
   can only point to places where we have not asked the question yet.

2. **CI floor (introduced gradually).** A minimum threshold — targeting
   roughly 80% line coverage — is added to CI once the initial test
   suite is in place. The threshold starts low (wherever the suite
   naturally lands after the first few rollout steps) and is raised in
   small increments as real tests are added. Its purpose is to catch
   obvious problems: a large new feature shipped with no tests, or tests
   accidentally deleted. It is not a target to optimise toward.

The Goodhart's law failure mode — writing tests purely to raise the
number — is treated as a defect. A suite that hits 90% by exercising
`voteChoiceToEmoji` repeatedly while leaving `validateSession` branch
logic uncovered has failed in the only way that matters. Code-review
should ask whether a test protects user-visible behaviour, not whether
it moves the percentage.

### What we deliberately do not do

- **No React component tests (RTL/JSDOM).** They tend to assert on
  component internals and break under refactor without catching
  user-visible regressions. Playwright covers UI behavior from the user's
  side. Revisit only if the E2E layer becomes too slow or too flaky to
  serve that role.
- **No mocked repositories in integration tests.** The point of the
  integration layer is that action → repo → DB actually runs. Mocking the
  repo interface turns these into slow unit tests that miss the bugs they
  exist to catch (migration/schema mismatches, wrong SQL, cascade
  surprises).
- **No snapshot tests.** Easy to write, easy to rubber-stamp, poor signal.
- **No coverage-percentage target to optimise toward.** A CI floor exists
  to catch obvious gaps (see "Coverage measurement"), but raising the number
  is not a valid reason to write a test. See "Coverage measurement" above.

## Alternatives considered

### Keep E2E-only and add more Playwright specs

- **Pros:** One runner, one mental model. Tests exercise the real stack.
- **Cons:** E2E is slow (order of seconds per test), flaky by nature of
  browsers, and a bad shape for enumerating the rule matrix of a
  validator. Driving 30 overlap cases through a browser is both painful
  to write and painful to debug. Rejected.

### React Testing Library for component-level tests

- **Pros:** Fast feedback on component logic; catches some bugs before
  E2E.
- **Cons:** In a Next.js App Router codebase with lots of server
  components and server actions, RTL forces mocking of `next/*` surfaces
  and client/server seams, and the tests that result mostly re-describe
  JSX rather than protect user-visible behavior. The failure mode we are
  trying to avoid — tests that change on every refactor — is exactly
  what RTL tends to produce here. Rejected for now; reconsider if E2E
  flakiness or cost becomes the bottleneck.

### Mock the repository interface in integration tests

- **Pros:** Faster; no DB setup.
- **Cons:** Hides some of the bugs the integration layer is meant to
  catch: schema drift, wrong SQL, cascade behavior, JSON/boolean encoding
  quirks, migration gaps. With `:memory:` SQLite available, the cost of
  real DB is negligible. Rejected.

### `bun test` instead of Vitest

- **Pros:** Native to the stack; zero config; fast.
- **Cons:** Smaller ecosystem for Next.js-shaped code, less mature
  mocking ergonomics, thinner editor/CI integration. The speed edge is
  immaterial at this project's size. Rejected as primary; would
  reconsider on a project that is unit-heavy and Bun-exclusive.

### Full unit coverage with a mocked DB layer

- **Pros:** Fastest possible suite.
- **Cons:** Pushes every bug class that crosses the action/repo/DB
  boundary out of the tested surface and into "hope E2E caught it".
  Rejected.

## Consequences

### Positive

- Business rules (overlap, phase gating, vote tallying) become cheap to
  enumerate at the unit/integration layer instead of being locked inside
  browser flows.
- Refactors are safer: unit tests pin rules, integration tests pin
  action→DB contracts, E2E pins user-facing flows. Each layer fails for
  a different reason, which is diagnostic signal rather than noise.
- Contributors get fast local feedback: `bun x vitest` in watch mode runs
  in under a second for the unit layer and a few seconds for the
  integration layer. Playwright stays for the full flow.
- The repository interface in `db/repositories/interfaces.ts` gains a
  second consumer (tests), which disciplines the interface itself.

### Negative / costs

- Two test runners instead of one. Developers need to remember which
  layer a given test belongs to. Mitigation: the `*.spec.ts` vs
  `*.test.ts` convention and the rule "if it talks to a browser, it's a
  spec; otherwise it's a test" resolve the common case.
- Integration tests have to set `DATABASE_URL` before the
  `getRepositories()` singleton first reads it, and reset the singleton
  between tests. Small helper; worth the extra plumbing. If this becomes
  painful, a lightweight DI refactor of `db/container.ts` is cheap.
- Mocking `next/navigation` and `next/cache` at the integration boundary
  is a small source of friction and must be re-evaluated if the Next.js
  App Router internals change materially in a future upgrade.

### Neutral / follow-ups

- Pre-commit runs `bun lint`, `bun format`, `bun typecheck`, and gains
  `bun x vitest run`. Playwright continues to run via `bun dev:test`
  (heavier, not part of the fast feedback loop).
- The existing Playwright seed in `tests/reset-database.ts` stays for
  E2E. Integration tests build per-test state and do not depend on it.
- When a bug is found in production, the default place to pin the
  regression is the integration layer (cheapest that still exercises the
  real stack), unless the bug is purely UI, in which case E2E. Unit tests
  are for rules, not for incident response.

## References

- ADR 0001 — datastore choice and repository interface shape.
- Vitest: <https://vitest.dev>
- Playwright: <https://playwright.dev>
- `better-sqlite3` in-memory mode: <https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md>
