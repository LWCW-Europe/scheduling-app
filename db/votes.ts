import { base } from "./db";
import type { Vote } from "@/app/votes";

export async function getVotesByUser(guestId: string, eventName: string) {
  const guestMatch = `{guestId} = "${guestId}"`;
  const eventMatch = `{event} = "${eventName}"`;
  const votes: Vote[] = [];
  await base<Vote>("Votes")
    .select({
      fields: ["proposal", "guest", "choice"],
      filterByFormula: `AND(${guestMatch}, ${eventMatch})`,
    })
    .eachPage(function page(records, fetchNextPage) {
      records.forEach(function (record) {
        votes.push({
          proposal: record.fields.proposal[0],
          guest: record.fields.guest[0],
          choice: record.fields.choice,
        });
      });
      fetchNextPage();
    });
  return votes;
}

export function deleteVotesFromProposal(sessionId: string) {
  void base("Votes")
    .select({
      filterByFormula: `{proposalId} = "${sessionId}"`,
    })
    .eachPage(function page(records, fetchNextPage) {
      const ids = records.map((rec) => rec.getId());
      if (ids.length > 0) {
        void base("Votes").destroy(ids);
      }
      fetchNextPage();
    });
}
export function deleteVotesFromProposalByUsers(
  sessionId: string,
  users: string[]
) {
  const isOneOfUsers = `OR(${users.map((user) => `{guestId} = "${user}"`).join(", ")})`;
  void base("Votes")
    .select({
      filterByFormula: `AND(${isOneOfUsers}, {proposalId} = "${sessionId}")`,
    })
    .eachPage(function page(records, fetchNextPage) {
      const ids = records.map((rec) => rec.getId());
      if (ids.length > 0) {
        void base("Votes").destroy(ids);
      }
      fetchNextPage();
    });
}

export async function deleteVote(guestId: string, proposalId: string) {
  try {
    await base("Votes")
      .select({
        filterByFormula: `AND({guestId} = "${guestId}", {proposalId} = "${proposalId}")`,
      })
      .eachPage(function page(records, fetchNextPage) {
        records.forEach(function (record) {
          base("Votes").destroy([record.getId()], function (err: string) {
            if (err) {
              console.error(err);
              return;
            }
          });
        });
        fetchNextPage();
      });
  } catch (err) {
    console.error(err);
    throw err;
  }
}
