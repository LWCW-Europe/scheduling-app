import { describe, it, expect } from "vitest";
import { sessionsOverlap } from "@/app/session_utils";
import type { Session } from "@/db/repositories/interfaces";

function makeSession(id: string, start?: Date, end?: Date): Session {
  return {
    id,
    title: "",
    description: "",
    capacity: 0,
    attendeeScheduled: true,
    blocker: false,
    closed: false,
    hosts: [],
    locations: [],
    numRsvps: 0,
    startTime: start,
    endTime: end,
  };
}

// offsets in minutes from a fixed epoch
const t = (offsetMinutes: number) =>
  new Date(Date.UTC(2025, 0, 1, 12, 0, 0) + offsetMinutes * 60_000);

describe("sessionsOverlap", () => {
  it("returns false for disjoint sessions", () => {
    const a = makeSession("1", t(0), t(60));
    const b = makeSession("2", t(90), t(150));
    expect(sessionsOverlap(a, b)).toBe(false);
  });

  it("returns false for back-to-back (end === start)", () => {
    const a = makeSession("1", t(0), t(60));
    const b = makeSession("2", t(60), t(120));
    expect(sessionsOverlap(a, b)).toBe(false);
  });

  it("returns true for start-overlap", () => {
    const a = makeSession("1", t(0), t(60));
    const b = makeSession("2", t(30), t(90));
    expect(sessionsOverlap(a, b)).toBe(true);
  });

  it("returns true for end-overlap", () => {
    const a = makeSession("1", t(30), t(90));
    const b = makeSession("2", t(0), t(60));
    expect(sessionsOverlap(a, b)).toBe(true);
  });

  it("returns true when ses2 fully contains ses1", () => {
    const a = makeSession("1", t(30), t(60));
    const b = makeSession("2", t(0), t(120));
    expect(sessionsOverlap(a, b)).toBe(true);
  });

  it("returns true when ses1 fully contains ses2", () => {
    const a = makeSession("1", t(0), t(120));
    const b = makeSession("2", t(30), t(60));
    expect(sessionsOverlap(a, b)).toBe(true);
  });

  it("returns false when ses1.id === ses2.id", () => {
    const a = makeSession("same", t(0), t(60));
    const b = makeSession("same", t(0), t(60));
    expect(sessionsOverlap(a, b)).toBe(false);
  });

  it("returns false when ses2.startTime is undefined", () => {
    const a = makeSession("1", t(0), t(60));
    const b = makeSession("2", undefined, t(60));
    expect(sessionsOverlap(a, b)).toBe(false);
  });

  it("returns false when ses2.endTime is undefined", () => {
    const a = makeSession("1", t(0), t(60));
    const b = makeSession("2", t(0), undefined);
    expect(sessionsOverlap(a, b)).toBe(false);
  });

  it("pins behavior: ses1 undefined times fall back to 0ms epoch (zero-duration, no overlap)", () => {
    // ses1 startTime/endTime both undefined → both become 0ms, creating a zero-duration
    // interval [0, 0] at the epoch. maxStart=0, minEnd=0, 0 < 0 is false → no overlap.
    // A zero-duration interval never satisfies maxStart < minEnd.
    const a = makeSession("1", undefined, undefined);
    const b = makeSession("2", new Date(0), new Date(1000));
    expect(sessionsOverlap(a, b)).toBe(false);
  });
});
