# Scheduling App

A web app for managing event scheduling — attendees can propose sessions, vote on them, and view the final schedule. Built with Next.js and Airtable as the backend.

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
- An [Airtable](https://airtable.com) base set up with the required schema (see [docs/SCHEMA.md](docs/SCHEMA.md))

### Setup

1. Clone the repo and install dependencies:

   ```bash
   bun install
   ```

2. Create `.env.development.local` with your credentials:

   ```bash
   AIRTABLE_API_KEY=your_airtable_api_key
   AIRTABLE_BASE_ID=your_airtable_base_id
   ```

3. Seed the development database:

   ```bash
   bun run dev:db:reset
   ```

4. Start the dev server:

   ```bash
   bun dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

### Required

| Variable           | Description                        |
| ------------------ | ---------------------------------- |
| `AIRTABLE_API_KEY` | Your Airtable personal access token |
| `AIRTABLE_BASE_ID` | The ID of your Airtable base        |

### Optional

| Variable                      | Description                                                                 |
| ----------------------------- | --------------------------------------------------------------------------- |
| `SITE_PASSWORD`               | Enables site-wide password protection. Omit to disable.                     |
| `NEXT_PUBLIC_FOOTER_RIGHT_HTML` | HTML for the right side of the footer (e.g. links to GitHub or a bug tracker). |

`NEXT_PUBLIC_` variables are exposed to the browser; all others are server-side only.

### Deploying to Vercel

Set the variables above in **Vercel Dashboard → Settings → Environment Variables**, then deploy.

## Event Phases

Events can progress through three optional phases:

| Phase        | What it enables                                                        |
| ------------ | ---------------------------------------------------------------------- |
| **Proposal** | Attendees submit and browse session proposals                          |
| **Voting**   | Attendees vote on proposals (votes hidden from hosts until scheduling) |
| **Scheduling** | Hosts see vote counts and can place sessions on the schedule grid    |

Phase dates are set directly on the Event record in Airtable. If no dates are set, the app skips phases and goes straight to scheduling. See [docs/SCHEMA.md](docs/SCHEMA.md) for the required Airtable fields.

## Development

```bash
bun lint       # lint
bun prettier   # format (writes changes in place)
```

### Database Migrations

When making Airtable schema changes, create a migration file as described in [migrations/README.md](migrations/README.md).

### Testing

See [tests/README.md](tests/README.md).

## License

MIT. See [LICENSE.txt](LICENSE.txt) and [LICENSING_HISTORY.md](LICENSING_HISTORY.md).
