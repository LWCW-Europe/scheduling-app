import { cookies } from "next/headers";
import Link from "next/link";

import { QuickVoting } from "./quick-voting";
import { getSessionProposalsByEvent } from "@/db/sessionProposals";
import { getGuests } from "@/db/guests";
import { getVotesByUser } from "@/db/votes";

export default async function ProposalQuickVoting(props: {
  params: { eventSlug: string };
}) {
  const { eventSlug } = props.params;
  const eventName = eventSlug.replace(/-/g, " ");
  const currentUser = cookies().get("user")?.value;
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

  const [allProposals, guests, votes] = await Promise.all([
    getSessionProposalsByEvent(eventName),
    getGuests(),
    getVotesByUser(currentUser, eventName),
  ]);
  const proposals = allProposals.filter(
    (proposal) => !proposal.hosts.includes(currentUser)
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
