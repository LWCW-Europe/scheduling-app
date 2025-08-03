import Link from "next/link";
import { PlusIcon, ChartBarIcon } from "@heroicons/react/24/outline";

import { getSessionProposalsByEvent } from "@/db/sessionProposals";
import { getGuestsByEvent } from "@/db/guests";
import { getEventByName } from "@/db/events";
import { ProposalTable } from "./proposal-table";
import { UserSelect } from "@/app/user-select";
import HoverTooltip from "@/app/hover-tooltip";
import { inVotingPhase, dateStartDescription } from "@/app/utils/events";

export const dynamic = "force-dynamic";

export default async function ProposalsPage({
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

  const [guests, proposals] = await Promise.all([
    getGuestsByEvent(eventName),
    getSessionProposalsByEvent(eventName),
  ]);

  const votingEnabled = inVotingPhase(event);
  const votingDisabledText = `Voting ${dateStartDescription(event.votingPhaseStart)}`;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-1">
        <span className="text-gray-500">My name is:</span>
        <UserSelect guests={guests} />
      </div>
      <div className="mb-6 mt-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold">
              {event.Name}: Session Proposals
            </h1>
            <p className="text-gray-600 mt-2">
              Browse session ideas or add your own proposal
            </p>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center mb-6">
          <Link
            href={`/${eventSlug}/proposals/new`}
            className="bg-rose-400 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-rose-500 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Add Proposal</span>
          </Link>
          <HoverTooltip text={votingDisabledText} visible={!votingEnabled}>
            <button
              className="opacity-50 cursor-not-allowed bg-rose-400 text-white px-4 py-2 rounded-md flex items-center gap-2"
              disabled
            >
              <ChartBarIcon className="h-5 w-5" />
              <span>Go to Quick Voting!</span>
            </button>
          </HoverTooltip>
        </div>
      </div>

      {proposals.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-medium text-gray-600">
            No proposals yet
          </h2>
          <p className="text-gray-500 mt-2">
            Be the first to suggest a session!
          </p>
          <Link
            href={`/${eventSlug}/proposals/new`}
            className="mt-4 inline-block bg-rose-400 text-white px-4 py-2 rounded-md hover:bg-rose-500"
          >
            Add Proposal
          </Link>
        </div>
      ) : (
        <ProposalTable
          guests={guests}
          proposals={proposals}
          eventSlug={eventSlug}
          event={event}
        />
      )}
    </div>
  );
}
