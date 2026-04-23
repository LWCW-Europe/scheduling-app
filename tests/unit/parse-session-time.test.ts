import { describe, it, expect } from "vitest";
import { parseSessionTime } from "@/app/api/session-form-utils";
import type { Day } from "@/db/repositories/interfaces";

// day.start at noon UTC — dayISOFormatted is stable across timezones that
// differ from UTC by less than ±12 hours (covers all realistic CI environments)
const DAY: Day = {
  id: "d1",
  start: new Date("2025-06-15T12:00:00Z"),
  end: new Date("2025-06-15T22:00:00Z"),
  startBookings: new Date("2025-06-15T13:00:00Z"),
  endBookings: new Date("2025-06-15T21:00:00Z"),
  eventId: "e1",
};

// All assertions use UTC hours/minutes because the function hardcodes -07:00.
// e.g. 10:00 -07:00 = 17:00 UTC. The date component of dayISOFormatted may
// vary by timezone, but UTC time-of-day stays constant.

describe("parseSessionTime", () => {
  it("parses 10:00 AM (pins -07:00 behavior: 10:00 AM = 17:00 UTC)", () => {
    const { start } = parseSessionTime(DAY, "10:00 AM", 60);
    const d = new Date(start);
    expect(d.getUTCHours()).toBe(17);
    expect(d.getUTCMinutes()).toBe(0);
  });

  it("parses 12:00 PM (noon = 19:00 UTC)", () => {
    const { start } = parseSessionTime(DAY, "12:00 PM", 60);
    const d = new Date(start);
    expect(d.getUTCHours()).toBe(19);
    expect(d.getUTCMinutes()).toBe(0);
  });

  it("pins 12:00 AM behavior: treated as 12:00 not 00:00 (maps same as 12:00 PM)", () => {
    // Current implementation: ampm check is `=== "PM" && hourNum !== 12`, so AM at 12
    // is NOT converted to 0 — it stays as 12. This is the documented incorrect behavior.
    const { start } = parseSessionTime(DAY, "12:00 AM", 60);
    const d = new Date(start);
    expect(d.getUTCHours()).toBe(19); // same as 12:00 PM
    expect(d.getUTCMinutes()).toBe(0);
  });

  it("parses 01:05 PM and pads single-digit minutes", () => {
    const { start } = parseSessionTime(DAY, "01:05 PM", 60);
    const d = new Date(start);
    expect(d.getUTCHours()).toBe(20); // 13:05 - 07:00 = 20:05 UTC
    expect(d.getUTCMinutes()).toBe(5);
  });

  it("end is exactly duration minutes after start", () => {
    const { start, end } = parseSessionTime(DAY, "10:00 AM", 90);
    const diff = new Date(end).getTime() - new Date(start).getTime();
    expect(diff).toBe(90 * 60_000);
  });

  it("returns valid ISO strings", () => {
    const { start, end } = parseSessionTime(DAY, "02:00 PM", 45);
    expect(() => new Date(start)).not.toThrow();
    expect(() => new Date(end)).not.toThrow();
    expect(new Date(start).toISOString()).toBe(start);
    expect(new Date(end).toISOString()).toBe(end);
  });
});
