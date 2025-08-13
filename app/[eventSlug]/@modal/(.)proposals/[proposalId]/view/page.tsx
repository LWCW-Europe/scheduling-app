import { notFound } from "next/navigation";

import { getSessionProposalsByEvent } from "@/db/sessionProposals";
import { getEventByName } from "@/db/events";
import { eventSlugToName } from "@/utils/utils";
import { ProposalModal } from "./modal";
import { getGuests } from "@/db/guests";

export default async function ProposalModalPage({
  params,
}: {
  params: { eventSlug: string; proposalId: string };
}) {
  const { eventSlug, proposalId } = params;

  const eventName = eventSlugToName(eventSlug);
  const event = await getEventByName(eventName);

  if (!event) {
    return <div>Event not found</div>;
  }

  const [proposals, guests] = await Promise.all([
    await getSessionProposalsByEvent(eventName),
    await getGuests(),
  ]);
  const proposal = proposals.find((p) => p.id === proposalId);

  if (!proposal) {
    notFound();
  }

  return (
    <ProposalModal
      proposal={proposal}
      guests={guests}
      eventSlug={eventSlug}
      event={event}
    />
  );
}
