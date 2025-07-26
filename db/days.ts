import { CONSTS } from "@/utils/constants";
import { base } from "./db";
import { Session } from "./sessions";

export type Day = {
  Start: string;
  End: string;
  StartBookings: string;
  EndBookings: string;
  EventName?: string;
  Event?: string[];
  ID: string;
  Sessions: Session[];
};

type DayRecord = {
  Start: string;
  End: string;
  "Start bookings": string;
  "End bookings": string;
  "Event name"?: string;
  Event?: string[];
};

export async function getDays() {
  return await getDaysByEvent(null);
}

export async function getDaysByEvent(eventName: string | null) {
  const days: Day[] = [];
  const filterFormula =
    CONSTS.MULTIPLE_EVENTS && eventName ? `{Event name} = "${eventName}"` : "1";
  const fieldsToFetch: (keyof DayRecord)[] = [
    "Start",
    "End",
    "Start bookings",
    "End bookings",
  ];
  if (CONSTS.MULTIPLE_EVENTS) {
    fieldsToFetch.push("Event name", "Event");
  }
  await base<DayRecord>("Days")
    .select({
      fields: fieldsToFetch,
      filterByFormula: filterFormula,
    })
    .eachPage(function page(records, fetchNextPage) {
      records.forEach(function (record) {
        days.push({
          Start: record.fields.Start,
          End: record.fields.End,
          StartBookings: record.fields["Start bookings"],
          EndBookings: record.fields["End bookings"],
          EventName: record.fields["Event name"],
          Event: record.fields.Event,

          Sessions: [],
          ID: record.id,
        });
      });
      fetchNextPage();
    });
  const sortedDays = days.sort((a, b) => {
    return new Date(a.Start).getTime() - new Date(b.Start).getTime();
  });
  return sortedDays;
}
