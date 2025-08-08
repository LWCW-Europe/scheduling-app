# LLM Agent Instructions

## Project Overview

This is a Next.js scheduling application for managing conference/event sessions with three phases: proposal, voting, and scheduling. The app uses Airtable as the database backend and is deployed on Vercel.

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Database**: Airtable
- **Testing**: Playwright for E2E tests
- **Package Manager**: Bun
- **Deployment**: Vercel

## Architecture

- **Frontend**: React components in `app/` directory using App Router
- **Database Layer**: TypeScript modules in `db/` directory
- **API Routes**: Server actions in `app/actions/` and API routes in `app/api/`
- **Utils**: Shared utilities in `utils/` directory
- **Migrations**: Database schema migrations in `migrations/`

## Key Features

### Event Phases

1. **Proposal Phase**: Users create session proposals
2. **Voting Phase**: Users vote on proposals (interested/maybe/skip)
3. **Scheduling Phase**: Convert proposals to scheduled sessions

### Core Entities

- Events with phase dates
- Session proposals with voting
- Scheduled sessions with locations/times
- Guests (users)
- RSVPs
- Votes (on session proposals)

## Development Guidelines

### Code Style

- Use TypeScript strict mode
- Follow Next.js App Router patterns
- Use Tailwind CSS for styling
- Prefer server components over client components
- Use server actions for mutations

### Environment Setup

Environment variables:

- `AIRTABLE_API_KEY`
- `AIRTABLE_BASE_ID`
- `SITE_PASSWORD` (optional, for site protection)
- `NEXT_PUBLIC_FOOTER_RIGHT_HTML` (optional)

### Database Migrations

- All Airtable schema changes require migrations
- Use `bun run dev:migrate:create <name>` to create new migrations
- Apply with `bun run dev:migrate:up`
- See `migrations/README.md` for details

### Development Commands

```bash
bun dev                    # Start development server
bun lint                   # Run linting
bun prettier               # Format code
bun run dev:db:reset       # Reset database with test data
bun run dev:test           # Run E2E tests
```

### Mobile Responsiveness

- Ensure all UI components are mobile-friendly
- Test on various screen sizes and orientations

## Testing Guidelines

### E2E Tests (Playwright)

- **Always imitate human behavior** - click visible elements, navigate naturally
- **Avoid technical selectors** - no IDs, CSS classes, or complex selectors
- **Use semantic locators** - `getByRole`, `getByText`, `getByLabel`
- **Avoid direct URL navigation** - navigate through UI interactions
- **Reset database before tests** - tests run against clean test data
- **Use authentication helpers** - `login()` and `loginAndGoto()` from `tests/helpers/auth.ts`

### Test Data

Tests run against generated test data:

- 3 test events (Alpha/Beta/Gamma) in different phases
- Pre-created proposals and sessions
- Test users and authentication

## Documentation Guidelines

### Writing Style

- **Be terse and to the point** - avoid verbose explanations
- Focus on essential information only
- Use bullet points and clear headings
- Include code examples when helpful
- Use emojis sparingly

### File Structure

- `README.md` - Main project documentation
- `docs/SCHEMA.md` - Database schema changes
- `tests/README.md` - Testing documentation
- `migrations/README.md` - Migration system docs

## Common Patterns

### Authentication

```typescript
// Server action pattern
import { getCurrentGuest } from "@/utils/auth";

export async function myAction() {
  const guest = await getCurrentGuest();
  if (!guest) redirect("/login");
  // ... action logic
}
```

### Database Operations

```typescript
// Use database modules from db/
import { getEvent } from "@/db/events";
import { createSession } from "@/db/sessions";
```

### Component Structure

```typescript
// Server component with data fetching
export default async function EventPage({ params }: { params: { eventSlug: string } }) {
  const event = await getEvent(params.eventSlug);
  if (!event) notFound();

  return <EventDisplay event={event} />;
}
```

## File Organization

### App Directory (`app/`)

- Page components and layouts
- Server actions (`actions/`)
- API routes (`api/`)
- Shared UI components

### Database Layer (`db/`)

- One file per entity (events.ts, sessions.ts, etc.)
- Type definitions and CRUD operations
- Airtable integration

### Utils (`utils/`)

- Authentication utilities
- Shared constants and helpers
- Git utilities for version display

## Deployment

- Deployed on Vercel
- Environment variables set in Vercel dashboard
- Automatic deployments from main branch
- Database migrations must be run manually after deployment

## Key Considerations

1. **Airtable Limitations**: Be aware of API rate limits and eventual consistency
2. **Authentication**: Site-wide password protection available via `SITE_PASSWORD`
3. **Phase Management**: Event phases control which features are available
4. **Time Zones**: Use proper timezone handling for event scheduling
5. **Mobile Responsive**: All UI must work on mobile devices
6. **E2E Testing**: Ensure tests imitate real user behavior
