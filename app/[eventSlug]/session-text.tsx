import clsx from "clsx";
import { DateTime } from "luxon";
import { Session } from "@/db/sessions";
import { Location } from "@/db/locations";
import { getEndTimeMinusBreak } from "@/utils/utils";

export function SessionText(props: {
  session: Session;
  locations: Location[];
}) {
  const { session, locations } = props;
  const formattedHostNames = session["Host name"]?.join(", ") ?? "No hosts";
  return (
    <div className="px-1.5 rounded h-full min-h-10 pt-5 pb-8">
      <h1 className="font-bold leading-tight">{session.Title}</h1>
      <div className="flex flex-col sm:flex-row justify-between mt-2 sm:items-center gap-2">
        <div className="flex gap-2 text-sm text-gray-500">
          <div className="flex gap-1">
            <span>
              {DateTime.fromISO(session["Start time"]).toFormat("EEEE")},{" "}
              {DateTime.fromISO(session["Start time"])
                .setZone("America/Los_Angeles")
                .toFormat("h:mm a")}{" "}
              -{" "}
              {getEndTimeMinusBreak(session)
                .setZone("America/Los_Angeles")
                .toFormat("h:mm a")}
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
      <p className="text-sm whitespace-pre-line mt-2">{session.Description}</p>
    </div>
  );
}

function LocationTag(props: { location: Location }) {
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
