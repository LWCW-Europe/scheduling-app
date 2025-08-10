# Database Migrations

This directory contains Airtable schema migrations that should be run when
deploying code changes.

## Migration Files

Each migration file should be named with a timestamp and descriptive name.

## Running Migrations

```bash
bun run dev:migrate:up    # Apply pending migrations
bun run dev:migrate:down  # Rollback last migration
bun run dev:migrate:status # Check migration status
```

## Creating Migrations

```bash
bun run dev:migrate:create add_new_field
```

## Migrations in production

```
node set-env.js staging bun run tsx migrations/cli/migrate-status.ts
node set-env.js staging bun run tsx migrations/cli/migrate-up.ts

node set-env.js production bun run tsx migrations/cli/migrate-status.ts
node set-env.js production bun run tsx migrations/cli/migrate-up.ts
```
