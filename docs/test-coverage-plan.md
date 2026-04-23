# Test coverage plan

Working document to drive implementation. Progress is tracked via
checkboxes on each actionable item — an agent picking up the work should
continue from the first unchecked box. **Discard once every checkbox is
ticked off.** The durable record of _why_ this shape was chosen lives in
`docs/adr/0002-testing-strategy.md`.

## Commit discipline

- Bundle related checkboxes into one commit where the resulting change
  is a coherent unit (e.g., all Step 1 infra; all the unit-test files
  in Step 2). Split only when the bundle would mix unrelated concerns.
- Each commit updates the checkbox state of every box it checks off, in
  the same commit.
- Commit messages describe the behavior being added (e.g.,
  `test: pin session-overlap rules`) and **never** reference the step
  numbers or phase labels in this plan — those are internal bookkeeping
  and rot out of relevance once the plan is discarded.

## Shape at a glance

```
tests/
  e2e/            # Playwright (*.spec.ts) — existing specs moved here
  unit/           # Vitest (*.test.ts) — pure functions, no I/O
  integration/    # Vitest (*.test.ts) — real :memory: SQLite, real repos
  helpers/
    db.ts         # setupTestDb / resetTestDb
    factories.ts  # minimal-valid entity builders
    next-mocks.ts # vi.mock for next/navigation + next/cache
```

Move existing Playwright specs into `tests/e2e/` in Step 1 and update
`playwright.config.ts` `testDir` accordingly. Vitest `include` covers
`tests/unit/**` and `tests/integration/**`; it never touches `tests/e2e/`.

## Priorities

User-impact ranking drives ordering:

1. Session scheduling & overlap prevention
2. Phase gating
3. Voting & tallying
4. RSVP
5. Proposal CRUD

## Rollout

Each step independently shippable.

### Step 1 — Infra

- [ ] Move existing Playwright specs into `tests/e2e/`
      (`basic-sanity.spec.ts`, `proposals.spec.ts`, `voting.spec.ts`), plus
      `tests/init.ts` and `tests/reset-database.ts` (Playwright-only). Update
      `playwright.config.ts`: `testDir: "./tests/e2e"` and
      `globalSetup: "./tests/e2e/init.ts"`. No test logic changes.
- [ ] Add `vitest`, `@vitest/ui`, and `@vitest/coverage-v8` dev deps.
      Vitest config (`vitest.config.ts` at root): `include:
["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"]`,
      `environment: "node"`, `pool: "forks"` (clean module state per test
      file → lets each file get its own DB singleton), `coverage.provider:
"v8"`, `coverage.reporter: ["text", "lcov", "html"]`.
- [ ] Add scripts to `package.json`:
  - `"test": "bun x vitest run"` (unit + integration, used in pre-commit / CI)
  - `"test:unit": "bun x vitest run tests/unit"`
  - `"test:integration": "bun x vitest run tests/integration"`
  - `"test:watch": "bun x vitest"`
  - `"test:coverage": "bun x vitest run --coverage"` (on demand, not CI gate)
  - **Invocation:** always use `bun run test[:...]`. Plain `bun test` is
    intercepted by Bun's native test runner before it reads
    `package.json` scripts, so it would ignore these aliases.
- [ ] Update pre-commit / CI to run `bun run test` alongside `bun lint`,
      `bun format`, and `bun typecheck`. Keep Playwright on `bun dev:test`.
- [ ] `tests/helpers/db.ts`:
  - `setupTestDb()` — set `process.env.DATABASE_URL = "file::memory:"`,
    reset the `_repositories` singleton in `db/container.ts` (may need a
    small exported reset hook — add it in this step), call
    `getRepositories()` to trigger migrate.
  - `resetTestDb()` — called in `beforeEach`. Preferred: migrate once
    per test file, capture a snapshot with `better-sqlite3`'s
    `db.serialize()`, and restore from that buffer between tests
    (`new Database(snapshot)`). Faster than re-migrating and avoids
    hand-maintaining a FK-safe `DELETE FROM` order. Fall back to
    `DELETE FROM` only if the snapshot approach runs into trouble with
    the singleton wiring.
- [ ] `tests/helpers/factories.ts`:
  - `createEvent({ phase?: "proposal" | "voting" | "scheduling" })` —
    sets phase-window dates relative to now.
  - `createGuest`, `createLocation`, `createDay`, `createProposal`,
    `createSession` — each builds a minimal valid entity and returns it.
- [ ] `tests/helpers/next-mocks.ts`:
  - `vi.mock("next/navigation", ...)` exposing a recorded `redirect`.
  - `vi.mock("next/cache", ...)` no-op `revalidatePath`.
- [ ] Sanity check: one trivial `tests/unit/sanity.test.ts` and one
      `tests/integration/sanity.test.ts` that creates an event via a factory
      and reads it back through `eventsRepo.findById`.

### Step 2 — Pure unit tests (P1 support + quick wins)

- [ ] `tests/unit/session-overlap.test.ts` — `sessionsOverlap`:
  - No overlap when disjoint.
  - Back-to-back (end === start) does _not_ overlap.
  - Start-overlap, end-overlap, fully contained, fully containing — all
    overlap.
  - Same `id` on both sides → returns `false` (match is by `id`, not object
    identity).
  - `ses2.startTime` or `ses2.endTime` undefined → `false` (early-return
    guard). Pin current asymmetric behavior: when `ses1.startTime` /
    `ses1.endTime` are undefined they fall back to `0`, which can still
    yield overlap against a real interval. Document as-is; don't "fix" in
    the test.

- [ ] `tests/unit/session-validation.test.ts` — `validateSession`:
  - Valid session in empty schedule → accepted.
  - Same-location overlap (partial / contained / containing) → rejected.
  - Different-location overlap → accepted.
  - `start >= end` → rejected.
  - Start in the past → rejected.
  - Missing title / missing host / missing location → rejected.
  - Back-to-back in same location → accepted.
  - **Boundary-coincidence cases — all expected rejected; will currently
    fail (see finding #5):**
    - Identical interval, same location.
    - Same start, later end, same location.
    - Same end, earlier start, same location.

    Write these with the expected-correct assertion. They should fail
    until the overlap logic is fixed; mark with `test.fail()` plus a
    comment referencing finding #5 so the suite stays green in the
    meantime.

- [ ] `tests/unit/parse-session-time.test.ts`:
  - `10:00 AM`, `12:00 AM`, `12:00 PM`, `01:05 PM` — each parses and round-trips.
  - Minute padding for single-digit minutes.
  - _Pin current `-07:00` behavior_ — test documents it; bug is tracked
    separately.

- [ ] `tests/unit/utils.test.ts` — utility module:
  - `subtractBreakFromDuration`: 30 → 25, 60 → 55, 61 → 51, 120 → 110.
  - `formatDuration`: `45` short + long, `60`, `90`, `120` — both formats.
  - `eventNameToSlug` / `eventSlugToName`: simple names round-trip;
    document asymmetry (hyphen in name is lossy) with a test.
  - `dateOnDay`: before / on / after boundaries.
  - `getPercentThroughDay`: 0%, 50%, 100%.
  - `getNumHalfHours`: 0, 1, 2-hour windows.
  - `getEndTimeMinusBreak`: ≤60 and >60 both produce expected adjusted end.

- [ ] `tests/unit/votes.test.ts` — `voteChoiceToEmoji`: all three enum values.

### Step 3 — P1 integration: sessions

There is no `GET /api/sessions` endpoint, so post-condition state is
verified through `sessionsRepo.listByEvent` / `sessionsRepo.findById`
(the same read surface server components use to render the page — see
ADR "Integration tests"). Do **not** query Drizzle tables directly.

- [ ] `tests/integration/add-session.test.ts` — `POST /api/add-session`:
  - Happy path: response indicates success; listing sessions for the event
    finds one whose title, host set, location set, and time window match
    the request payload.
  - Rejects overlap in same location; listing sessions for the event
    afterwards returns the pre-existing session only.
  - Accepts overlap in _different_ location; listing shows both.
  - Rejects past start time.
  - Rejects missing title / missing host / missing location.
  - Malformed JSON → error response.

- [ ] `tests/integration/update-session.test.ts` — `POST /api/update-session`:
  - Changes time without conflict; re-fetched session reflects new times.
  - Moves to a colliding slot → rejected; re-fetched session is unchanged.
  - Does not "collide with itself" when re-saved unchanged.
  - Changes location / hosts / capacity; re-fetched session reflects each.

- [ ] `tests/integration/delete-session.test.ts` — `POST /api/delete-session`:
  - After delete, the session is absent from `listByEvent`.
  - After delete, `GET /api/rsvps` for guests who RSVPed no longer
    includes the deleted session (or: document current behavior if not).

Invocation pattern for API routes:

```ts
import { POST } from "@/app/api/add-session/route";
const req = new Request("http://test/api/add-session", {
  method: "POST",
  body: JSON.stringify(payload),
});
const res = await POST(req);
```

For server actions (e.g., `app/[eventSlug]/proposals/actions.ts`), import
the action directly and invoke it with `FormData` the form would submit:

```ts
import { createProposal } from "@/app/[eventSlug]/proposals/actions";
const fd = new FormData();
fd.set("title", "...");
const res = await createProposal(eventSlug, fd);
```

### Step 4 — P1 E2E: scheduling

- [ ] `tests/e2e/scheduling.spec.ts`:
  - In Conference Gamma: add a session via the UI → appears on the grid.
  - Edit a session's title → change persists after reload.
  - Delete a session → gone from grid.
  - Attempt overlapping session in same location → UI shows rejection,
    session not added.

### Step 5 — P2 phase gating

- [ ] `tests/integration/phase-gating.test.ts`:
  - Create events fixed in each phase via the factory.
  - Voting during proposal phase — expected rejected; if server accepts,
    that is a finding (see appendix of this plan).
  - Session creation during proposal phase / voting phase — expected rejected.
  - Proposal creation during voting / scheduling phase — expected rejected.

  Use `expect.soft` or tag findings with `test.fail()` + explanatory
  comment if the current server code does not enforce gating. Do **not**
  change the assertions to match broken behavior; record the finding.

- [ ] `tests/e2e/phases.spec.ts`:
  - Alpha (proposal): voting buttons absent or disabled.
  - Beta (voting): "Add Proposal" visible; "Add Session" not offered.
  - Gamma (scheduling): grid interactive; voting UI absent.

### Step 6 — P3 voting

Verification goes through `GET /api/votes` and
`sessionProposalsRepo.listByEvent` — not raw DB rows.

- [ ] `tests/integration/voting.test.ts`:
  - `POST /api/add-vote` creates vote for (guest, proposal); verified via
    `GET /api/votes`.
  - Repeated `add-vote` for same (guest, proposal) with different choice
    replaces, does not duplicate (sequential calls); `GET /api/votes`
    returns exactly one vote with the latest choice.
  - **Do not write an in-process "simultaneous requests" test for the race.**
    `better-sqlite3` is synchronous on a single connection, so
    `Promise.all([POST(a), POST(b)])` serializes and the race never
    appears. An in-process test would pass regardless of whether the
    server actually upserts. The race is still real in production (see
    appendix #2) — fix it at the server (`ON CONFLICT` upsert keyed on
    `(guestId, proposalId)`) and let the sequential-replace test cover
    the correctness claim.
  - `POST /api/delete-vote` removes one guest's vote only; verified via
    `GET /api/votes` for the deleting guest and a second guest.
  - `GET /api/votes` returns votes scoped to guest + event.
  - `sessionProposalsRepo.listByEvent` tallies reflect mixed interested/
    maybe/skip correctly.

- [ ] E2E: extend `tests/e2e/voting.spec.ts`:
  - Vote persists across reload.
  - Second user votes on same proposal; count visibly reflects both.
  - Leave the `waitForTimeout(1500)` in place until the race fix lands;
    do not add more.

### Step 7 — P4 RSVP

- [ ] `tests/integration/rsvp.test.ts`:
  - `POST /api/toggle-rsvp` adds when absent, removes when present;
    verified via `GET /api/rsvps` between toggles.
  - Idempotent per (guest, session) pair.
  - `GET /api/rsvps` returns current RSVPs for a guest.
  - Deleting a session removes its RSVPs (or flag current behavior);
    verified via `GET /api/rsvps`.

- [ ] `tests/e2e/rsvp.spec.ts`:
  - RSVP to a session in Gamma → reload → still there.
  - Un-RSVP → reload → gone.

### Step 8 — P5 proposals

These are server actions, not API routes — invoke via the pattern shown
in Step 3. There is no `GET /api/proposals` endpoint, so verification
goes through `sessionProposalsRepo.listByEvent` / `findById`.

- [ ] `tests/integration/proposals.test.ts`:
  - `createProposal`: happy path verified via `listByEvent`; missing
    title → `{ error }` and `listByEvent` unchanged; missing event →
    `{ error }`; hosts attached and readable via `findById`.
  - `updateProposal`: title / description / hosts / duration updatable
    (each verified via `findById`); removing all hosts works;
    `durationMinutes` can be cleared.
  - `deleteProposal`: proposal absent from `listByEvent` afterwards;
    votes for that proposal removed, verified via `GET /api/votes` for
    a guest who had voted (or flag current behavior).

- [ ] E2E: add a single delete-proposal flow to
      `tests/e2e/proposals.spec.ts`. Existing coverage is otherwise adequate.

## Coverage

### As a discovery tool (every step)

Run `bun run test:coverage` locally after completing each rollout step:

- Scan for **completely uncovered files** in `app/api/`, `app/actions/`,
  `db/repositories/`, and `utils/`. If untouched, ask whether it contains
  user-facing behavior that would fail silently.
- Scan for **uncovered branches** in `validateSession` and
  `parseSessionTime` — highest business risk.
- Ignore uncovered lines in `*.tsx`, `layout.tsx`, `page.tsx` stubs, and
  config files. Those are E2E territory and excluded from the Vitest report.
- Do not write tests just to raise a number. A boring gap (e.g., a
  formatter path nobody will hit) is fine to leave uncovered.

### As a CI floor (introduced after Step 3)

After the integration session tests land (Step 3), record the coverage
percentage and add it as the initial CI threshold, rounded down to the
nearest 5%. Raise it gradually as real tests land across subsequent
steps, with a rough final target of **80%** by the end of Step 8. Raise
only when a step materially added coverage of user-visible behavior —
don't bump the floor on a mechanical schedule.

The threshold is a floor — it fires when coverage _drops_ unexpectedly
(new code shipped without tests, tests deleted). It is not a target to
optimise toward. If a PR raises coverage by testing trivial helpers instead
of meaningful paths, that is a code-review problem, not a success.

## Guardrails (copy into reviewer checklist)

- A test that breaks on internal rename without changing user-visible
  behavior is a bad test. Rewrite or delete.
- Integration tests assert on response shape + state observed through a
  read surface. Order of preference: HTTP GET endpoint → server action
  read → repository read method. Raw DB row inspection only where no
  read surface exists at any layer.
- Never assert on call counts of internal helpers.
- Factories produce minimal entities; tests override only the fields
  they care about. If a test sets 12 fields, the factory is wrong.
- No cross-test state. Each test builds what it needs.
- If making a test pass requires reaching into a private, the test is
  wrong.

## Appendix — findings surfaced during planning

These are **not** in scope for this plan. Track separately.

1. **Hardcoded `-07:00` timezone** in `parseSessionTime`
   (`app/api/session-form-utils.ts:43`). All session start parsing
   assumes US Pacific. Real bug outside that timezone. Needs its own
   design (event-owned timezone? user browser? config?). Related unit
   tests pin the current behavior so the fix is a clean diff later.
2. **Voting race condition** hinted at by `waitForTimeout(1500)` in
   `tests/e2e/voting.spec.ts`. Server should upsert by
   `(guestId, proposalId)`. Note: an in-process integration test
   _cannot_ exercise this race — `better-sqlite3` is synchronous on a
   single connection, so concurrent `POST` invocations serialize. The
   race surfaces across real HTTP requests. Fix is still needed;
   regression coverage would have to come from E2E or a process-level
   harness.
3. **Phase enforcement may be UI-only.** Server actions and API routes
   did not appear to check event phase during exploration. If Step 5
   integration tests confirm this, it's a data-integrity gap, not a
   test bug.
4. **`eventSlugToName` is lossy** (`utils/utils.ts:27`). Hyphens in
   event names round-trip to spaces. Works today only because names
   don't contain `-`. Latent.
5. **`validateSession` misses boundary-coincidence overlaps**
   (`app/api/session-form-utils.ts:84`). The concurrent-session filter
   uses strict `<` / `>`, so when an existing session shares a start
   or end instant with the candidate, it is not flagged. Concretely:
   identical interval, same-start-longer-end, and same-end-earlier-start
   cases all pass validation at the same location. `sessionsOverlap`
   (`app/session_utils.ts:22`) uses the correct `maxStart < minEnd`
   idiom; the two should be reconciled. Step 2 `validateSession` tests
   pin the expected-correct behavior with `test.fail()` until the fix
   lands.
