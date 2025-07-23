import { CONSTS } from "@/utils/constants";
import { base } from "./db";

export type Event = {
  Name: string;
  Description: string;
  Website: string;
  Guests?: string[];
  Start: string;
  End: string;
  "Location names"?: string[];
};

const eventFields: (keyof Event)[] = [
  "Name",
  "Description",
  "Website",
  "Start",
  "End",
];

const fieldsIfMultipleEvents: (keyof Event)[] = ["Guests", "Location names"];

export async function getEvents() {
  const events: Event[] = [];
  await base<Event>("Events")
    .select({
      fields: [
        ...eventFields,
        ...(CONSTS.MULTIPLE_EVENTS ? fieldsIfMultipleEvents : []),
      ],
    })
    .eachPage(function page(records, fetchNextPage) {
      records.forEach(function (record) {
        if (record.fields.Start && record.fields.End) {
          events.push(record.fields);
        }
      });
      fetchNextPage();
    });
  return events;
}

export async function getEventByName(name: string) {
  const events: Event[] = [];
  await base<Event>("Events")
    .select({
      fields: [
        ...eventFields,
        ...(CONSTS.MULTIPLE_EVENTS ? fieldsIfMultipleEvents : []),
      ],
      filterByFormula: `{Name} = "${name}"`,
    })
    .eachPage(function page(records, fetchNextPage) {
      records.forEach(function (record) {
        events.push(record.fields);
      });
      fetchNextPage();
    });
  return events[0];
}
