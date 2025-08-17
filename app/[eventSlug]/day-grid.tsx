"use client";
import { LocationCol } from "./location-col";
import clsx from "clsx";
import { useSearchParams } from "next/navigation";
import { getNumHalfHours } from "@/utils/utils";
import { useSafeLayoutEffect } from "@/utils/hooks";
import { useRef, useState } from "react";
import Image from "next/image";
import { Tooltip } from "./tooltip";
import { DateTime } from "luxon";
import { Day } from "@/db/days";
import { Guest } from "@/db/guests";
import { Location } from "@/db/locations";

export function DayGrid(props: {
  eventName: string;
  locations: Location[];
  day: Day;
  guests: Guest[];
}) {
  const { eventName, day, locations, guests } = props;
  const searchParams = useSearchParams();
  const locParams = searchParams?.getAll("loc");
  const locationsFromParams = locations.filter((loc) =>
    locParams?.includes(loc.Name)
  );
  const includedLocations =
    locationsFromParams.length === 0 ? locations : locationsFromParams;
  const numLocations = includedLocations.length;
  const start = new Date(day.Start);
  const end = new Date(day.End);
  const scrollableDivRef = useRef<HTMLDivElement>(null);
  const [scrolledToRightEnd, setScrolledToRightEnd] = useState(false);
  const [scrolledToLeftEnd, setScrolledToLeftEnd] = useState(true);
  // Now that the festival is over, show entire schedule by default
  const [expanded, setExpanded] = useState(true);
  // Or use this to hide dates that have already ended
  // const [expanded, setExpanded] = useState(end >= new Date());
  useSafeLayoutEffect(() => {
    const handleScroll = () => {
      if (scrollableDivRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } =
          scrollableDivRef.current;
        if (scrollLeft + clientWidth >= scrollWidth) {
          setScrolledToRightEnd(true);
          // Add your logic here
        } else {
          setScrolledToRightEnd(false);
        }
        if (scrollLeft === 0) {
          setScrolledToLeftEnd(true);
        } else {
          setScrolledToLeftEnd(false);
        }
      }
    };

    handleScroll();

    const div = scrollableDivRef.current;
    div?.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll);

    // Cleanup the event listener on component unmount
    return () => {
      div?.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  return (
    <div className="w-full">
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">
            {DateTime.fromISO(day.Start)
              .setZone("Europe/Berlin")
              .toFormat("EEEE, MMMM d")}
          </h2>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm text-gray-500 underline"
          >
            ({expanded ? "hide" : "show"})
          </button>
        </div>
      </div>
      {expanded && (
        <div className="flex items-end relative w-full overflow-visible">
          <TimestampCol start={start} end={end} />
          <div
            className="overflow-x-auto overflow-y-clip flex-shrink"
            ref={scrollableDivRef}
          >
            <div
              className="grid divide-x divide-gray-100 w-full overflow-visible"
              style={{
                gridTemplateColumns: `repeat(${numLocations}, minmax(120px, 2fr))`,
              }}
            >
              {includedLocations.map((loc) => (
                <Tooltip
                  key={loc.Name}
                  content={<p className="text-sm p-2">{loc.Description}</p>}
                  placement="bottom-start"
                >
                  <div
                    key={loc.Name}
                    className="p-1 border-b border-gray-100 flex flex-col justify-between h-full"
                  >
                    <div>
                      <h3 className="font-semibold text-xs sm:text-sm">
                        {loc.Name}
                      </h3>
                      <p className="text-[10px] text-gray-500">
                        {loc["Area description"] ?? <br />}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {loc.Capacity ? `max ${loc.Capacity}` : <br />}
                      </p>
                    </div>
                    <Image
                      key={loc.Name}
                      src={loc["Image url"]}
                      alt={loc.Name}
                      className="w-full mt-1 aspect-[4/3]"
                      style={{ maxHeight: 200 }}
                      width={500}
                      height={500}
                    />
                  </div>
                </Tooltip>
              ))}
            </div>
            <div
              className="grid divide-x divide-gray-100 relative w-full"
              style={{
                gridTemplateColumns: `repeat(${numLocations}, minmax(120px, 2fr))`,
              }}
            >
              {/* <NowBar start={start} end={end} /> */}
              {includedLocations.map((location) => {
                if (!location) {
                  return null;
                }
                return (
                  <LocationCol
                    key={location.Name}
                    sessions={day.Sessions.filter((session) =>
                      session["Location name"].includes(location.Name)
                    )}
                    guests={guests}
                    day={day}
                    location={location}
                    eventName={eventName}
                  />
                );
              })}
            </div>
          </div>
          {!scrolledToRightEnd && (
            <div className="bg-gradient-to-r from-transparent to-white h-full absolute right-0 w-12" />
          )}
          {!scrolledToLeftEnd && (
            <div className="bg-gradient-to-l from-transparent to-white h-full absolute left-14 w-12" />
          )}
        </div>
      )}
    </div>
  );
}

function TimestampCol(props: { start: Date; end: Date }) {
  const { start, end } = props;
  const numHalfHours = getNumHalfHours(start, end);
  return (
    <div
      className={clsx(
        "grid h-full min-w-14 border-r border-t border-gray-100",
        `grid-rows-[repeat(${numHalfHours},44px)]`
      )}
    >
      {Array.from({ length: numHalfHours }).map((_, i) => (
        <div
          key={i}
          className="border-b border-gray-100 text-[10px] p-1 text-right h-[44px]"
        >
          {DateTime.fromMillis(start.getTime() + i * 30 * 60 * 1000)
            .setZone("Europe/Berlin")
            .toFormat("HH:mm")}
        </div>
      ))}
    </div>
  );
}
