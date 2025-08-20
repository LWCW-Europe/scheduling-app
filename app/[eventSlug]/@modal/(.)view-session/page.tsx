import { notFound } from "next/navigation";
import { cookies } from "next/headers";

import { eventSlugToName } from "@/utils/utils";
import { getEventByName } from "@/db/events";
import { getGuestsByEvent } from "@/db/guests";
import { getSessionsByEvent } from "@/db/sessions";
import { getDaysByEvent } from "@/db/days";
import { getLocations } from "@/db/locations";
import { getGuests } from "@/db/guests";
import { getRSVPsByUser } from "@/db/rsvps";
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

  const cookieStore = cookies();
  const currentUser = cookieStore.get("user")?.value;

  const [sessions, guests, days, locations, allGuests, rsvps] =
    await Promise.all([
      getSessionsByEvent(eventName),
      getGuestsByEvent(event.Name),
      getDaysByEvent(event.Name),
      getLocations(),
      getGuests(),
      getRSVPsByUser(currentUser),
    ]);

  const session = sessions.find((p) => p.ID === sessionID);

  if (!session) {
    notFound();
  }

  // Prepare the days with sessions (same logic as event-page.tsx)
  days.forEach((day) => {
    const dayStartMillis = new Date(day.Start).getTime();
    const dayEndMillis = new Date(day.End).getTime();
    day.Sessions = sessions.filter((s) => {
      const sessionStartMillis = new Date(s["Start time"]).getTime();
      const sessionEndMillis = new Date(s["End time"]).getTime();
      return (
        dayStartMillis <= sessionStartMillis && dayEndMillis >= sessionEndMillis
      );
    });
  });

  // Initial event context value (same structure as event-page.tsx)
  const eventContextValue = {
    event,
    days,
    sessions,
    locations,
    guests: allGuests,
    rsvps,
  };

  return (
    <SessionModal
      session={session}
      guests={guests}
      eventSlug={eventSlug}
      event={event}
      eventContextValue={eventContextValue}
    />
  );
}
