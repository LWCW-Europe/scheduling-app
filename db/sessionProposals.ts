import { base } from "./db";

export type SessionProposal = {
  id: string;
  eventSlug: string;
  title: string;
  description?: string;
  hosts?: string;
  durationMinutes?: number;
  createdByUserId?: string;
  updatedByUserId?: string;
  status?: "proposed" | "scheduled" | "archived";
};

export type NewProposalInput = {
  eventSlug: string;
  title: string;
  description?: string;
  hosts?: string;
  durationMinutes?: number;
};

export async function getSessionProposalsByEvent(eventSlug: string) {
  const proposals: SessionProposal[] = [];
  await base("SessionProposals")
    .select({
      fields: [
        "eventSlug",
        "title",
        "description",
        "hosts",
        "durationMinutes",
        "createdByUserId",
        "updatedByUserId",
        "status",
      ],
      filterByFormula: `{eventSlug} = "${eventSlug}"`,
      sort: [{ field: "Created time", direction: "desc" }],
    })
    .eachPage(function page(records, fetchNextPage) {
      records.forEach(function (record) {
        proposals.push({
          ...(record.fields as Omit<SessionProposal, "id">),
          id: record.id,
        });
      });
      fetchNextPage();
    });
  return proposals;
}

export async function searchSessionProposals(eventSlug: string, query: string) {
  const proposals: SessionProposal[] = [];
  await base("SessionProposals")
    .select({
      fields: [
        "eventSlug",
        "title",
        "description",
        "hosts",
        "durationMinutes",
        "createdByUserId",
        "updatedByUserId",
        "status",
      ],
      filterByFormula: `AND({eventSlug} = "${eventSlug}", SEARCH("${query.replace(/"/g, '\\"')}", {title}))`,
      sort: [{ field: "Created time", direction: "desc" }],
    })
    .eachPage(function page(records, fetchNextPage) {
      records.forEach(function (record) {
        proposals.push({
          ...(record.fields as Omit<SessionProposal, "id">),
          id: record.id,
        });
      });
      fetchNextPage();
    });
  return proposals;
}

export async function createSessionProposal(
  input: NewProposalInput,
  userId?: string
) {
  const record = await base("SessionProposals").create({
    eventSlug: input.eventSlug,
    title: input.title,
    description: input.description || "",
    hosts: input.hosts || "",
    durationMinutes: input.durationMinutes || 60,
    createdByUserId: userId || "",
    updatedByUserId: userId || "",
    status: "proposed",
  });

  return {
    ...(record.fields as Omit<SessionProposal, "id">),
    id: record.id,
  };
}

export async function updateSessionProposal(
  id: string,
  patch: Partial<NewProposalInput>,
  userId?: string
) {
  const record = await base("SessionProposals").update(id, {
    ...patch,
    updatedByUserId: userId || "",
  });

  return {
    ...(record.fields as Omit<SessionProposal, "id">),
    id: record.id,
  };
}

export async function deleteSessionProposal(id: string) {
  // Soft delete - set status to archived
  const record = await base("SessionProposals").update(id, {
    status: "archived",
  });

  return {
    ...(record.fields as Omit<SessionProposal, "id">),
    id: record.id,
  };
}
