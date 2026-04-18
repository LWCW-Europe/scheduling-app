import { notFound } from "next/navigation";

import { getRepositories } from "@/db/container";
import { eventSlugToName } from "@/utils/utils";
import { ViewSession } from "./view-session";

export default async function ViewSessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventSlug: string }>;
  searchParams: Promise<{ sessionID: string }>;
}) {
  const { eventSlug } = await params;
  const { sessionID } = await searchParams;

  const eventName = eventSlugToName(eventSlug);
  const repos = getRepositories();
  const event = await repos.events.findByName(eventName);

  if (!event) {
    return <div>Event not found</div>;
  }

  const [sessions, guests, rsvps] = await Promise.all([
    repos.sessions.listByEvent(event.id),
    repos.guests.list(),
    repos.rsvps.listBySession(sessionID),
  ]);
  const session = sessions.find((p) => p.id === sessionID);

  if (!session) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ViewSession
        session={session}
        guests={guests}
        rsvps={rsvps}
        eventSlug={eventSlug}
        event={event}
        showBackBtn={true}
      />
    </div>
  );
}
