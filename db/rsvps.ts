import { getBase } from "./db";

export type RSVP = {
  Session: string[];
  Guest: string[];
};

export async function getRSVPsByUser(guestId?: string) {
  if (!guestId) return [];
  const rsvps: RSVP[] = [];
  await getBase()<RSVP>("RSVPs")
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
  await getBase()<RSVP>("RSVPs")
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

export function deleteRSVPsFromSessionByUsers(
  sessionId: string,
  users: string[]
) {
  const isOneOfUsers = `OR(${users.map((user) => `{Guest ID} = "${user}"`).join(", ")})`;
  void getBase()("RSVPs")
    .select({
      filterByFormula: `AND(${isOneOfUsers}, {Session ID} = "${sessionId}")`,
    })
    .eachPage(function page(records, fetchNextPage) {
      const ids = records.map((rec) => rec.getId());
      if (ids.length > 0) {
        void getBase()("RSVPs").destroy(ids);
      }
      fetchNextPage();
    });
}
