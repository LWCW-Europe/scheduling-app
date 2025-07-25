import { Day } from "@/db/days";
import { Location } from "@/db/locations";
import { Guest } from "@/db/guests";
import { Session } from "@/db/sessions";
import { DateTime } from "luxon";
import { CONSTS } from "@/utils/constants";

export type SessionParams = {
  id?: string;
  title: string;
  description: string;
  hosts: Guest[];
  location: Location;
  day: Day;
  startTimeString: string;
  duration: number;
};
export type SessionInsert = {
  Title: string;
  Description: string;
  "Start time": string;
  "End time": string;
  Hosts: string[];
  Location: string[];
  Event?: string[];
  "Attendee scheduled": boolean;
};

export function prepareToInsert(params: SessionParams): SessionInsert {
  const {
    title,
    description,
    hosts,
    location,
    day,
    startTimeString,
    duration,
  } = params;
    const dayStartDT = DateTime.fromJSDate(new Date(day.Start));
    const dayISOFormatted = dayStartDT.toFormat("yyyy-MM-dd");
    const [rawHour, rawMinute, ampm] = startTimeString.split(/[: ]/);
    const hourNum = parseInt(rawHour);
    const hour24Num = ampm === "PM" && hourNum !== 12 ? hourNum + 12 : hourNum;
    const hourStr = hour24Num < 10 ? `0${hour24Num}` : hour24Num.toString();
    const minuteNum = parseInt(rawMinute);
    const minuteStr = minuteNum < 10 ? `0${minuteNum}` : rawMinute;
    const startTimeStamp = new Date(
      `${dayISOFormatted}T${hourStr}:${minuteStr}:00-07:00`
    );
    const session: SessionInsert = {
      Title: title,
      Description: description,
      Hosts: hosts.map((host) => host.ID),
      Location: [location.ID],
      "Start time": startTimeStamp.toISOString(),
      "End time": new Date(
        startTimeStamp.getTime() + duration * 60 * 1000
      ).toISOString(),
      "Attendee scheduled": true,
    };
    if (CONSTS.MULTIPLE_EVENTS && day["Event"]) {
      session.Event = [day["Event"][0]];
    }
    return session;
}

export const validateSession = (
  session: SessionInsert,
  existingSessions: Session[]
) => {
  const sessionStart = new Date(session["Start time"]);
  const sessionEnd = new Date(session["End time"]);
  const sessionStartsBeforeEnds = sessionStart < sessionEnd;
  const sessionStartsAfterNow = sessionStart > new Date();
  const sessionsHere = existingSessions.filter((s) => {
    return s["Location"][0] === session["Location"][0];
  });
  const concurrentSessions = sessionsHere.filter((s) => {
    const sStart = new Date(s["Start time"]);
    const sEnd = new Date(s["End time"]);
    return (
      (sStart < sessionStart && sEnd > sessionStart) ||
      (sStart < sessionEnd && sEnd > sessionEnd) ||
      (sStart > sessionStart && sEnd < sessionEnd)
    );
  });
  const sessionValid =
    sessionStartsBeforeEnds &&
    sessionStartsAfterNow &&
    concurrentSessions.length === 0 &&
    session["Title"] &&
    session["Location"][0] &&
    session["Hosts"][0];
  return sessionValid;
};
