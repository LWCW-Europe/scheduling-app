# Database Schema Documentation

Most of the schema is documented outside of this repository, but recent changes
are here.

When using the type `Date` preferably use the following format:

- ISO format `YYYY-MM-DD`
- Include time
- 24 hour format
- Display time zone

## Migrations Table

| Field     | Type             | Required | Description                    |
| --------- | ---------------- | -------- | ------------------------------ |
| id        | Single line text | ✅       | Primary key                    |
| appliedAt | Date/Time        | ✅       | When the migration was applied |

## Events Table - New fields

| Field                | Type | Required | Description                  |
| -------------------- | ---- | -------- | ---------------------------- |
| proposalPhaseStart   | Date |          | When session proposals open  |
| proposalPhaseEnd     | Date |          | When session proposals close |
| votingPhaseStart     | Date |          | When voting opens            |
| votingPhaseEnd       | Date |          | When voting closes           |
| schedulingPhaseStart | Date |          | When scheduling begins       |
| schedulingPhaseEnd   | Date |          | When scheduling ends         |

## SessionProposals Table

| Field           | Type                                       | Required | Description                         |
| --------------- | ------------------------------------------ | -------- | ----------------------------------- |
| id              | Formula                                    | ✅       | Primary key, formula: `RECORD_ID()` |
| description     | Long text                                  |          | Description of the session proposal |
| durationMinutes | Number                                     |          | Duration in minutes                 |
| event           | Link to another record (Events) - Only one | ✅       | Event this proposal belongs to      |
| hosts           | Link to another record (Guests) - Multiple | ✅       | Hosts of the session proposal       |
| title           | Single line text                           | ✅       | Title of the session proposal       |
| createdTime     | Created time                               | ✅       | When the proposal was created       |
| votes           | Link to another record (Votes) - Multiple  |          | Votes on the proposal               |
| votesCount      | Count                                      |          | Number of votes on the proposal     |

## Votes Table

| Field      | Type                                                 | Required | Description                          |
| ---------- | ---------------------------------------------------- | -------- | ------------------------------------ | --------------- |
| id         | Formula                                              | ✅       | Primary key, formula: `RECORD_ID()`  |
| choice     | Single select                                        | ✅       | Vote choice: interested, maybe, skip |
| guest      | Link to another record (Guests) - Only one           | ✅       |                                      | Guest who voted |
| proposal   | Link to another record (SessionProposals) - Only one | ✅       | Proposal being voted on              |
| guestId    | Lookup (guest.ID)                                    |          | ID of the guest who voted            |
| proposalId | Lookup (proposal.ID)                                 |          | ID of the proposal being voted on    |
| event      | Lookup (proposal.event)                              |          | Event associated with the proposal   |

## Migration History

See the [migrations](../migrations/).
