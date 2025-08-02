import { CONSTS } from "@/utils/constants";
import { base } from "./db";

// Private: Raw type as it comes from Airtable (all strings) - internal use only
type _RawEvent = {
  ID: string;
  Name: string;
  Description: string;
  Website: string;
  Guests?: string[];
  Start: string;
  End: string;
  proposalPhaseStart?: string;
  proposalPhaseEnd?: string;
  votingPhaseStart?: string;
  votingPhaseEnd?: string;
  schedulingPhaseStart?: string;
  schedulingPhaseEnd?: string;
  "Location names"?: string[];
};

// Processed type with Date objects
export type Event = {
  ID: string;
  Name: string;
  Description: string;
  Website: string;
  Guests?: string[];
  Start: string;
  End: string;
  proposalPhaseStart?: Date;
  proposalPhaseEnd?: Date;
  votingPhaseStart?: Date;
  votingPhaseEnd?: Date;
  schedulingPhaseStart?: Date;
  schedulingPhaseEnd?: Date;
  "Location names"?: string[];
};

const eventFields: (keyof _RawEvent)[] = [
  "Name",
  "Description",
  "Website",
  "Start",
  "End",
  "proposalPhaseStart",
  "proposalPhaseEnd",
  "votingPhaseStart",
  "votingPhaseEnd",
  "schedulingPhaseStart",
  "schedulingPhaseEnd",
];

const fieldsIfMultipleEvents: (keyof _RawEvent)[] = [
  "Guests",
  "Location names",
];

// Helper function to convert date string fields to Date objects
function convertEventDates(fields: _RawEvent, id: string): Event {
  return {
    ...fields,
    ID: id,
    proposalPhaseStart: fields.proposalPhaseStart
      ? new Date(fields.proposalPhaseStart)
      : undefined,
    proposalPhaseEnd: fields.proposalPhaseEnd
      ? new Date(fields.proposalPhaseEnd)
      : undefined,
    votingPhaseStart: fields.votingPhaseStart
      ? new Date(fields.votingPhaseStart)
      : undefined,
    votingPhaseEnd: fields.votingPhaseEnd
      ? new Date(fields.votingPhaseEnd)
      : undefined,
    schedulingPhaseStart: fields.schedulingPhaseStart
      ? new Date(fields.schedulingPhaseStart)
      : undefined,
    schedulingPhaseEnd: fields.schedulingPhaseEnd
      ? new Date(fields.schedulingPhaseEnd)
      : undefined,
  };
}

export async function getEvents() {
  const events: Event[] = [];
  await base<_RawEvent>("Events")
    .select({
      fields: [
        ...eventFields,
        ...(CONSTS.MULTIPLE_EVENTS ? fieldsIfMultipleEvents : []),
      ],
    })
    .eachPage(function page(records, fetchNextPage) {
      records.forEach(function (record) {
        if (record.fields.Start && record.fields.End) {
          events.push(convertEventDates(record.fields, record.getId()));
        }
      });
      fetchNextPage();
    });
  return events;
}

export async function getEventByName(name: string) {
  const events: Event[] = [];
  await base<_RawEvent>("Events")
    .select({
      fields: [
        ...eventFields,
        ...(CONSTS.MULTIPLE_EVENTS ? fieldsIfMultipleEvents : []),
      ],
      filterByFormula: `{Name} = "${name}"`,
    })
    .eachPage(function page(records, fetchNextPage) {
      records.forEach(function (record) {
        events.push(convertEventDates(record.fields, record.getId()));
      });
      fetchNextPage();
    });
  return events[0];
}
