import { describe, it, expect } from "vitest";
import {
  subtractBreakFromDuration,
  formatDuration,
  eventNameToSlug,
  eventSlugToName,
  dateOnDay,
  getPercentThroughDay,
  getNumHalfHours,
  getEndTimeMinusBreak,
} from "@/utils/utils";
import type { Day, Session } from "@/db/repositories/interfaces";

// ── subtractBreakFromDuration ────────────────────────────────────────────────

describe("subtractBreakFromDuration", () => {
  it("30 minutes → 25", () => expect(subtractBreakFromDuration(30)).toBe(25));
  it("60 minutes → 55", () => expect(subtractBreakFromDuration(60)).toBe(55));
  it("61 minutes → 51", () => expect(subtractBreakFromDuration(61)).toBe(51));
  it("120 minutes → 110", () =>
    expect(subtractBreakFromDuration(120)).toBe(110));
});

// ── formatDuration ───────────────────────────────────────────────────────────

describe("formatDuration", () => {
  it("45 short format → '45m'", () => expect(formatDuration(45)).toBe("45m"));
  it("45 long format → '45 minutes'", () =>
    expect(formatDuration(45, true)).toBe("45 minutes"));

  it("60 short format → '1h'", () => expect(formatDuration(60)).toBe("1h"));
  it("60 long format → '1 hour'", () =>
    expect(formatDuration(60, true)).toBe("1 hour"));

  it("90 short format → '1h 30m'", () =>
    expect(formatDuration(90)).toBe("1h 30m"));
  it("90 long format → '1 hour 30 minutes'", () =>
    expect(formatDuration(90, true)).toBe("1 hour 30 minutes"));

  it("120 short format → '2h'", () => expect(formatDuration(120)).toBe("2h"));
  it("120 long format → '2 hours'", () =>
    expect(formatDuration(120, true)).toBe("2 hours"));
});

// ── eventNameToSlug / eventSlugToName ────────────────────────────────────────

describe("eventNameToSlug", () => {
  it("replaces spaces with hyphens", () =>
    expect(eventNameToSlug("My Event")).toBe("My-Event"));

  it("multiple spaces", () =>
    expect(eventNameToSlug("Foo Bar Baz")).toBe("Foo-Bar-Baz"));
});

describe("eventSlugToName", () => {
  it("replaces hyphens with spaces", () =>
    expect(eventSlugToName("My-Event")).toBe("My Event"));

  it("round-trips simple names", () => {
    const name = "Conference Alpha";
    expect(eventSlugToName(eventNameToSlug(name))).toBe(name);
  });

  it("documents lossy behavior: hyphen in original name becomes space", () => {
    // "My-Event" as a name slugifies to "My-Event", which reads back as "My Event"
    expect(eventSlugToName(eventNameToSlug("My-Event"))).toBe("My Event");
  });
});

// ── dateOnDay ────────────────────────────────────────────────────────────────

const DAY: Day = {
  id: "d1",
  start: new Date("2025-06-15T08:00:00Z"),
  end: new Date("2025-06-15T18:00:00Z"),
  startBookings: new Date("2025-06-15T09:00:00Z"),
  endBookings: new Date("2025-06-15T17:00:00Z"),
};

describe("dateOnDay", () => {
  it("returns true when date equals day start", () =>
    expect(dateOnDay(new Date("2025-06-15T08:00:00Z"), DAY)).toBe(true));

  it("returns true when date is within the day", () =>
    expect(dateOnDay(new Date("2025-06-15T12:00:00Z"), DAY)).toBe(true));

  it("returns true when date equals day end", () =>
    expect(dateOnDay(new Date("2025-06-15T18:00:00Z"), DAY)).toBe(true));

  it("returns false when date is before the day", () =>
    expect(dateOnDay(new Date("2025-06-15T07:59:59Z"), DAY)).toBe(false));

  it("returns false when date is after the day", () =>
    expect(dateOnDay(new Date("2025-06-15T18:00:01Z"), DAY)).toBe(false));
});

// ── getPercentThroughDay ─────────────────────────────────────────────────────

describe("getPercentThroughDay", () => {
  const start = new Date("2025-06-15T08:00:00Z");
  const end = new Date("2025-06-15T18:00:00Z");

  it("returns 0% at the start", () =>
    expect(getPercentThroughDay(start, start, end)).toBe(0));

  it("returns 100% at the end", () =>
    expect(getPercentThroughDay(end, start, end)).toBe(100));

  it("returns 50% at the midpoint", () => {
    const mid = new Date("2025-06-15T13:00:00Z");
    expect(getPercentThroughDay(mid, start, end)).toBe(50);
  });
});

// ── getNumHalfHours ──────────────────────────────────────────────────────────

describe("getNumHalfHours", () => {
  it("0 when start equals end", () => {
    const t = new Date("2025-06-15T10:00:00Z");
    expect(getNumHalfHours(t, t)).toBe(0);
  });

  it("1 for a 30-minute window", () => {
    const start = new Date("2025-06-15T10:00:00Z");
    const end = new Date("2025-06-15T10:30:00Z");
    expect(getNumHalfHours(start, end)).toBe(1);
  });

  it("4 for a 2-hour window", () => {
    const start = new Date("2025-06-15T10:00:00Z");
    const end = new Date("2025-06-15T12:00:00Z");
    expect(getNumHalfHours(start, end)).toBe(4);
  });
});

// ── getEndTimeMinusBreak ─────────────────────────────────────────────────────

function makeSession(startTime: Date, endTime: Date): Session {
  return {
    id: "s1",
    title: "",
    description: "",
    capacity: 0,
    attendeeScheduled: true,
    blocker: false,
    closed: false,
    hosts: [],
    locations: [],
    numRsvps: 0,
    startTime,
    endTime,
  };
}

describe("getEndTimeMinusBreak", () => {
  it("≤60 min session: subtracts 5 minutes from end", () => {
    const start = new Date("2025-06-15T10:00:00Z");
    const end = new Date("2025-06-15T11:00:00Z"); // 60 minutes
    const adjusted = getEndTimeMinusBreak(makeSession(start, end));
    expect(adjusted.toJSDate().getTime()).toBe(
      new Date("2025-06-15T10:55:00Z").getTime()
    );
  });

  it(">60 min session: subtracts 10 minutes from end", () => {
    const start = new Date("2025-06-15T10:00:00Z");
    const end = new Date("2025-06-15T11:30:00Z"); // 90 minutes
    const adjusted = getEndTimeMinusBreak(makeSession(start, end));
    expect(adjusted.toJSDate().getTime()).toBe(
      new Date("2025-06-15T11:20:00Z").getTime()
    );
  });
});
