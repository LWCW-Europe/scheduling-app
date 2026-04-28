"use client";
import { useSearchParams } from "next/navigation";
import { SessionText } from "./session-text";
import { DateTime } from "luxon";
import { useContext } from "react";
import { UserContext, EventContext } from "../context";
import type { DayWithSessions } from "@/app/context";
import type { Rsvp, Location, Session } from "@/db/repositories/interfaces";

export function DayText(props: {
  locations: Location[];
  day: DayWithSessions;
  search: string;
  rsvps: Rsvp[];
  eventSlug: string;
}) {
  const { day, locations, search, rsvps, eventSlug } = props;
  const searchParams = useSearchParams();
  const { user: currentUser } = useContext(UserContext);
  const { event } = useContext(EventContext);
  const timezone = event?.timezone ?? "UTC";
  const locParams = searchParams?.getAll("loc");
  const locationsFromParams = locations.filter((loc) =>
    locParams?.includes(loc.name)
  );
  const includedLocations =
    locationsFromParams.length === 0 ? locations : locationsFromParams;
  const includedSessions = day.sessions.filter((session) => {
    return (
      includedLocations.some((location) =>
        session.locations.some((l) => l.id === location.id)
      ) &&
      sessionMatchesSearch(session, search) &&
      !session.blocker
    );
  });
  const sessionsSortedByLocation = includedSessions.sort((a, b) => {
    return (
      (locations.find((loc) => loc.id === a.locations[0]?.id)?.sortIndex ?? 0) -
      (locations.find((loc) => loc.id === b.locations[0]?.id)?.sortIndex ?? 0)
    );
  });
  const sessionsSortedByTime = sessionsSortedByLocation.sort((a, b) => {
    return (a.startTime?.getTime() ?? 0) - (b.startTime?.getTime() ?? 0);
  });

  let sessions = sessionsSortedByTime;
  if (rsvps.length > 0) {
    const rsvpSet = new Set(rsvps.map((rsvp) => rsvp.sessionId));
    sessions = sessions.filter(
      (session) =>
        rsvpSet.has(session.id) ||
        (currentUser && session.hosts.some((h) => h.id === currentUser))
    );
  }
  return (
    <div className="flex flex-col max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold w-full text-left">
        {DateTime.fromJSDate(day.start)
          .setZone(timezone)
          .toFormat("EEEE, MMMM d")}{" "}
      </h2>
      <div className="flex flex-col divide-y divide-gray-300">
        {sessions.length > 0 ? (
          <>
            {sessions.map((session) => (
              <SessionText
                key={`${session.title}+${session.startTime?.toISOString()}+${session.endTime?.toISOString()}`}
                session={session}
                locations={locations.filter((loc) =>
                  session.locations.some((l) => l.id === loc.id)
                )}
                eventSlug={eventSlug}
              />
            ))}
          </>
        ) : (
          <p className="text-gray-500 italic text-sm w-full text-left">
            No sessions
          </p>
        )}
      </div>
    </div>
  );
}

function sessionMatchesSearch(session: Session, search: string) {
  return (
    checkStringForSearch(search, session.title ?? "") ||
    checkStringForSearch(search, session.description ?? "") ||
    checkStringForSearch(search, session.hosts.map((h) => h.name).join(" ")) ||
    checkStringForSearch(search, session.locations.map((l) => l.name).join(" "))
  );
}

function checkStringForSearch(search: string, string: string) {
  return string.toLowerCase().includes(search.toLowerCase());
}
