# Scheduling App

A web app for managing event scheduling — attendees can propose sessions, vote on them, and view the final schedule. Built with Next.js and SQLite.

This is a public open-source fork of [rachelweinberg12/scheduling-app](https://github.com/rachelweinberg12/scheduling-app). Rachel Weinberg, the original author, does not wish to maintain a public open-source project herself but agreed to this fork serving that role. See [LICENSING_HISTORY.md](LICENSING_HISTORY.md) for details.

## Features

- **Session proposals** — attendees submit and browse session ideas
- **Voting** — attendees express interest (interested / maybe / skip) before the schedule is set
- **Scheduling board** — drag sessions onto a time/location grid
- **Event phases** — proposal, voting, and scheduling phases with configurable date ranges
- **Multi-event support** — host multiple events from one deployment
- **Site password protection** — optional single-password gate for the whole app

## Getting Started

### Prerequisites

- Node.js / Bun

### Setup

1. Clone the repo and install dependencies:

   ```bash
   bun install
   ```

2. Create `.env.development.local` with your database path:

   ```bash
   DATABASE_URL=file:./data.db
   ```

3. Run database migrations:

   ```bash
   bun run dev:migrate:up
   ```

4. Seed the development database:

   ```bash
   bun run dev:db:reset
   ```

5. Start the dev server:

   ```bash
   bun dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Next steps

```bash
bun playwright install   # install browser binaries for E2E tests (one-time)
bun run dev:test         # run E2E tests
bun lint                 # lint
bun run                  # list all available scripts
```

### Admin CLI

Until a full admin UI is built ([#368](https://github.com/omarkohl/scheduling-app/issues/368)), a terminal CLI is available for managing core records (events, guests, phase dates):

```bash
bun run dev:admin
```

This opens an interactive menu to create, edit, and delete events and guests, and to set event phase dates.

## Environment Variables

### Required

| Variable       | Description                                       |
| -------------- | ------------------------------------------------- |
| `DATABASE_URL` | SQLite database file path (e.g. `file:./data.db`) |

### Optional

| Variable                        | Description                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------ |
| `SITE_PASSWORD`                 | Enables site-wide password protection. Omit to disable.                        |
| `NEXT_PUBLIC_FOOTER_RIGHT_HTML` | HTML for the right side of the footer (e.g. links to GitHub or a bug tracker). |

`NEXT_PUBLIC_` variables are exposed to the browser; all others are server-side only.

### Deploying to Fly.io / Vercel

Set the variables above in your deployment platform's environment settings, then deploy.

## Event Phases

Events can progress through three optional phases:

| Phase          | What it enables                                                        |
| -------------- | ---------------------------------------------------------------------- |
| **Proposal**   | Attendees submit and browse session proposals                          |
| **Voting**     | Attendees vote on proposals (votes hidden from hosts until scheduling) |
| **Scheduling** | Hosts see vote counts and can place sessions on the schedule grid      |

Phase dates are set directly on the Event record in the database. If no dates are set, the app skips phases and goes straight to scheduling.

## Development

```bash
bun lint       # lint
bun prettier   # format (writes changes in place)
```

### Database Migrations

When changing the database schema, generate and run migrations:

```bash
bun run dev:migrate:create   # generate migration from schema changes
bun run dev:migrate:up       # apply pending migrations
```

### Testing

See [tests/README.md](tests/README.md).

## License

MIT. See [LICENSE.txt](LICENSE.txt) and [LICENSING_HISTORY.md](LICENSING_HISTORY.md).
