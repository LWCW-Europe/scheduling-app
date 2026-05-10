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

## Getting Started

### Prerequisites

- Node.js / Bun

### Setup

1. Clone the repo and install dependencies:

   ```bash
   bun install
   ```

2. Create `.env.dev.local` with your database path:

   ```bash
   DATABASE_URL=file:./data.db
   ```

3. Run database migrations:

   ```bash
   bun dev:migrate:up
   ```

4. Seed the development database:

   ```bash
   bun dev:db:reset
   ```

5. Start the dev server:

   ```bash
   bun dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Admin CLI

Until a full admin UI is built ([#368](https://github.com/omarkohl/schellingboard/issues/368)), a terminal CLI is available for managing core records (events, guests, phase dates):

```bash
bun dev:admin
```

This opens an interactive menu to create, edit, and delete events and guests, and to set event phase dates.

To run against a different environment (e.g. production):

```bash
bun set-env.ts production tsx scripts/admin.ts
```

## Environment Variables

### Required

| Variable       | Description                                       |
| -------------- | ------------------------------------------------- |
| `DATABASE_URL` | SQLite database file path (e.g. `file:./data.db`) |

### Optional

| Variable        | Description                                                                                        |
| --------------- | -------------------------------------------------------------------------------------------------- |
| `SITE_PASSWORD` | Enables site-wide password protection. Omit to disable.                                            |
| `AUTH_SECRET`   | HMAC secret used to sign auth cookies. Required when `SITE_PASSWORD` is set. Use ≥32 random bytes. |

`NEXT_PUBLIC_` variables are exposed to the browser; all others are server-side only.

Generate a fresh `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

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
