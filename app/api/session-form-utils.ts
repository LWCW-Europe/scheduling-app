import type {
  Day,
  Location,
  Guest,
  Session,
  SessionCreateInput,
} from "@/db/repositories/interfaces";
import { DateTime } from "luxon";

export type SessionParams = {
  id?: string;
  title: string;
  description: string;
  closed: boolean;
  hosts: Guest[];
  location: Location;
  day: Day;
  startTimeMinutes: number;
  duration: number;
  proposal?: string;
  timezone: string;
};

export type SessionInterval = {
  start: Date;
  end: Date;
};

export function buildSessionInterval(
  day: Day,
  startTimeMinutes: number,
  durationMinutes: number,
  timezone: string
): SessionInterval {
  const dayStart = DateTime.fromJSDate(new Date(day.start)).setZone(timezone);
  const startDT = DateTime.fromObject(
    {
      year: dayStart.year,
      month: dayStart.month,
      day: dayStart.day,
      hour: Math.floor(startTimeMinutes / 60),
      minute: startTimeMinutes % 60,
    },
    { zone: timezone }
  );
  return {
    start: startDT.toJSDate(),
    end: startDT.plus({ minutes: durationMinutes }).toJSDate(),
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
    startTimeMinutes,
    duration,
  } = params;
  const { start, end } = buildSessionInterval(
    day,
    startTimeMinutes,
    duration,
    params.timezone
  );
  const input: SessionCreateInput = {
    title,
    description,
    closed,
    hostIds: hosts.map((host) => host.id),
    locationIds: [location.id],
    startTime: start,
    endTime: end,
    capacity: location.capacity ?? 0,
    attendeeScheduled: true,
    blocker: false,
    proposalId: params.proposal ?? undefined,
  };
  if (day.eventId) {
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
  const concurrentSessions = sessionsHere.filter((existing) => {
    const existingStart = existing.startTime ?? new Date(0);
    const existingEnd = existing.endTime ?? new Date(0);
    return existingStart < sessionEnd && existingEnd > sessionStart;
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
