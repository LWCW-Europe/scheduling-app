import clsx from "clsx";
import { DateTime } from "luxon";
import { Session } from "@/db/sessions";
import { Location } from "@/db/locations";
import { getEndTimeMinusBreak } from "@/utils/utils";
import { useRouter } from "next/navigation";
import { useState, useContext } from "react";
import { useSearchParams } from "next/navigation";
import { UserContext, EventContext } from "../context";
import { CheckCircleIcon, AcademicCapIcon } from "@heroicons/react/24/solid";
import { LockIcon } from "../lock-icon";

export function SessionText(props: {
  session: Session;
  locations: Location[];
  eventSlug: string;
}) {
  const { session, locations, eventSlug } = props;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: currentUser } = useContext(UserContext);
  const { rsvpdForSession } = useContext(EventContext);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const formattedHostNames = session["Host name"]?.join(", ") ?? "No hosts";

  // Determine user status for this session
  const rsvpd = currentUser ? rsvpdForSession(session.ID + "") : false;
  const isHost = currentUser && session.Hosts?.includes(currentUser);

  const description = session.Description || "";
  const isLongDescription = description.length > 200;
  const displayDescription =
    isLongDescription && !showFullDescription
      ? description.substring(0, 200) + "..."
      : description;

  const handleTitleClick = () => {
    // Preserve current search parameters including view
    const currentParams = new URLSearchParams(searchParams.toString());
    const url = `/${eventSlug}/view-session?sessionID=${session.ID}&${currentParams.toString()}`;
    router.push(url);
  };

  return (
    <div className="px-1.5 rounded h-full min-h-10 pt-5 pb-8 relative">
      <div className="flex items-start gap-2">
        <h1
          className="font-bold leading-tight cursor-pointer hover:text-blue-600 transition-colors flex-1 flex items-center gap-1"
          onClick={handleTitleClick}
        >
          {session.Closed && (
            <LockIcon className="h-4 w-4 text-gray-600 flex-shrink-0" />
          )}
          {session.Title}
        </h1>
        <div className="flex gap-1">
          {isHost && (
            <div
              className="flex items-center"
              title="You are hosting this session"
            >
              <AcademicCapIcon className="h-4 w-4" />
            </div>
          )}
          {rsvpd && (
            <div
              className="flex items-center"
              title="You have RSVP'd to this session"
            >
              <CheckCircleIcon className="h-4 w-4" />
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col sm:flex-row justify-between mt-2 sm:items-center gap-2">
        <div className="flex gap-2 text-sm text-gray-500">
          <div className="flex gap-1">
            <span>
              {DateTime.fromISO(session["Start time"]).toFormat("EEEE")},{" "}
              {DateTime.fromISO(session["Start time"])
                .setZone("Europe/Berlin")
                .toFormat("HH:mm")}{" "}
              -{" "}
              {getEndTimeMinusBreak(session)
                .setZone("Europe/Berlin")
                .toFormat("HH:mm")}
            </span>
          </div>
          •<span>{formattedHostNames}</span>
        </div>
        <div className="flex items-center gap-1">
          {locations.map((loc) => (
            <LocationTag key={loc.Name} location={loc} />
          ))}
        </div>
      </div>
      <p className="text-sm whitespace-pre-line mt-2">
        {displayDescription}
        {isLongDescription && (
          <button
            onClick={() => setShowFullDescription(!showFullDescription)}
            className="ml-2 text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
          >
            {showFullDescription ? "Show less" : "Show more"}
          </button>
        )}
      </p>
    </div>
  );
}

export function LocationTag(props: { location: Location }) {
  const { location } = props;
  return (
    <div
      className={clsx(
        "flex items-center gap-2 rounded-full py-0.5 px-2 text-xs font-semibold w-fit",
        `text-${location.Color}-500 bg-${location.Color}-100 border-2 border-${location.Color}-400`
      )}
    >
      {location.Name}
    </div>
  );
}
