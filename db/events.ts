import { CONSTS } from "@/utils/constants";
import { getBase } from "./db";

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

const coreEventFields: (keyof _RawEvent)[] = [
  "Name",
  "Description",
  "Website",
  "Start",
  "End",
];

const phaseFields: (keyof _RawEvent)[] = [
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

// Helper function to get fields that exist in the table
function getEventFieldsToQuery(): (keyof _RawEvent)[] {
  // Always include core fields and conditional fields
  const fields = [
    ...coreEventFields,
    ...(CONSTS.MULTIPLE_EVENTS ? fieldsIfMultipleEvents : []),
  ];

  // Try to include phase fields, but we'll handle errors if they don't exist
  return [...fields, ...phaseFields];
}

// Helper function to safely query events with error handling for missing fields
async function queryEventsWithFallback<T>(
  queryFn: (fields: (keyof _RawEvent)[]) => Promise<T>
): Promise<T> {
  try {
    // First try with all fields including phase fields
    return await queryFn(getEventFieldsToQuery());
  } catch (error: unknown) {
    // If we get an unknown field error, try again without phase fields
    const isAirtableError =
      error &&
      typeof error === "object" &&
      ("error" in error || "message" in error);

    if (isAirtableError) {
      const errorObj = error as { error?: string; message?: string };
      const isUnknownFieldError =
        errorObj.error === "UNKNOWN_FIELD_NAME" ||
        (errorObj.message && errorObj.message.includes("Unknown field name"));

      if (isUnknownFieldError) {
        console.warn(
          "Phase fields not found in Airtable, querying without them:",
          errorObj.message || errorObj.error
        );
        const fieldsWithoutPhases = [
          ...coreEventFields,
          ...(CONSTS.MULTIPLE_EVENTS ? fieldsIfMultipleEvents : []),
        ];
        return await queryFn(fieldsWithoutPhases);
      }
    }
    throw error;
  }
}

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
  return await queryEventsWithFallback(async (fields) => {
    const events: Event[] = [];
    await getBase()<_RawEvent>("Events")
      .select({
        fields,
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
  });
}

export async function getEventByName(name: string) {
  return await queryEventsWithFallback(async (fields) => {
    const events: Event[] = [];
    await getBase()<_RawEvent>("Events")
      .select({
        fields,
        filterByFormula: `{Name} = "${name}"`,
      })
      .eachPage(function page(records, fetchNextPage) {
        records.forEach(function (record) {
          events.push(convertEventDates(record.fields, record.getId()));
        });
        fetchNextPage();
      });
    return events[0];
  });
}
