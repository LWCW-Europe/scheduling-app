import { base } from "./db";

export type RSVP = {
  Session: string[];
  Guest: string[];
};

export async function getRSVPsByUser(guestId?: string) {
  if (!guestId) return [];
  const rsvps: RSVP[] = [];
  await base<RSVP>("RSVPs")
    .select({
      fields: ["Session", "Guest"],
      filterByFormula: `{Guest ID} = "${guestId}"`,
    })
    .eachPage(function page(records, fetchNextPage) {
      records.forEach(function (record) {
        rsvps.push(record.fields);
      });
      fetchNextPage();
    });
  return rsvps;
}

export async function getRSVPsBySession(sessionId: string) {
  const rsvps: RSVP[] = [];
  await base<RSVP>("RSVPs")
    .select({
      fields: ["Session", "Guest"],
      filterByFormula: `{Session ID} = "${sessionId}"`,
    })
    .eachPage(function page(records, fetchNextPage) {
      records.forEach(function (record) {
        rsvps.push(record.fields);
      });
      fetchNextPage();
    });
  return rsvps;
}
