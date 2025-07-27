import { getSessionProposalsByEvent } from "@/db/sessionProposals";
import { getEventByName } from "@/db/events";
import { ProposalTable } from "./proposal-table";
import Link from "next/link";
import { PlusIcon } from "@heroicons/react/24/outline";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  // This is just a placeholder, actual event slugs would come from a database query
  return [{ eventSlug: "unconference" }];
}

export default async function ActivitiesPage({
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

  const proposals = await getSessionProposalsByEvent(eventSlug);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">
            {event.Name}: Session Proposals
          </h1>
          <p className="text-gray-600 mt-2">
            Browse session ideas or add your own proposal
          </p>
        </div>
        <Link
          href={`/${eventSlug}/activities/new`}
          className="bg-rose-400 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-rose-500"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Add Proposal</span>
        </Link>
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
            href={`/${eventSlug}/activities/new`}
            className="mt-4 inline-block bg-rose-400 text-white px-4 py-2 rounded-md hover:bg-rose-500"
          >
            Add Proposal
          </Link>
        </div>
      ) : (
        <ProposalTable proposals={proposals} eventSlug={eventSlug} />
      )}
    </div>
  );
}
