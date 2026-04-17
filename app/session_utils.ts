import type { Session } from "@/db/repositories/interfaces";

export function newEmptySession(): Session {
  return {
    id: "",
    title: "",
    description: "",
    startTime: undefined,
    endTime: undefined,
    hosts: [],
    locations: [],
    capacity: 0,
    numRsvps: 0,
    attendeeScheduled: true,
    blocker: false,
    closed: false,
    proposalId: undefined,
    eventId: undefined,
  };
}

export function sessionsOverlap(ses1: Session, ses2: Session): boolean {
  if (ses1.id === ses2.id || !ses2.startTime || !ses2.endTime) {
    return false;
  }
  const startSes1 = ses1.startTime?.getTime() ?? 0;
  const endSes1 = ses1.endTime?.getTime() ?? 0;
  const startSes2 = ses2.startTime.getTime();
  const endSes2 = ses2.endTime.getTime();
  const maxStart = Math.max(startSes1, startSes2);
  const minEnd = Math.min(endSes1, endSes2);
  return maxStart < minEnd;
}
