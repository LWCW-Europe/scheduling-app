"use client";
import { ScheduleSettings } from "./schedule-settings";
import { DayGrid } from "./day-grid";
import {
  CalendarIcon,
  LinkIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import { DateTime } from "luxon";
import { useSearchParams } from "next/navigation";
import { DayText } from "./day-text";
import { Input } from "./input";
import { useState, useContext } from "react";
import { CONSTS } from "@/utils/constants";
import { EventContext } from "../context";
import { hasPhases } from "@/app/utils/events";
import Link from "next/link";
import { eventNameToSlug } from "@/utils/utils";

export function EventDisplay() {
  const { event, days, locations, guests, rsvps } = useContext(EventContext);
  const searchParams = useSearchParams();
  const view = searchParams.get("view") ?? "grid";
  const [search, setSearch] = useState("");

  if (!event) return <div>No event data available</div>;

  const eventSlug = eventNameToSlug(event.name);

  const daysForEvent = days.filter(
    (day) => !CONSTS.MULTIPLE_EVENTS || day.eventId === event.id
  );
  const locationsForEvent = locations;
  const multipleDays = event.start.getTime() !== event.end.getTime();

  return (
    <div className="flex flex-col items-start w-full">
      <h1 className="sm:text-4xl text-3xl font-bold mt-5">
        {event.name} Schedule
      </h1>
      <div className="flex text-gray-500 text-sm mt-1 gap-5 font-medium">
        <span className="flex gap-1 items-center">
          <CalendarIcon className="h-4 w-4 stroke-2" />
          <span>
            {DateTime.fromJSDate(event.start)
              .setZone("America/Los_Angeles")
              .toFormat("LLL d")}
            {multipleDays && (
              <>
                {" - "}
                {DateTime.fromJSDate(event.end)
                  .setZone("America/Los_Angeles")
                  .toFormat("LLL d")}
              </>
            )}
          </span>
        </span>
        <a
          className="flex gap-1 items-center hover:underline"
          href={`https://${event.website}`}
        >
          <LinkIcon className="h-4 w-4 stroke-2" />
          <span>{event.website}</span>
        </a>
      </div>
      <p className="text-gray-900 mt-3 mb-5">{event.description}</p>
      {hasPhases(event) && (
        <div className="mb-5">
          <Link
            href={`/${eventNameToSlug(event.name)}/proposals`}
            className={`bg-rose-400 hover:bg-rose-500 transition-colors text-white px-4 py-2 rounded-md flex items-center gap-2`}
          >
            <ClipboardDocumentListIcon className="h-4 w-4" />
            View Session Proposals
          </Link>
        </div>
      )}
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
          <div key={day.id}>
            {view === "grid" ? (
              <DayGrid
                day={day}
                locations={locationsForEvent}
                guests={guests}
                eventName={event.name}
              />
            ) : (
              <DayText
                day={day}
                search={search}
                locations={locationsForEvent}
                rsvps={view === "rsvp" ? rsvps : []}
                eventSlug={eventSlug}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
