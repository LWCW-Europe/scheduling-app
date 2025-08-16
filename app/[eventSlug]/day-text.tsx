"use client";
import { useSearchParams } from "next/navigation";
import { SessionText } from "./session-text";
import { DateTime } from "luxon";
import { useContext } from "react";
import { UserContext } from "../context";
import { Day } from "@/db/days";
import { RSVP } from "@/db/rsvps";
import { Location } from "@/db/locations";
import { Session } from "@/db/sessions";

export function DayText(props: {
  locations: Location[];
  day: Day;
  search: string;
  rsvps: RSVP[];
}) {
  const { day, locations, search, rsvps } = props;
  const searchParams = useSearchParams();
  const { user: currentUser } = useContext(UserContext);
  const locParams = searchParams?.getAll("loc");
  const locationsFromParams = locations.filter((loc) =>
    locParams?.includes(loc.Name)
  );
  const includedLocations =
    locationsFromParams.length === 0 ? locations : locationsFromParams;
  const includedSessions = day.Sessions.filter((session) => {
    return (
      includedLocations.some((location) =>
        session["Location name"].includes(location.Name)
      ) &&
      sessionMatchesSearch(session, search) &&
      !session.Blocker
    );
  });
  const sessionsSortedByLocation = includedSessions.sort((a, b) => {
    return (
      (locations.find((loc) => loc.Name === a["Location name"][0])?.Index ??
        0) -
      (locations.find((loc) => loc.Name === b["Location name"][0])?.Index ?? 0)
    );
  });
  const sessionsSortedByTime = sessionsSortedByLocation.sort((a, b) => {
    return (
      new Date(a["Start time"]).getTime() - new Date(b["Start time"]).getTime()
    );
  });

  // If RSVPs are present, only show sessions that the user has RSVP'd to
  let sessions = sessionsSortedByTime;
  if (rsvps.length > 0) {
    const rsvpSet = new Set(rsvps.map((rsvp) => rsvp.Session[0]));
    sessions = sessions.filter(
      (session) =>
        rsvpSet.has(session.ID) ||
        (currentUser && session.Hosts?.includes(currentUser))
    );
  }
  return (
    <div className="flex flex-col max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold w-full text-left">
        {DateTime.fromISO(day.Start)
          .setZone("America/Los_Angeles")
          .toFormat("EEEE, MMMM d")}{" "}
      </h2>
      <div className="flex flex-col divide-y divide-gray-300">
        {sessions.length > 0 ? (
          <>
            {sessions.map((session) => (
              <SessionText
                key={`${session["Title"]} + ${session["Start time"]} + ${session["End time"]}`}
                session={session}
                locations={locations.filter((loc) =>
                  session["Location name"].includes(loc.Name)
                )}
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
    checkStringForSearch(search, session.Title ?? "") ||
    checkStringForSearch(search, session.Description ?? "") ||
    checkStringForSearch(
      search,
      (session["Host name"] ?? []).join(" ") ?? ""
    ) ||
    checkStringForSearch(search, session["Location name"].join(" ") ?? "")
  );
}

function checkStringForSearch(search: string, string: string) {
  return string.toLowerCase().includes(search.toLowerCase());
}
