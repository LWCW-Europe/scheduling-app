import { Day } from "@/db/days";
import type { Session } from "@/db/sessions";
import { DateTime } from "luxon";

export const getPercentThroughDay = (now: Date, start: Date, end: Date) =>
  ((now.getTime() - start.getTime()) / (end.getTime() - start.getTime())) * 100;

export const getNumHalfHours = (start: Date, end: Date) => {
  const lengthOfDay = end.getTime() - start.getTime();
  return lengthOfDay / 1000 / 60 / 30;
};

export const convertParamDateTime = (date: string, time: string) => {
  return new Date(`2025-${date}T${time}:00+02:00`);
};

export const dateOnDay = (date: Date, day: Day) => {
  return (
    date.getTime() >= new Date(day.Start).getTime() &&
    date.getTime() <= new Date(day.End).getTime()
  );
};

export function eventNameToSlug(name: string): string {
  return name.replace(/ /g, "-");
}

export function eventSlugToName(slug: string): string {
  return slug.replace(/-/g, " ");
}

/**
 * Calculate adjusted duration by subtracting break time
 * Rule: ≤60 minutes subtract 5 minutes, >60 minutes subtract 10 minutes
 */
export function subtractBreakFromDuration(durationMinutes: number): number {
  return durationMinutes <= 60 ? durationMinutes - 5 : durationMinutes - 10;
}

/**
 * Format duration minutes into a string (e.g., "25m", "1h 20m", "2 hours 50 minutes")
 */
export function formatDuration(
  minutes: number,
  longFormat: boolean = false
): string {
  const minuteString = longFormat ? " minutes" : "m";
  if (minutes < 60) return `${minutes}${minuteString}`;
  const hours = Math.floor(minutes / 60);
  const hourString = longFormat ? (hours === 1 ? " hour" : " hours") : "h";
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0
    ? `${hours}${hourString} ${remainingMinutes}${minuteString}`
    : `${hours}${hourString}`;
}

/**
 * Calculate the adjusted end time for a session, accounting for enforced breaks.
 * Rule: ≤60 minutes subtract 5 minutes, >60 minutes subtract 10 minutes
 *
 * Note: This is only used for DISPLAY purposes on existing sessions.
 */
export function getEndTimeMinusBreak(session: Session): DateTime {
  const startTime = DateTime.fromISO(session["Start time"]);
  const endTime = DateTime.fromISO(session["End time"]);
  const originalDurationMs = endTime.toMillis() - startTime.toMillis();
  const originalDurationMinutes = originalDurationMs / (1000 * 60);

  const adjustedDurationMinutes = subtractBreakFromDuration(
    originalDurationMinutes
  );

  return startTime.plus({ minutes: adjustedDurationMinutes });
}
