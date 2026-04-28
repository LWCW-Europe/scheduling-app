import { describe, it, expect } from "vitest";
import { parseSessionTime } from "@/app/api/session-form-utils";
import type { Day } from "@/db/repositories/interfaces";

const DAY: Day = {
  id: "d1",
  start: new Date("2025-06-15T12:00:00Z"),
  end: new Date("2025-06-15T22:00:00Z"),
  startBookings: new Date("2025-06-15T13:00:00Z"),
  endBookings: new Date("2025-06-15T21:00:00Z"),
  eventId: "e1",
};

const TZ = "America/Los_Angeles"; // UTC-7 in June (PDT)

describe("parseSessionTime", () => {
  it("parses 10:00 AM in America/Los_Angeles (= 17:00 UTC)", () => {
    const { start } = parseSessionTime(DAY, "10:00 AM", 60, TZ);
    const d = new Date(start);
    expect(d.getUTCHours()).toBe(17);
    expect(d.getUTCMinutes()).toBe(0);
  });

  it("parses 12:00 PM (noon) in America/Los_Angeles (= 19:00 UTC)", () => {
    const { start } = parseSessionTime(DAY, "12:00 PM", 60, TZ);
    const d = new Date(start);
    expect(d.getUTCHours()).toBe(19);
    expect(d.getUTCMinutes()).toBe(0);
  });

  it("pins 12:00 AM behavior: treated as 12:00 not 00:00 (maps same as 12:00 PM)", () => {
    // ampm check is `=== "PM" && hourNum !== 12`, so AM at 12 is NOT converted
    // to 0 — it stays as 12. This is the documented incorrect behavior.
    const { start } = parseSessionTime(DAY, "12:00 AM", 60, TZ);
    const d = new Date(start);
    expect(d.getUTCHours()).toBe(19); // same as 12:00 PM
    expect(d.getUTCMinutes()).toBe(0);
  });

  it("parses 01:05 PM and pads single-digit minutes", () => {
    const { start } = parseSessionTime(DAY, "01:05 PM", 60, TZ);
    const d = new Date(start);
    expect(d.getUTCHours()).toBe(20); // 13:05 PDT = 20:05 UTC
    expect(d.getUTCMinutes()).toBe(5);
  });

  it("end is exactly duration minutes after start", () => {
    const { start, end } = parseSessionTime(DAY, "10:00 AM", 90, TZ);
    const diff = new Date(end).getTime() - new Date(start).getTime();
    expect(diff).toBe(90 * 60_000);
  });

  it("returns valid ISO strings", () => {
    const { start, end } = parseSessionTime(DAY, "02:00 PM", 45, TZ);
    expect(() => new Date(start)).not.toThrow();
    expect(() => new Date(end)).not.toThrow();
    expect(new Date(start).toISOString()).toBe(start);
    expect(new Date(end).toISOString()).toBe(end);
  });

  it("uses correct date in event timezone when day.start is at UTC midnight", () => {
    const dayUTC: Day = {
      ...DAY,
      start: new Date("2025-06-16T00:00:00Z"), // midnight UTC = June 15 in PDT
    };
    const { start } = parseSessionTime(dayUTC, "10:00 AM", 60, TZ);
    const d = new Date(start);
    // June 15 10:00 AM PDT = June 15 17:00 UTC
    expect(d.getUTCFullYear()).toBe(2025);
    expect(d.getUTCMonth()).toBe(5); // June
    expect(d.getUTCDate()).toBe(15);
    expect(d.getUTCHours()).toBe(17);
  });

  it("uses UTC for UTC timezone", () => {
    const { start } = parseSessionTime(DAY, "12:00 PM", 60, "UTC");
    const d = new Date(start);
    expect(d.getUTCHours()).toBe(12);
    expect(d.getUTCMinutes()).toBe(0);
  });
});
