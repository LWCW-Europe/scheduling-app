import { getGuestsByEvent } from "@/db/guests";
import { getEventByName } from "@/db/events";
import { SessionProposalForm } from "../../session-proposal-form";

export default async function NewProposalPage({
  params,
}: {
  params: { eventSlug: string };
}) {
  const { eventSlug } = params;

  // Convert slug to event name (simple conversion for now)
  const eventName = eventSlug.replace(/-/g, " ");
  const event = await getEventByName(eventName);

  if (!event) {
    return <div>Event not found</div>;
  }

  const guests = await getGuestsByEvent(event.Name);

  return (
    <div className="container mx-auto px-4 py-8">
      <SessionProposalForm eventSlug={eventSlug} guests={guests} />
    </div>
  );
}
