import { notFound } from "next/navigation";

import { getSessionProposalsByEvent } from "@/db/sessionProposals";
import { getEventByName } from "@/db/events";
import { eventSlugToName } from "@/utils/utils";
import { ProposalModal } from "./modal";
import { getGuests } from "@/db/guests";
import { getVotesByUser } from "@/db/votes";
import { cookies } from "next/headers";

export default async function ProposalModalPage({
  params,
}: {
  params: { eventSlug: string; proposalId: string };
}) {
  const { eventSlug, proposalId } = params;

  const currentUser = cookies().get("user")?.value;
  const eventName = eventSlugToName(eventSlug);
  const event = await getEventByName(eventName);

  if (!event) {
    return <div>Event not found</div>;
  }

  const [proposals, guests, votes] = await Promise.all([
    await getSessionProposalsByEvent(eventName),
    await getGuests(),
    currentUser ? getVotesByUser(currentUser, eventName) : Promise.resolve([]),
  ]);
  const proposal = proposals.find((p) => p.id === proposalId);
  const voteChoice =
    votes.find((v) => v.proposal === proposalId)?.choice ?? null;
  if (!proposal) {
    notFound();
  }

  return (
    <ProposalModal
      proposal={proposal}
      guests={guests}
      eventSlug={eventSlug}
      event={event}
      vote={voteChoice}
    />
  );
}
