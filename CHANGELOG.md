# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [2.0.0] - 2025-08-29

The version number 2.0.0 is a retroactive label assigned here purely as a reference point — it was never designated as such. It is chosen to signal the significant deviation from the upstream baseline accumulated since the fork was created.

This version corresponds to commit [9aa2a273](https://github.com/LWCW-Europe/scheduling-app/commit/9aa2a273). It was never properly released since it was deployed directly from the Git repository.

### Added

- **Session proposals**: Attendees can submit session ideas (title, description, duration, hosts) before scheduling begins
- **Voting on proposals**: Three-option voting (interested / maybe / skip) with vote counts displayed in a sortable table during and after the voting phase
- **Event phases**: Configurable proposal, voting, and scheduling phases that control which features are active at any given time
- **Site-wide password authentication**: Optional single-password gate to restrict access to the entire app
- **RSVP clash detection**: Users are warned when RSVPing to a session that overlaps with another they are already attending or hosting
- **Blocker sessions**: Organizers can place fixed, non-attendable blocks on the schedule (e.g. meals) that reserve time slots
- **Closed sessions**: Sessions can be marked as closed (no latecomers)
- **Session attendee list**: Session details show the full list of people who RSVPd
- **Break enforcement**: Sessions display 5 minutes shorter (10 for sessions > 60 min) to reserve break time; stored duration is unchanged
- **Proposal-to-session linking**: Sessions created from a proposal retain the link, navigable in both directions
- **Schedule-from-proposal button**: Proposals can be directly scheduled from the proposals view, pre-filling the session form
- **Session details modal**: Clicking a session opens a modal with full details plus dedicated RSVP and Edit buttons
- **Host icon on session blocks**: Session blocks show a distinct icon when the current user is the host (vs. just attending)
- **Session location badge**: Location shown as a badge directly on schedule session blocks
- **Proposal table sorting**: Sort by vote count, creation time, duration, and more — on both desktop and mobile
- **Quick voting**: Streamlined voting directly from the proposals list without opening each proposal individually
- **Footer with build info**: Configurable footer displaying the commit hash and other deployment metadata

### Changed

- Session blocks: clicking anywhere opens session details; clicking the RSVP count in the corner RSVPs/un-RSVPs
- Session form pre-fills the current user as host when creating a new session
- Improved mobile layout throughout (reduced padding, better button sizing, no fixed footer on landscape phones)
- User selector closes automatically after a selection when only a single user can be chosen

### Fixed

- RSVP toggle bug: clicking RSVP was adding a duplicate entry instead of toggling
- Un-RSVP not decrementing the displayed RSVP count
- RSVPing broken on mobile (tapping a session block was opening the user-select modal instead)
- Session creation crashing when the current user had an RSVP in a different event
- Session clash validation incorrectly including sessions from the next calendar day
- Session clash validation incorrectly flagging sessions from different events
- Schedule grid breaking when 13 or more locations were shown (Tailwind CSS `grid-cols` limitation)
- Tooltips rendering behind other elements instead of on top
- Updating a nonexistent session returning 500 instead of 404
- Deleting a session not removing all associated RSVPs
- Remove-guest button in the host selector causing a browser console error
- Modals not dismissible with the Esc key

### Internal

- Airtable schema migrations: a migration system for evolving the Airtable schema over time
- E2E tests: Playwright-based end-to-end tests covering core user flows
- GitHub Actions CI: automated PR checks (lint, build)
- Dependabot: automated dependency update PRs

## [1.0.0] - 2025-04-07

The version number 1.0.0 is a retroactive label assigned here purely as a reference point to mark the upstream baseline — it was never designated as such. This is the upstream codebase at the point the fork was created, taken from commit [babcd627](https://github.com/rachelweinberg12/scheduling-app/commit/babcd6275a853f1911cd48bbdaf4f2b1725c3d47) of [rachelweinberg12/scheduling-app](https://github.com/rachelweinberg12/scheduling-app) ([full log](https://github.com/rachelweinberg12/scheduling-app/commits/babcd6275a853f1911cd48bbdaf4f2b1725c3d47/)). It was never properly released since it was deployed directly from the Git repository.

[2.0.0]: https://github.com/LWCW-Europe/scheduling-app/compare/babcd6275a853f1911cd48bbdaf4f2b1725c3d47...9aa2a273
[1.0.0]: https://github.com/rachelweinberg12/scheduling-app/commits/babcd6275a853f1911cd48bbdaf4f2b1725c3d47
