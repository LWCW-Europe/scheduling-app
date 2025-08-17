import { notFound } from "next/navigation";

import { getSessionProposalsByEvent } from "@/db/sessionProposals";
import { getGuestsByEvent } from "@/db/guests";
import { getEventByName } from "@/db/events";
import { getSessionsByEvent } from "@/db/sessions";
import { eventSlugToName } from "@/utils/utils";
import { ViewProposal } from "./view-proposal";

export default async function ViewProposalPage({
  params,
}: {
  params: { eventSlug: string; proposalId: string };
}) {
  const { eventSlug, proposalId } = params;

  const eventName = eventSlugToName(eventSlug);

  const [event, proposals, guests, sessions] = await Promise.all([
    getEventByName(eventName),
    getSessionProposalsByEvent(eventName),
    getGuestsByEvent(eventName),
    getSessionsByEvent(eventName),
  ]);

  const proposal = proposals.find((p) => p.id === proposalId);

  if (!event || !proposal) {
    return notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ViewProposal
        proposal={proposal}
        guests={guests}
        sessions={sessions}
        eventSlug={eventSlug}
        event={event}
        showBackBtn={true}
      />
    </div>
  );
}
