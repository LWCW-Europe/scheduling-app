# Playwright Tests

This directory contains Playwright end-to-end tests.

## Setup

```bash
bun install
bun playwright install
```

The test environment is pre-configured via `.env.test` (committed):

- `SITE_PASSWORD=testtest` — used by tests automatically; override with `TEST_PASSWORD`
- `DATABASE_URL=file:./data.test.db` — isolated test database, separate from dev

## Running Tests

**IMPORTANT!** Tests reset the database before each run. Do NOT run against production data.

```bash
bun test:e2e
```

This resets the test database, starts the app with the test env, and runs all tests headed.

### Running specific tests

```bash
# Run a single spec
bun set-env.ts test bun x playwright test tests/proposals.spec.ts

# Run headless
bun set-env.ts test bun x playwright test --headed=false
```

### Running against a different environment

You can substitute any env mode — for example `dev` to run against your dev database:

```bash
bun set-env.ts dev bun x playwright test
```

This loads `.env.dev.local` (or `.env.dev`) instead of `.env.test`, so `DATABASE_URL` and `SITE_PASSWORD` are taken from that file. **The database will still be reset**, so don't point this at data you care about.

## Test Data

Each run starts from a clean database with:

- **3 events**: Alpha (proposal phase), Beta (voting phase), Gamma (scheduling phase)
- Guests, proposals, votes, sessions — see `reset-database.ts` for details

## Helpers

`tests/helpers/auth.ts` provides `login` and `loginAndGoto` to reduce repetition across specs.
