import { getBase } from "./db";
import {
  deleteVotesFromProposal,
  deleteVotesFromProposalByUsers,
} from "./votes";

export type SessionProposal = {
  id: string;
  event: string;
  title: string;
  description?: string;
  hosts: string[];
  durationMinutes?: number;
  createdTime: string;
  votesCount: number;
};

export type NewProposalInput = {
  event: string;
  title: string;
  description?: string;
  hosts: string[];
  durationMinutes: number | null;
};

export async function getSessionProposalsByEvent(event: string) {
  const proposals: SessionProposal[] = [];
  await getBase()("SessionProposals")
    .select({
      fields: [
        "event",
        "title",
        "description",
        "hosts",
        "durationMinutes",
        "createdTime",
        "votesCount",
      ],
      filterByFormula: `{event} = "${event}"`,
    })
    .eachPage(function page(records, fetchNextPage) {
      records.forEach(function (record) {
        proposals.push({
          ...(record.fields as Omit<SessionProposal, "id">),
          hosts: (record.fields.hosts as string[]) || [],
          id: record.id,
        });
      });
      fetchNextPage();
    });
  return proposals;
}

export async function createSessionProposal(input: NewProposalInput) {
  const record = await getBase()("SessionProposals").create({
    event: [input.event],
    title: input.title,
    description: input.description || "",
    hosts: input.hosts,
    durationMinutes: input.durationMinutes || undefined,
  });

  return {
    ...(record.fields as Omit<SessionProposal, "id">),
    id: record.id,
  };
}

export async function updateSessionProposal(
  id: string,
  patch: Partial<NewProposalInput>
) {
  const record = await getBase()("SessionProposals").update(id, {
    ...patch,
    // https://github.com/Airtable/airtable.js/issues/272
    // Typescript does not let me use null here, but using null is the only
    //   way to get Airtable to have no value for a numeric field
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
    durationMinutes: patch.durationMinutes as any,
  });
  if (patch.hosts) {
    deleteVotesFromProposalByUsers(id, patch.hosts);
  }

  return {
    ...(record.fields as Omit<SessionProposal, "id">),
    id: record.id,
  };
}

export async function deleteSessionProposal(id: string) {
  await getBase()("SessionProposals").destroy([id]);
  deleteVotesFromProposal(id);
}
