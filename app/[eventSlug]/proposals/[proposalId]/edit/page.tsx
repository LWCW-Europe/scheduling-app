import { getSessionProposalsByEvent } from "@/db/sessionProposals";
import { getGuestsByEvent } from "@/db/guests";
import { getEventByName } from "@/db/events";
import { eventSlugToName } from "@/utils/utils";
import { SessionProposalForm } from "@/app/[eventSlug]/session-proposal-form";
import { notFound } from "next/navigation";

export default async function EditProposalPage({
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
    <div className="max-w-2xl mx-auto pb-24">
      <SessionProposalForm
        eventID={event.ID}
        eventSlug={eventSlug}
        proposal={proposal}
        guests={guests}
      />
    </div>
  );
}
