# Playwright Tests

This directory contains Playwright end-to-end tests.

## Setup

```bash
bun install
bun playwright install
```

- The tests assume the global password is `testtest` for authentication.
  Remember to set it in your .env file with the variable `SITE_PASSWORD`.
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
# Run tests with development environment
npm run dev:test
```
