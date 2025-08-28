import { notFound } from "next/navigation";

import { eventSlugToName } from "@/utils/utils";
import { getEventByName } from "@/db/events";
import { getGuestsByEvent } from "@/db/guests";
import { getSessionsByEvent } from "@/db/sessions";
import { getRSVPsBySession } from "@/db/rsvps";
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
  const event = await getEventByName(eventName);

  if (!event) {
    return <div>Event not found</div>;
  }

  const [sessions, guests, rsvps] = await Promise.all([
    getSessionsByEvent(eventName),
    getGuestsByEvent(event.Name),
    getRSVPsBySession(sessionID),
  ]);
  const session = sessions.find((p) => p.ID === sessionID);

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
