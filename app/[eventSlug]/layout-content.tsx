import { cookies } from "next/headers";
import { eventSlugToName } from "@/utils/utils";
import { getRepositories } from "@/db/container";
import { EventProviderWrapper } from "./event-provider-wrapper";
import type { DayWithSessions } from "@/app/context";

export async function EventLayoutContent({
  eventSlug,
  children,
}: {
  eventSlug: string;
  children: React.ReactNode;
}) {
  const eventName = eventSlugToName(eventSlug);
  const repos = getRepositories();
  const event = await repos.events.findByName(eventName);

  if (!event) {
    return <div>Event not found</div>;
  }

  const cookieStore = cookies();
  const currentUser = cookieStore.get("user")?.value;

  const [days, sessions, locations, guests, rsvps] = await Promise.all([
    repos.days.listByEvent(event.id),
    repos.sessions.listByEvent(event.id),
    repos.locations.listVisible(),
    repos.guests.list(),
    currentUser ? repos.rsvps.listByGuest(currentUser) : Promise.resolve([]),
  ]);

  const daysWithSessions: DayWithSessions[] = days.map((day) => ({
    ...day,
    sessions: sessions.filter((s) => {
      if (!s.startTime || !s.endTime) return false;
      return (
        day.start.getTime() <= s.startTime.getTime() &&
        day.end.getTime() >= s.endTime.getTime()
      );
    }),
  }));

  const eventContextValue = {
    event,
    days: daysWithSessions,
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
