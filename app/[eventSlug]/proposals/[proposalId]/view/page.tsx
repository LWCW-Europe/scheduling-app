import { notFound } from "next/navigation";

import { getRepositories } from "@/db/container";
import { eventSlugToName } from "@/utils/utils";
import { ViewProposal } from "./view-proposal";

export default async function ViewProposalPage({
  params,
}: {
  params: Promise<{ eventSlug: string; proposalId: string }>;
}) {
  const { eventSlug, proposalId } = await params;

  const eventName = eventSlugToName(eventSlug);
  const repos = getRepositories();

  const [event, proposals, sessions] = await Promise.all([
    repos.events.findByName(eventName),
    repos.sessionProposals.findById(proposalId).then((p) => (p ? [p] : [])),
    repos.sessions.list(),
  ]);

  const proposal = proposals[0];

  if (!event || !proposal) {
    return notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ViewProposal
        proposal={proposal}
        sessions={sessions}
        eventSlug={eventSlug}
        event={event}
        showBackBtn={true}
      />
    </div>
  );
}
