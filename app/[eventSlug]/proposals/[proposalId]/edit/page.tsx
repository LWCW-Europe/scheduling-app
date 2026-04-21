import { getRepositories } from "@/db/container";
import { eventSlugToName } from "@/utils/utils";
import { SessionProposalForm } from "@/app/[eventSlug]/session-proposal-form";
import { notFound } from "next/navigation";

export default async function EditProposalPage({
  params,
}: {
  params: Promise<{ eventSlug: string; proposalId: string }>;
}) {
  const { eventSlug, proposalId } = await params;

  const eventName = eventSlugToName(eventSlug);
  const repos = getRepositories();
  const event = await repos.events.findByName(eventName);

  if (!event) {
    return <div>Event not found</div>;
  }

  const [proposal, guests] = await Promise.all([
    repos.sessionProposals.findById(proposalId),
    repos.guests.list(),
  ]);

  if (!proposal) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto pb-24">
      <SessionProposalForm
        eventID={event.id}
        eventSlug={eventSlug}
        proposal={proposal}
        guests={guests}
        maxSessionDuration={event.maxSessionDuration}
      />
    </div>
  );
}
