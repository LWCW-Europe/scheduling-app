import { cookies } from "next/headers";
import { eventSlugToName } from "@/utils/utils";
import { getEventByName } from "@/db/events";
import { getDaysByEvent } from "@/db/days";
import { getSessionsByEvent } from "@/db/sessions";
import { getLocations } from "@/db/locations";
import { getGuests } from "@/db/guests";
import { getRSVPsByUser } from "@/db/rsvps";
import { EventProviderWrapper } from "./event-provider-wrapper";

export async function EventLayoutContent({
  eventSlug,
  children,
}: {
  eventSlug: string;
  children: React.ReactNode;
}) {
  const eventName = eventSlugToName(eventSlug);
  const event = await getEventByName(eventName);

  if (!event) {
    return <div>Event not found</div>;
  }

  const cookieStore = cookies();
  const currentUser = cookieStore.get("user")?.value;

  const [days, sessions, locations, guests, rsvps] = await Promise.all([
    getDaysByEvent(event.Name),
    getSessionsByEvent(event.Name),
    getLocations(),
    getGuests(),
    getRSVPsByUser(currentUser),
  ]);

  // Prepare the days with sessions
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

  const eventContextValue = {
    event,
    days,
    sessions,
    locations,
    guests,
    rsvps,
  };

  return (
    <EventProviderWrapper eventContextValue={eventContextValue}>
      {children}
    </EventProviderWrapper>
  );
}
