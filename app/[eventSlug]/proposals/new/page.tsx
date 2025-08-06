import { getGuestsByEvent } from "@/db/guests";
import { eventSlugToName, getEventByName } from "@/db/events";
import { SessionProposalForm } from "../../session-proposal-form";

export default async function NewProposalPage({
  params,
}: {
  params: { eventSlug: string };
}) {
  const { eventSlug } = params;

  // Convert slug to event name (simple conversion for now)
  const eventName = eventSlugToName(eventSlug);
  const event = await getEventByName(eventName);

  if (!event) {
    return <div>Event not found</div>;
  }

  const guests = await getGuestsByEvent(event.Name);

  return (
    <div className="max-w-2xl mx-auto pb-24">
      <SessionProposalForm
        eventID={event.ID}
        eventSlug={eventSlug}
        guests={guests}
      />
    </div>
  );
}
