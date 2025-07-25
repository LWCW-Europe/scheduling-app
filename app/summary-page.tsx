import { Suspense } from "react";
import {
  ArrowRightIcon,
  CalendarIcon,
  LinkIcon,
} from "@heroicons/react/16/solid";
import { DateTime } from "luxon";
import Link from "next/link";
import { Event } from "@/db/events";
import { CONSTS } from "@/utils/constants";

export default function SummaryPage(props: { events: Event[] }) {
  const { events } = props;
  const sortedEvents = events.sort((a, b) => {
    return new Date(a.Start).getTime() - new Date(b.Start).getTime();
  });
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="mx-auto max-w-2xl">
        <h1 className="text-4xl font-bold mt-5">{CONSTS.TITLE}</h1>
        <p className="mt-3">{CONSTS.DESCRIPTION}</p>
        <div className="flex flex-col gap-8 sm:pl-5 mt-10">
          {sortedEvents.map((event) => (
            <div key={event.Name}>
              <h1 className="sm:text-2xl text-xl font-bold">{event.Name}</h1>
              <div className="flex text-gray-500 text-xs mt-1 gap-5 font-medium">
                <span className="flex gap-1 items-center">
                  <CalendarIcon className="3 w-3 stroke-2" />
                  <span>
                    {DateTime.fromISO(`${event.Start}T12:00:00.000-07:00`)
                      .setZone("America/Los_Angeles")
                      .toFormat("LLL d")}
                    {" - "}
                    {DateTime.fromISO(`${event.End}T12:00:00.000-07:00`)
                      .setZone("America/Los_Angeles")
                      .toFormat("LLL d")}
                  </span>
                </span>
                <a
                  className="flex gap-1 items-center hover:underline"
                  href={`https://${event.Website}`}
                >
                  <LinkIcon className="h-3 w-3 stroke-2" />
                  <span>{event.Website}</span>
                </a>
              </div>
              <p className="text-gray-900 mt-2">{event.Description}</p>
              <Link
                href={`/${event.Name.replace(" ", "-")}`}
                className="font-semibold text-rose-400 hover:text-rose-500 flex gap-1 items-center text-sm justify-end mt-2"
              >
                View schedule
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </Suspense>
  );
}
