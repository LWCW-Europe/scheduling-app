# Contributing

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Database**: SQLite (better-sqlite3) with Drizzle ORM
- **Testing**: Playwright for E2E tests
- **Package Manager**: Bun

## Architecture

- **Frontend**: React components in `app/` using App Router
- **Database Layer**: `db/` — `schema.ts`, `container.ts`, repositories in `db/repositories/sqlite/`
- **API Routes**: Server actions in `app/actions/`, API routes in `app/api/`
- **Utils**: Shared utilities in `utils/`
- **Migrations**: Drizzle-managed SQL migrations in `migrations/`

## Development Commands

```bash
bun dev                      # Start dev server
bun lint                     # Lint
bun format                   # Format (writes in place)
bun typecheck                # Type check
bun dev:db:reset             # Reset database with test data
bun test:e2e                 # Run E2E tests
bun dev:migrate:create <name> # Generate migration from schema changes
bun dev:migrate:up           # Apply pending migrations
bun dev:migrate:status       # Check migration status
```

## Code Style

- TypeScript strict mode throughout
- Prefer server components; use server actions for mutations
- Tailwind CSS for all styling
- All UI must be mobile-responsive

## Testing

See [tests/README.md](tests/README.md) for full details.

E2E tests use Playwright:

- Imitate human behavior — click visible elements, navigate naturally
- Use semantic locators (`getByRole`, `getByText`, `getByLabel`), not IDs or CSS classes
- Navigate through the UI rather than jumping to URLs directly
- Tests run against a clean database (`bun dev:db:reset` seeds it)
- Use `login()` and `loginAndGoto()` from `tests/helpers/auth.ts`

Test data: 3 events (Alpha/Beta/Gamma) in different phases, with pre-created proposals, sessions, users, and auth.

## Version Control

- Use conventional commits (`feat:`, `fix:`, `docs:`, `refactor:`, etc.)
- Subject line ≤ 72 chars; explain WHY in the body if not obvious
- Before committing, run `bun lint`, `bun format`, and `bun typecheck`
- When working on a GitHub issue, add a footer: `issue #123` (partial work) or `fixes #123` (fully resolves it)
