## Licensing

We're still figuring out a system for licensing this app. For now, if you use the app for an event you run, please consider donating to my personal [Manifund regranting balance](https://manifund.org/Rachel) — this is a tax-deductible donation for you, and will provide me with funds that I'll send to charitable projects I think are impactful.

I'd suggest a donation of **$5 per attendee of your event.** If you do donate and would like guidance for setting up the app, you can email me at **rachel.weinberg12@gmail.com** and I can send you the docs that describe how to set up your Airtable base and constants, and/or hop on a call to answer any setup questions you have.

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Environment Variables

The application uses environment variables for configuration. Create the following files for different environments:

- `.env.development.local` - for local development
- `.env.production.local` - for production builds
- `.env.test.local` - for testing

### Required Variables

```bash
AIRTABLE_API_KEY=your_airtable_api_key
AIRTABLE_BASE_ID=your_airtable_base_id
```

### Optional Variables

#### Site Protection

You can add basic password protection to your entire site:

```bash
# Site-wide password protection (leave unset to disable protection)
SITE_PASSWORD=your_secure_password
```

When `SITE_PASSWORD` is set, users must enter this password to access any part of the application. The authentication persists for 7 days via secure cookies. If this variable is not set, no protection is applied (useful for development).

#### Footer Configuration

You can customize the footer content that appears on the right side next to the version information:

```bash
# Footer right content (HTML supported)
NEXT_PUBLIC_FOOTER_RIGHT_HTML='<a href="https://github.com/yourusername/your-repo" target="_blank" rel="noopener noreferrer" class="text-gray-500 hover:text-gray-700 underline">GitHub</a> | <a href="mailto:support@yourdomain.com" class="text-gray-500 hover:text-gray-700 underline">Report Bug</a>'
```

**Examples:**

- Simple link: `NEXT_PUBLIC_FOOTER_RIGHT_HTML='<a href="https://github.com/user/repo" target="_blank">GitHub</a>'`
- Multiple links: `NEXT_PUBLIC_FOOTER_RIGHT_HTML='<a href="https://github.com/user/repo">GitHub</a> | <a href="mailto:bugs@example.com">Support</a>'`
- Plain text: `NEXT_PUBLIC_FOOTER_RIGHT_HTML='© 2025 Your Organization'`

If not set, only the version information will be displayed in the footer.

### Setting Environment Variables on Vercel

When deploying to Vercel, set your environment variables in the Vercel dashboard:

1. Go to your project in the [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to **Settings** → **Environment Variables**
3. Add the required variables:
   - `AIRTABLE_API_KEY` (keep this secret)
   - `AIRTABLE_BASE_ID`
   - `SITE_PASSWORD` (optional, for site protection)
   - `NEXT_PUBLIC_FOOTER_RIGHT_HTML` (optional)
4. Set the appropriate environment (Production, Preview, Development)
5. Deploy your application

**Note:** Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser, while others remain server-side only.

## Event Phases

It is possible to have multiple phases for your event to enable hosts to get
feedback on their session ideas.

There are three such phases:

- Proposal Phase: Users can create session proposals and others can view them.
- Voting Phase: Users can indicate interest in session proposals. This is not
  yet visible to the hosts of the proposals. It makes sense for proposals to
  keep going during voting.
- Scheduling Phase: Hosts can view how many people were interested in their
  sessions. Also, the sessions board is unlocked, making it possible to turn
  your proposals into planned sessions.

In order to have these phases, you need to set their dates on the corresponding
Event record. The way to do that is to edit Airtable manually. If none are set
then there are no phases (i.e. sessions can be scheduled, that's it).

You need to add the following columns to the Event table in your Airtable base:

- `proposalPhaseStart`: Date, format ISO, Include time, Display time zone
- `proposalPhaseEnd`: (same)
- `votingPhaseStart`: (same)
- `votingPhaseEnd`: (same)
- `schedulingPhaseStart`: (same)
- `schedulingPhaseEnd`: (same)

You also need to add a SessionProposals table to your Airtable base:

- Create a new table named "SessionProposals"
- Add the following fields:
  - `id`: Primary field, type "Formula", formula is `RECORD_ID()
  - `description`: Long text
  - `durationMinutes`: Number
  - `event`: Link to another record (Events),
    "Allow linking to multiple records" **unchecked**
  - `hosts`: Link to another record (Guests),
    "Allow linking to multiple records" **checked**
  - `title`: Single line text (Primary field)

## Development

Lint and run prettier locally. Note that `prettier` is configured so that it
automatically writes changes to the files.

```
bun lint
bun prettier
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## Testing

To run integration tests, start the app on localhost:3000 and then run:

```bash
npm run test
# or
npx playwright test
```

The tests expect specific values to be in the database. To set up a test database instance, run `tests/init.ts`. This will overwrite the entire database, so it is recommended to use a different airtable database specified in .env.test.local.
