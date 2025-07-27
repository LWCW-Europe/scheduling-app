import { getSessionProposalsByEvent } from "@/db/sessionProposals";
import { getGuestsByEvent } from "@/db/guests";
import { getEventByName } from "@/db/events";
import { SessionProposalForm } from "../../session-proposal-form";
import { notFound } from "next/navigation";

export default async function EditProposalPage({
  params,
}: {
  params: { eventSlug: string; proposalId: string };
}) {
  const { eventSlug, proposalId } = params;

  // Convert slug to event name (simple conversion for now)
  const eventName = eventSlug.replace(/-/g, " ");
  const event = await getEventByName(eventName);

  if (!event) {
    return <div>Event not found</div>;
  }

  const proposals = await getSessionProposalsByEvent(eventSlug);
  const proposal = proposals.find((p) => p.id === proposalId);

  if (!proposal) {
    notFound();
  }

  const guests = await getGuestsByEvent(event.Name);

  return (
    <div className="container mx-auto px-4 py-8">
      <SessionProposalForm
        eventSlug={eventSlug}
        proposal={proposal}
        guests={guests}
      />
    </div>
  );
}
