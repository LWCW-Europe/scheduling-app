import { getRepositories } from "@/db/container";
import { eventSlugToName } from "@/utils/utils";
import { SessionProposalForm } from "../../session-proposal-form";

export default async function NewProposalPage({
  params,
}: {
  params: { eventSlug: string };
}) {
  const { eventSlug } = params;

  const eventName = eventSlugToName(eventSlug);
  const repos = getRepositories();
  const event = await repos.events.findByName(eventName);

  if (!event) {
    return <div>Event not found</div>;
  }

  const guests = await repos.guests.list();

  return (
    <div className="max-w-2xl mx-auto pb-24">
      <SessionProposalForm
        eventID={event.id}
        eventSlug={eventSlug}
        guests={guests}
      />
    </div>
  );
}
