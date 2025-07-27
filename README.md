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