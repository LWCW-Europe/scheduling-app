# Playwright Tests

This directory contains Playwright end-to-end tests.

## Setup

```bash
bun install
bun playwright install
```

- The tests assume the global password is `testtest` by default.
  Set it in your .env file with `SITE_PASSWORD`. You can override the password the tests use with `TEST_PASSWORD`.
- Tests expect the app to be running on `http://localhost:3000`
- The global setup automatically resets the database before each test run

## Generated Test Data

The tests run against a clean database with:

- **3 Events**: Alpha (proposal phase), Beta (voting phase), Gamma (scheduling phase)
- More test data. See the `reset-database.ts` script for details.

## Running Tests

**IMPORTANT!** These tests reset the database (Airtable) and are meant for
development purposes only. Do NOT run them against production data.

```bash
# Run all tests (headed) in the 'development' environment with DB reset
bun run dev:test
```

### Executing Specific Tests

If you have a `.env.local` file (or set the ENV variables some other way) then
you can run tests without the `set-env.js` helper.

Examples:

```bash
# Run tests (headless) using development env
node set-env.js development npx playwright test

# Run only proposals tests
node set-env.js development npx playwright test tests/proposals.spec.ts

# If you create a .env.test.local you can run with that instead
node set-env.js test npx playwright test

### Helpers

Common authentication helpers live in `tests/helpers/auth.ts` providing `login` & `loginAndGoto` to reduce repetition across specs.
```
