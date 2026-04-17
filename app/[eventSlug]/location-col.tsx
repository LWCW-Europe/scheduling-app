import type { Session, Location, Guest } from "@/db/repositories/interfaces";
import type { DayWithSessions } from "@/app/context";
import { SessionBlock } from "./session-block";
import { getNumHalfHours } from "@/utils/utils";
import clsx from "clsx";

export function LocationCol(props: {
  eventName: string;
  sessions: Session[];
  location: Location;
  day: DayWithSessions;
  guests: Guest[];
}) {
  const { eventName, sessions, location, day, guests } = props;
  const sessionsWithBlanks = insertBlankSessions(sessions, day.start, day.end);
  const numHalfHours = getNumHalfHours(day.start, day.end);
  return (
    <div className={"px-0.5"}>
      <div
        className={clsx(
          "grid h-full",
          `grid-rows-[repeat(${numHalfHours},44px)]`
        )}
      >
        {sessionsWithBlanks.map((session) => {
          return (
            <SessionBlock
              eventName={eventName}
              day={day}
              key={session.startTime?.toISOString() ?? session.id}
              session={session}
              location={location}
              guests={guests}
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
): Session[] {
  const sessionsWithBlanks: Session[] = [];
  for (
    let currentTime = dayStart.getTime();
    currentTime < dayEnd.getTime();
    currentTime += 1800000
  ) {
    const sessionNow = sessions.find((session) => {
      const startTime = session.startTime?.getTime() ?? 0;
      const endTime = session.endTime?.getTime() ?? 0;
      return startTime <= currentTime && endTime > currentTime;
    });
    if (sessionNow) {
      if ((sessionNow.startTime?.getTime() ?? 0) === currentTime) {
        sessionsWithBlanks.push(sessionNow);
      } else {
        continue;
      }
    } else {
      sessionsWithBlanks.push({
        startTime: new Date(currentTime),
        endTime: new Date(currentTime + 1800000),
        title: "",
        description: "",
        hosts: [],
        locations: [],
        capacity: 0,
        numRsvps: 0,
        id: "",
        attendeeScheduled: false,
        blocker: false,
        closed: false,
      });
    }
  }
  return sessionsWithBlanks;
}
