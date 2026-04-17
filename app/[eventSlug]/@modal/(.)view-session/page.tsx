import { notFound } from "next/navigation";

import { eventSlugToName } from "@/utils/utils";
import { getRepositories } from "@/db/container";
import { SessionModal } from "./modal";

export default async function SessionModalPage({
  params,
  searchParams,
}: {
  params: { eventSlug: string };
  searchParams: { sessionID: string };
}) {
  const { eventSlug } = params;
  const { sessionID } = searchParams;

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
    <SessionModal
      session={session}
      guests={guests}
      rsvps={rsvps}
      eventSlug={eventSlug}
      event={event}
    />
  );
}
