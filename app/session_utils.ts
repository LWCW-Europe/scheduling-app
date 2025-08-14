import type { Session } from "@/db/sessions";

export function newEmptySession(): Session {
  return {
    ID: "",
    Title: "",
    Description: "",
    "Start time": "",
    "End time": "",
    Hosts: [],
    Location: [],
    "Location name": [],
    Capacity: 0,
    "Num RSVPs": 0,
    "Attendee scheduled": true,
    Blocker: false,
  };
}

export function sessionsOverlap(ses1: Session, ses2: Session): boolean {
  if (
    ses1.ID === ses2.ID ||
    ses2["Start time"] === "" ||
    ses2["End time"] === ""
  ) {
    return false;
  }
  const startSes1 = new Date(ses1["Start time"]).getTime();
  const endSes1 = new Date(ses1["End time"]).getTime();
  const startSes2 = new Date(ses2["Start time"]).getTime();
  const endSes2 = new Date(ses2["End time"]).getTime();
  const maxStart = Math.max(startSes1, startSes2);
  const minEnd = Math.min(endSes1, endSes2);
  return maxStart < minEnd;
}
