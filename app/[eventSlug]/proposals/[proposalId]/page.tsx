import { notFound } from "next/navigation";

import { getSessionProposalsByEvent } from "@/db/sessionProposals";
import { getGuestsByEvent } from "@/db/guests";
import { eventSlugToName, getEventByName } from "@/db/events";
import { ViewProposal } from "./view-proposal";

export default async function ViewProposalPage({
  params,
}: {
  params: { eventSlug: string; proposalId: string };
}) {
  const { eventSlug, proposalId } = params;

  // Convert slug to event name (simple conversion for now)
  const eventName = eventSlugToName(eventSlug);
  const event = await getEventByName(eventName);

  if (!event) {
    return <div>Event not found</div>;
  }

  const proposals = await getSessionProposalsByEvent(eventName);
  const proposal = proposals.find((p) => p.id === proposalId);

  if (!proposal) {
    notFound();
  }

  const guests = await getGuestsByEvent(event.Name);

  return (
    <div className="container mx-auto px-4 py-8">
      <ViewProposal
        proposal={proposal}
        guests={guests}
        eventSlug={eventSlug}
        event={event}
      />
    </div>
  );
}
