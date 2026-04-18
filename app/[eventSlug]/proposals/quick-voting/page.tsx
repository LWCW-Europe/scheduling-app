import { cookies } from "next/headers";
import Link from "next/link";

import { QuickVoting } from "./quick-voting";
import { getRepositories } from "@/db/container";
import { eventSlugToName } from "@/utils/utils";

export default async function ProposalQuickVoting(props: {
  params: { eventSlug: string };
}) {
  const { eventSlug } = props.params;
  const eventName = eventSlugToName(eventSlug);
  const currentUser = (await cookies()).get("user")?.value;
  if (!currentUser) {
    return (
      <div>
        <Link
          className="bg-rose-400 text-white font-semibold py-2 px-4 rounded shadow hover:bg-rose-500 active:bg-rose-500 w-fit px-12"
          href={`/${eventSlug}/proposals`}
        >
          Back to Proposals
        </Link>
        <div className="mt-6">Please choose who you are first.</div>
      </div>
    );
  }

  const repos = getRepositories();
  const event = await repos.events.findByName(eventName);
  if (!event) {
    return <div>Event not found</div>;
  }

  const [allProposals, guests, votes] = await Promise.all([
    repos.sessionProposals.listByEvent(event.id),
    repos.guests.list(),
    repos.votes.listByGuestAndEvent(currentUser, event.id),
  ]);
  const proposals = allProposals.filter(
    (proposal) => !proposal.hosts.some((h) => h.id === currentUser)
  );

  return (
    <QuickVoting
      proposals={proposals}
      guests={guests}
      currentUser={currentUser}
      initialVotes={votes}
      eventName={eventName}
      eventSlug={eventSlug}
    />
  );
}
