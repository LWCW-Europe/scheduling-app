import { base } from "./db";

export type SessionProposal = {
  id: string;
  event: string;
  title: string;
  description?: string;
  hosts: string[];
  durationMinutes?: number;
};

export type NewProposalInput = {
  event: string;
  title: string;
  description?: string;
  hosts: string[];
  durationMinutes?: number;
};

export async function getSessionProposalsByEvent(event: string) {
  const proposals: SessionProposal[] = [];
  await base("SessionProposals")
    .select({
      fields: ["event", "title", "description", "hosts", "durationMinutes"],
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

export async function searchSessionProposals(event: string, query: string) {
  const proposals: SessionProposal[] = [];
  await base("SessionProposals")
    .select({
      fields: ["event", "title", "description", "hosts", "durationMinutes"],
      filterByFormula: `AND({event} = "${event}", SEARCH("${query.replace(/"/g, '\\"')}", {title}))`,
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
  const record = await base("SessionProposals").create({
    event: [input.event],
    title: input.title,
    description: input.description || "",
    hosts: input.hosts,
    durationMinutes: input.durationMinutes || 60,
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
  const record = await base("SessionProposals").update(id, {
    ...patch,
  });

  return {
    ...(record.fields as Omit<SessionProposal, "id">),
    id: record.id,
  };
}

export async function deleteSessionProposal(id: string) {
  await base("SessionProposals").destroy([id]);
}
