import { notFound } from "next/navigation";

import { getSessionProposalsByEvent } from "@/db/sessionProposals";
import { getEventByName } from "@/db/events";
import { getSessionsByEvent } from "@/db/sessions";
import { eventSlugToName } from "@/utils/utils";
import { ProposalModal } from "./modal";
import { getGuestsByEvent } from "@/db/guests";

export default async function ProposalModalPage({
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
    notFound();
  }

  return (
    <ProposalModal
      proposal={proposal}
      guests={guests}
      sessions={sessions}
      eventSlug={eventSlug}
      event={event}
    />
  );
}
