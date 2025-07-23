import { Session } from "@/db/sessions";
import { Day } from "@/db/days";
import { Location } from "@/db/locations";
import { Guest } from "@/db/guests";
import { RSVP } from "@/db/rsvps";
import { SessionBlock } from "./session-block";
import { getNumHalfHours } from "@/utils/utils";
import clsx from "clsx";

export function LocationCol(props: {
  eventName: string;
  sessions: Session[];
  location: Location;
  day: Day;
  guests: Guest[];
  rsvps: RSVP[];
}) {
  const { eventName, sessions, location, day, guests, rsvps } = props;
  const sessionsWithBlanks = insertBlankSessions(
    sessions,
    new Date(day.Start),
    new Date(day.End)
  );
  const numHalfHours = getNumHalfHours(new Date(day.Start), new Date(day.End));
  return (
    <div className={"px-0.5"}>
      <div
        className={clsx(
          "grid h-full",
          `grid-rows-[repeat(${numHalfHours},44px)]`
        )}
      >
        {sessionsWithBlanks.map((session) => {
          const filteredRSVPs = rsvps.filter(
            (rsvp) => rsvp.Session?.[0] === session.ID
          );
          return (
            <SessionBlock
              eventName={eventName}
              day={day}
              key={session["Start time"]}
              session={session}
              location={location}
              guests={guests}
              rsvpsForEvent={filteredRSVPs}
            />
          );
        })}
      </div>
    </div>
  );
}

function insertBlankSessions(
  sessions: Session[],
  dayStart: Date,
  dayEnd: Date
) {
  const sessionsWithBlanks: Session[] = [];
  for (
    let currentTime = dayStart.getTime();
    currentTime < dayEnd.getTime();
    currentTime += 1800000
  ) {
    const sessionNow = sessions.find((session) => {
      const startTime = new Date(session["Start time"]).getTime();
      const endTime = new Date(session["End time"]).getTime();
      return startTime <= currentTime && endTime > currentTime;
    });
    if (sessionNow) {
      if (new Date(sessionNow["Start time"]).getTime() === currentTime) {
        sessionsWithBlanks.push(sessionNow);
      } else {
        continue;
      }
    } else {
      sessionsWithBlanks.push({
        "Start time": new Date(currentTime).toISOString(),
        "End time": new Date(currentTime + 1800000).toISOString(),
        Title: "",
        Description: "",
        Hosts: [],
        "Host name": [],
        "Host email": "",
        Location: [],
        "Location name": [""],
        Capacity: 0,
        "Num RSVPs": 0,
        ID: "",
      });
    }
  }
  return sessionsWithBlanks;
}
