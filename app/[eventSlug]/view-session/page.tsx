import { notFound } from "next/navigation";

import { getGuestsByEvent } from "@/db/guests";
import { getEventByName } from "@/db/events";
import { eventSlugToName } from "@/utils/utils";
import { getSessionsByEvent } from "@/db/sessions";
import { ViewSession } from "./view-session";

export default async function ViewSessionPage({
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

  const [sessions, guests] = await Promise.all([
    getSessionsByEvent(eventName),
    getGuestsByEvent(event.Name),
  ]);
  const session = sessions.find((p) => p.ID === sessionID);

  if (!session) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ViewSession
        session={session}
        guests={guests}
        eventSlug={eventSlug}
        event={event}
        showBackBtn={true}
      />
    </div>
  );
}
