import { describe, it, expect } from "vitest";
import { validateSession } from "@/app/api/session-form-utils";
import type { Session, SessionCreateInput } from "@/db/repositories/interfaces";

const LOC_A = "loc-a";
const LOC_B = "loc-b";

// minutes from now
const fromNow = (minutes: number) => new Date(Date.now() + minutes * 60_000);

function makeInput(
  overrides?: Partial<SessionCreateInput>
): SessionCreateInput {
  return {
    title: "Test Session",
    description: "",
    capacity: 30,
    attendeeScheduled: true,
    blocker: false,
    closed: false,
    hostIds: ["host-1"],
    locationIds: [LOC_A],
    startTime: fromNow(60),
    endTime: fromNow(120),
    ...overrides,
  };
}

function makeExisting(
  start: Date,
  end: Date,
  locationId: string = LOC_A
): Session {
  return {
    id: "existing-1",
    title: "Existing",
    description: "",
    capacity: 30,
    attendeeScheduled: true,
    blocker: false,
    closed: false,
    hosts: [],
    locations: [{ id: locationId, name: "Room", color: "#000" }],
    numRsvps: 0,
    startTime: start,
    endTime: end,
  };
}

describe("validateSession", () => {
  it("accepts a valid session with no existing sessions", () => {
    expect(validateSession(makeInput(), [])).toBeTruthy();
  });

  it("rejects when start >= end", () => {
    const input = makeInput({
      startTime: fromNow(120),
      endTime: fromNow(60),
    });
    expect(validateSession(input, [])).toBeFalsy();
  });

  it("rejects when start equals end", () => {
    const t = fromNow(60);
    expect(
      validateSession(makeInput({ startTime: t, endTime: t }), [])
    ).toBeFalsy();
  });

  it("rejects when start is in the past", () => {
    const input = makeInput({
      startTime: fromNow(-60),
      endTime: fromNow(60),
    });
    expect(validateSession(input, [])).toBeFalsy();
  });

  it("rejects when title is missing", () => {
    expect(validateSession(makeInput({ title: "" }), [])).toBeFalsy();
  });

  it("rejects when hostIds is empty", () => {
    expect(validateSession(makeInput({ hostIds: [] }), [])).toBeFalsy();
  });

  it("rejects when locationIds is empty", () => {
    expect(validateSession(makeInput({ locationIds: [] }), [])).toBeFalsy();
  });

  it("rejects partial overlap in same location (start-overlap)", () => {
    const existing = makeExisting(fromNow(30), fromNow(90));
    const input = makeInput({ startTime: fromNow(60), endTime: fromNow(120) });
    expect(validateSession(input, [existing])).toBeFalsy();
  });

  it("rejects partial overlap in same location (end-overlap)", () => {
    const existing = makeExisting(fromNow(90), fromNow(150));
    const input = makeInput({ startTime: fromNow(60), endTime: fromNow(120) });
    expect(validateSession(input, [existing])).toBeFalsy();
  });

  it("rejects when existing session is fully contained within new session", () => {
    const existing = makeExisting(fromNow(70), fromNow(110));
    const input = makeInput({ startTime: fromNow(60), endTime: fromNow(120) });
    expect(validateSession(input, [existing])).toBeFalsy();
  });

  it("accepts back-to-back sessions in same location", () => {
    const existing = makeExisting(fromNow(0), fromNow(60));
    const input = makeInput({ startTime: fromNow(60), endTime: fromNow(120) });
    expect(validateSession(input, [existing])).toBeTruthy();
  });

  it("accepts overlapping sessions in different locations", () => {
    const existing = makeExisting(fromNow(60), fromNow(120), LOC_B);
    const input = makeInput({
      startTime: fromNow(60),
      endTime: fromNow(120),
      locationIds: [LOC_A],
    });
    expect(validateSession(input, [existing])).toBeTruthy();
  });

  // finding #5: validateSession misses boundary-coincidence overlaps
  // These are expected-correct assertions; they will fail until the overlap logic is fixed.

  it.fails("rejects identical interval in same location (finding #5)", () => {
    const existing = makeExisting(fromNow(60), fromNow(120));
    const input = makeInput({ startTime: fromNow(60), endTime: fromNow(120) });
    expect(validateSession(input, [existing])).toBeFalsy();
  });

  it("rejects same-start longer-end in same location", () => {
    // existing starts at same time but runs longer — caught by condition 2 (sStart < sessionEnd && sEnd > sessionEnd)
    const existing = makeExisting(fromNow(60), fromNow(180));
    const input = makeInput({ startTime: fromNow(60), endTime: fromNow(120) });
    expect(validateSession(input, [existing])).toBeFalsy();
  });

  it("rejects same-end earlier-start in same location", () => {
    // existing starts earlier and ends at same time — caught by condition 1 (sStart < sessionStart && sEnd > sessionStart)
    const existing = makeExisting(fromNow(30), fromNow(120));
    const input = makeInput({ startTime: fromNow(60), endTime: fromNow(120) });
    expect(validateSession(input, [existing])).toBeFalsy();
  });
});
