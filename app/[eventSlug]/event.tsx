"use client";
import { ScheduleSettings } from "./schedule-settings";
import { DayGrid } from "./day-grid";
import { CalendarIcon, LinkIcon } from "@heroicons/react/24/outline";
import { DateTime } from "luxon";
import { useSearchParams } from "next/navigation";
import { DayText } from "./day-text";
import { Input } from "./input";
import { useState } from "react";
import { Day } from "@/db/days";
import { Event } from "@/db/events";
import { Guest } from "@/db/guests";
import { Location } from "@/db/locations";
import { RSVP } from "@/db/rsvps";
import { CONSTS } from "@/utils/constants";

export function EventDisplay(props: {
  event: Event;
  days: Day[];
  locations: Location[];
  guests: Guest[];
  rsvps: RSVP[];
}) {
  const { event, days, locations, guests, rsvps } = props;
  const daysForEvent = days.filter(
    (day) =>
      !CONSTS.MULTIPLE_EVENTS ||
      (day.EventName && day.EventName[0] === event.Name)
  );
  const locationsForEvent = locations.filter(
    (loc) =>
      !CONSTS.MULTIPLE_EVENTS ||
      (event["Location names"] && event["Location names"].includes(loc.Name))
  );
  const searchParams = useSearchParams();
  const view = searchParams.get("view") ?? "grid";
  const [search, setSearch] = useState("");
  const multipleDays = event["Start"] !== event["End"];
  return (
    <div className="flex flex-col items-start w-full">
      <h1 className="sm:text-4xl text-3xl font-bold mt-5">
        {event.Name} Schedule
      </h1>
      <div className="flex text-gray-500 text-sm mt-1 gap-5 font-medium">
        <span className="flex gap-1 items-center">
          <CalendarIcon className="h-4 w-4 stroke-2" />
          <span>
            {DateTime.fromFormat(event.Start, "yyyy-MM-dd", {
              zone: "America/Los_Angeles",
            }).toFormat("LLL d")}
            {multipleDays && (
              <>
                {" - "}
                {DateTime.fromFormat(event.End, "yyyy-MM-dd", {
                  zone: "America/Los_Angeles",
                }).toFormat("LLL d")}
              </>
            )}
          </span>
        </span>
        <a
          className="flex gap-1 items-center hover:underline"
          href={`https://${event.Website}`}
        >
          <LinkIcon className="h-4 w-4 stroke-2" />
          <span>{event.Website}</span>
        </a>
      </div>
      <p className="text-gray-900 mt-3 mb-5">{event.Description}</p>
      <div className="mb-10 w-full">
        <ScheduleSettings guests={guests} />
      </div>
      {view !== "grid" && (
        <Input
          className="max-w-3xl w-full mb-5 mx-auto"
          placeholder="Search sessions"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      )}
      <div className="flex flex-col gap-12 w-full">
        {daysForEvent.map((day) => (
          <div key={day.Start}>
            {view === "grid" ? (
              <DayGrid
                day={day}
                locations={locationsForEvent}
                guests={guests}
                rsvps={rsvps}
                eventName={event.Name}
              />
            ) : (
              <DayText
                day={day}
                search={search}
                locations={locationsForEvent}
                rsvps={view === "rsvp" ? rsvps : []}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
