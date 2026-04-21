# Project Instructions

## Project Overview

Next.js scheduling app for managing conference/event sessions with three phases: proposal, voting, and scheduling. Uses SQLite as the database backend.

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Database**: SQLite (better-sqlite3) with Drizzle ORM
- **Testing**: Playwright for E2E tests
- **Package Manager**: Bun
- **Deployment**: Docker on a VPS

## Architecture

- **Frontend**: React components in `app/` directory using App Router
- **Database Layer**: `db/` directory — `schema.ts`, `container.ts`, repositories in `db/repositories/sqlite/`
- **API Routes**: Server actions in `app/actions/` and API routes in `app/api/`
- **Utils**: Shared utilities in `utils/`
- **Migrations**: Drizzle-managed SQL migrations in `migrations/`

## Key Features

### Event Phases

1. **Proposal Phase**: Users create session proposals
2. **Voting Phase**: Users vote on proposals (interested/maybe/skip)
3. **Scheduling Phase**: Convert proposals to scheduled sessions

### Core Entities

- Events with phase dates
- Session proposals with voting
- Scheduled sessions with locations/times
- Guests (users), RSVPs, Votes

## Development Guidelines

### Code Style

- TypeScript strict mode
- Next.js App Router patterns
- Tailwind CSS for styling
- Prefer server components; use server actions for mutations

### Environment Setup

- `SQLITE_DB_PATH` — path to the SQLite database file
- `SITE_PASSWORD` (optional, for site protection)
- `NEXT_PUBLIC_FOOTER_RIGHT_HTML` (optional)

### Database Migrations

- Use Drizzle Kit to manage migrations
- `bun dev:migrate:create <name>` — generate new migration
- `bun dev:migrate:up` — apply migrations
- `bun dev:migrate:status` — check migration status

### Development Commands

```bash
bun dev                    # Start development server
bun lint                   # Run linting
bun format               # Format code
bun typecheck
bun dev:db:reset           # Reset database with test data
bun dev:test               # Run E2E tests
```

### Mobile Responsiveness

- Ensure all UI components are mobile-friendly

## Testing Guidelines

### E2E Tests (Playwright)

- **Imitate human behavior** — click visible elements, navigate naturally
- **Avoid technical selectors** — no IDs or CSS classes
- **Use semantic locators** — `getByRole`, `getByText`, `getByLabel`
- **Avoid direct URL navigation** — navigate through UI
- **Reset database before tests** — tests run against clean test data
- **Use auth helpers** — `login()` and `loginAndGoto()` from `tests/helpers/auth.ts`

### Test Data

- 3 test events (Alpha/Beta/Gamma) in different phases
- Pre-created proposals, sessions, users, and authentication

## Common Patterns

### Authentication

```typescript
import { getCurrentGuest } from "@/utils/auth";

export async function myAction() {
  const guest = await getCurrentGuest();
  if (!guest) redirect("/login");
}
```

### Database Operations

```typescript
import { getRepositories } from "@/db/container";

const { events, sessions } = getRepositories();
```

## File Organization

- `app/` — pages, layouts, server actions, API routes
- `db/` — schema, container, repository implementations
- `utils/` — auth utilities, shared helpers
- `migrations/` — Drizzle SQL migration files

## Deployment

- Deployed via Docker on a VPS
- Run migrations manually after deployment

## Key Considerations

1. **Authentication**: Site-wide password protection via `SITE_PASSWORD`
2. **Phase Management**: Event phases control available features
3. **Time Zones**: Use proper timezone handling for scheduling
4. **Mobile Responsive**: All UI must work on mobile
5. **E2E Testing**: Tests must imitate real user behavior

## Version Control

- Use `jj` (jujutsu) if available, otherwise `git`
- Use conventional commits (`feat:`, `fix:`, `docs:`, etc.)
- Subject line ≤ 72 chars: summarize WHAT; explain WHY in the body
- Before committing always run "bun lint", "bun format" and "bun typecheck"
- When working on a GitHub issue, include a footer in the commit message: `issue #123` (if partial work) or `fixes #123` (if the commit fully resolves it)
