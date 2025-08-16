"use client";

import Link from "next/link";
import { DateTime } from "luxon";

import type { Event } from "@/db/events";
import type { Guest } from "@/db/guests";
import type { Session } from "@/db/sessions";
import { getEndTimeMinusBreak } from "@/utils/utils";

export function ViewSession(props: {
  session: Session;
  guests: Guest[];
  eventSlug: string;
  event: Event;
  showBackBtn: boolean;
  isInModal?: boolean;
}) {
  const {
    session,
    guests,
    eventSlug,
    event,
    showBackBtn,
    isInModal = false,
  } = props;
  return (
    <div
      className={`${isInModal ? "w-full p-6" : "max-w-2xl mx-auto"} pb-12 break-words overflow-hidden`}
    >
      {showBackBtn && (
        <Link
          className="bg-rose-400 text-white font-semibold py-2 px-4 rounded shadow hover:bg-rose-500 active:bg-rose-500 w-fit px-12"
          href={`/${eventSlug}`}
        >
          Back to {event.Name}
        </Link>
      )}
      <p className="text-xl font-semibold mb-2 mt-5" id="title">
        {session.Title}
      </p>
      <p className="text-lg font-medium text-gray-700 mb-4">
        {session
          .Hosts!.map((h) => guests.find((g) => g.ID === h))
          .map((g) => g?.Name)
          .join(", ")}
      </p>
      <p className="mb-3 whitespace-pre-line">{session.Description}</p>
      <div className="flex gap-1 mb-4 font-semibold">
        {session["Location name"]}
      </div>
      <div className="flex gap-1 mb-4">
        <span>
          {DateTime.fromISO(session["Start time"])
            .setZone("America/Los_Angeles")
            .toFormat("EEEE h:mm a")}{" "}
          -{" "}
          {getEndTimeMinusBreak(session)
            .setZone("America/Los_Angeles")
            .toFormat("h:mm a")}
        </span>
      </div>
      <p>
        {session["Num RSVPs"]} RSVP{session["Num RSVPs"] === 1 ? "" : "s"}
      </p>
    </div>
  );
}
