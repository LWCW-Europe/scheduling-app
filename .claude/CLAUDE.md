# Project Instructions

Read [CONTRIBUTING.md](../CONTRIBUTING.md) for architecture, code style, common patterns, testing guidelines, and version control conventions.

## Project Overview

Next.js scheduling app for managing conference/event sessions with three phases: proposal, voting, and scheduling. Uses SQLite as the database backend.

## Key Considerations

1. **Authentication**: Site-wide password protection via `SITE_PASSWORD`
2. **Phase Management**: Event phases control available features
3. **Time Zones**: Use proper timezone handling for scheduling
4. **Mobile Responsive**: All UI must work on mobile
5. **E2E Testing**: Tests must imitate real user behavior — navigate through the UI by clicking visible elements and following links, not by constructing URLs with internal IDs (e.g. `?sessionID=`, `?proposalId=`). Never extract IDs from URLs or replay raw API payloads. Use semantic locators (`getByRole`, `getByLabel`, `getByText`) instead of CSS ID/class selectors.

## Version Control

- Use `jj` (jujutsu) if available, otherwise `git`
- Pre-commit: run `make check-and-format` to format, lint, type check, and run tests

## Testing

- Always run tests with `make test` (not `bun test`)
