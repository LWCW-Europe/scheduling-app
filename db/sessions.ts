import { getBase } from "./db";
import { CONSTS } from "@/utils/constants";

export type Session = {
  ID: string;
  Title: string;
  Description: string;
  "Start time": string;
  "End time": string;
  Hosts?: string[];
  "Host name"?: string[];
  "Host email"?: string;
  Location: string[];
  "Location name": string[];
  Capacity: number;
  "Num RSVPs": number;
  "Attendee scheduled": boolean;
  Blocker: boolean;
  // TODO: wrong type - this might be undefined (#278) - I believe that it always has 1 element or is undefined. The next comment is wrong.
  proposal: string[]; // always has 1 or 0 values (Airtable returns an array regardless)
  Event?: string;
};

const isScheduledFilter = "AND({Start time}, {End time}, {Location})";

export function getSessions() {
  return getSessionsByFormula(isScheduledFilter);
}

export function getSessionsByEvent(eventName: string) {
  const filterFormula = CONSTS.MULTIPLE_EVENTS
    ? `AND({Event name} = "${eventName}", ${isScheduledFilter})`
    : isScheduledFilter;
  return getSessionsByFormula(filterFormula);
}

async function getSessionsByFormula(filterFormula: string) {
  const sessions: Session[] = [];
  await getBase()<Session>("Sessions")
    .select({
      fields: [
        "Title",
        "Description",
        "Start time",
        "End time",
        "Hosts",
        "Host name",
        "Host email",
        "Location",
        "Location name",
        "Capacity",
        "Num RSVPs",
        "Attendee scheduled",
        "Blocker",
        "proposal",
        "Event",
      ],
      filterByFormula: filterFormula,
    })
    .eachPage(function page(records, fetchNextPage) {
      records.forEach(function (record) {
        sessions.push({
          ...record.fields,
          ID: record.id,
          "Attendee scheduled": !!record.fields["Attendee scheduled"],
          Blocker: !!record.fields["Blocker"],
          Event: record.fields.Event?.[0],
        });
      });
      fetchNextPage();
    });
  return sessions;
}
