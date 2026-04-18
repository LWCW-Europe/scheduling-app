import { notFound } from "next/navigation";

import { getRepositories } from "@/db/container";
import { eventSlugToName } from "@/utils/utils";
import { ProposalModal } from "./modal";

export default async function ProposalModalPage({
  params,
}: {
  params: Promise<{ eventSlug: string; proposalId: string }>;
}) {
  const { eventSlug, proposalId } = await params;

  const eventName = eventSlugToName(eventSlug);
  const repos = getRepositories();

  const [event, proposal, sessions] = await Promise.all([
    repos.events.findByName(eventName),
    repos.sessionProposals.findById(proposalId),
    repos.sessions.list(),
  ]);

  if (!event || !proposal) {
    notFound();
  }

  return (
    <ProposalModal
      proposal={proposal}
      sessions={sessions}
      eventSlug={eventSlug}
      event={event}
    />
  );
}
