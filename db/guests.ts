import { CONSTS } from "@/utils/constants";
import { getBase } from "./db";

export type Guest = {
  Name: string;
  Email: string;
  ID: string;
};
export async function getGuests() {
  const guests: Guest[] = [];
  await getBase()<Guest>("Guests")
    .select({
      fields: ["Name", "Email"],
    })
    .eachPage(function page(records, fetchNextPage) {
      records.forEach(function (record) {
        guests.push({ ...record.fields, ID: record.id });
      });
      fetchNextPage();
    });
  return guests;
}

export async function getGuestsByEvent(eventName: string) {
  const guests: Guest[] = [];
  const filterFormula = CONSTS.MULTIPLE_EVENTS
    ? `SEARCH("${eventName}", {Events}) != 0`
    : "1";
  await getBase()<Guest>("Guests")
    .select({
      fields: ["Name", "Email"],
      filterByFormula: filterFormula,
    })
    .eachPage(function page(records, fetchNextPage) {
      records.forEach(function (record) {
        guests.push({ ...record.fields, ID: record.id });
      });
      fetchNextPage();
    });
  return guests;
}
