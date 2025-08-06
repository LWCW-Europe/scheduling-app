import { Day } from "@/db/days";

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
