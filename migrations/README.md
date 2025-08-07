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
