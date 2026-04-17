import type {
  Day,
  Location,
  Guest,
  Session,
  SessionCreateInput,
} from "@/db/repositories/interfaces";
import { DateTime } from "luxon";
import { CONSTS } from "@/utils/constants";

export type SessionParams = {
  id?: string;
  title: string;
  description: string;
  closed: boolean;
  hosts: Guest[];
  location: Location;
  day: Day;
  startTimeString: string;
  duration: number;
  proposal?: string;
};

export type SessionInterval = {
  start: string;
  end: string;
};

export function parseSessionTime(
  day: Day,
  startTimeString: string,
  duration: number
): SessionInterval {
  const dayStartDT = DateTime.fromJSDate(day.start);
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
  return {
    start: startTimeStamp.toISOString(),
    end: new Date(
      startTimeStamp.getTime() + duration * 60 * 1000
    ).toISOString(),
  };
}

export function prepareToInsert(params: SessionParams): SessionCreateInput {
  const {
    title,
    description,
    closed,
    hosts,
    location,
    day,
    startTimeString,
    duration,
  } = params;
  const { start, end } = parseSessionTime(day, startTimeString, duration);
  const input: SessionCreateInput = {
    title,
    description,
    closed,
    hostIds: hosts.map((host) => host.id),
    locationIds: [location.id],
    startTime: new Date(start),
    endTime: new Date(end),
    capacity: location.capacity ?? 0,
    attendeeScheduled: true,
    blocker: false,
    proposalId: params.proposal ?? undefined,
  };
  if (CONSTS.MULTIPLE_EVENTS && day.eventId) {
    input.eventId = day.eventId;
  }
  return input;
}

export const validateSession = (
  session: SessionCreateInput,
  existingSessions: Session[]
) => {
  const sessionStart = session.startTime ?? new Date(0);
  const sessionEnd = session.endTime ?? new Date(0);
  const sessionStartsBeforeEnds = sessionStart < sessionEnd;
  const sessionStartsAfterNow = sessionStart > new Date();
  const sessionsHere = existingSessions.filter((s) => {
    return s.locations.some((l) => l.id === session.locationIds[0]);
  });
  const concurrentSessions = sessionsHere.filter((s) => {
    const sStart = s.startTime ?? new Date(0);
    const sEnd = s.endTime ?? new Date(0);
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
    session.title &&
    session.locationIds[0] &&
    session.hostIds[0];
  return sessionValid;
};
