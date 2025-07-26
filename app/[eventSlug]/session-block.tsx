import clsx from "clsx";
import { ClockIcon, PlusIcon } from "@heroicons/react/24/outline";
import { UserIcon, PencilSquareIcon } from "@heroicons/react/24/solid";
import { Session } from "@/db/sessions";
import { Day } from "@/db/days";
import { Location } from "@/db/locations";
import { Guest } from "@/db/guests";
import { Tooltip } from "./tooltip";
import { DateTime } from "luxon";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useContext, useState } from "react";
import { CurrentUserModal } from "../modals";
import { UserContext, EventContext } from "../context";
import { useScreenWidth } from "@/utils/hooks";

export function SessionBlock(props: {
  eventName: string;
  session: Session;
  location: Location;
  day: Day;
  guests: Guest[];
}) {
  const { eventName, session, location, day, guests } = props;
  const { getRsvpsForSession } = useContext(EventContext);
  const { user: currentUser } = useContext(UserContext);

  const startTime = new Date(session["Start time"]).getTime();
  const endTime = new Date(session["End time"]).getTime();
  const sessionLength = endTime - startTime;
  const numHalfHours = sessionLength / 1000 / 60 / 30;

  const rsvpsForSession = getRsvpsForSession(session.ID);
  const rsvpdForEvent =
    currentUser &&
    rsvpsForSession.some(
      (rsvp) => rsvp.Guest && rsvp.Guest.includes(currentUser)
    );

  const isBlank = !session.Title;
  const isBookable =
    !!isBlank &&
    !!location.Bookable &&
    startTime > new Date().getTime() &&
    startTime >= new Date(day["Start bookings"]).getTime() &&
    startTime < new Date(day["End bookings"]).getTime();
  return isBookable ? (
    <BookableSessionCard
      eventName={eventName}
      session={session}
      location={location}
      numHalfHours={numHalfHours}
    />
  ) : (
    <>
      {isBlank ? (
        <BlankSessionCard numHalfHours={numHalfHours} />
      ) : (
        <RealSessionCard
          eventName={eventName}
          session={session}
          location={location}
          numHalfHours={numHalfHours}
          guests={guests}
          rsvpd={!!rsvpdForEvent}
        />
      )}
    </>
  );
}

export function BookableSessionCard(props: {
  location: Location;
  session: Session;
  numHalfHours: number;
  eventName: string;
}) {
  const { numHalfHours, session, location, eventName } = props;
  const dayParam = DateTime.fromISO(session["Start time"])
    .setZone("America/Los_Angeles")
    .toFormat("MM-dd");
  const timeParam = DateTime.fromISO(session["Start time"])
    .setZone("America/Los_Angeles")
    .toFormat("HH:mm");
  const eventSlug = eventName.replace(/ /g, "-");
  return (
    <div className={`row-span-${numHalfHours} my-0.5 min-h-10`}>
      <Link
        className="rounded font-roboto h-full w-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
        href={`/${eventSlug}/add-session?location=${location.Name}&time=${timeParam}&day=${dayParam}`}
      >
        <PlusIcon className="h-4 w-4 text-gray-400" />
      </Link>
    </div>
  );
}

function BlankSessionCard(props: { numHalfHours: number }) {
  const { numHalfHours } = props;
  return <div className={`row-span-${numHalfHours} my-0.5 min-h-12`} />;
}

export function RealSessionCard(props: {
  eventName: string;
  session: Session;
  numHalfHours: number;
  location: Location;
  guests: Guest[];
  rsvpd: boolean;
}) {
  const { eventName, session, numHalfHours, location, guests, rsvpd } = props;
  const { user: currentUser } = useContext(UserContext);
  const { updateRsvp, getRsvpsForSession } = useContext(EventContext);
  const router = useRouter();
  const [isRsvping, setIsRsvping] = useState(false);

  const hostStatus = currentUser && session.Hosts?.includes(currentUser);
  const lowerOpacity = !rsvpd && !hostStatus;
  const formattedHostNames = session["Host name"]?.join(", ") ?? "No hosts";
  const [rsvpModalOpen, setRsvpModalOpen] = useState(false);
  const screenWidth = useScreenWidth();
  const onMobile = screenWidth < 640;

  const handleClick = async () => {
    if (hostStatus) {
      return;
    }
    if (currentUser && !onMobile) {
      setIsRsvping(true);
      await updateRsvp(currentUser, session.ID, rsvpd);
      setIsRsvping(false);
    } else {
      setRsvpModalOpen(true);
    }
  };

  const onClickEdit = () => {
    const url = `/${eventName.replace(/ /g, "-")}/edit-session?sessionID=${
      session.ID
    }`;
    router.push(url);
  };

  // Get the current number of RSVPs from the context
  const rsvpsForSession = getRsvpsForSession(session.ID);
  // Count RSVPs plus hosts (authors of the event)
  const numHosts = session.Hosts?.length || 0;
  const numRSVPs = rsvpsForSession.length + numHosts;

  const SessionInfoDisplay = () => (
    <>
      <h1 className="text-lg font-bold leading-tight">{session.Title}</h1>
      <p className="text-xs text-gray-500 mb-2 mt-1">
        Hosted by {formattedHostNames}
      </p>
      <p className="text-sm whitespace-pre-line">{session.Description}</p>
      <div className="flex justify-between mt-2 gap-4 text-xs text-gray-500">
        <div className="flex gap-1">
          <UserIcon className="h-4 w-4" />
          <span>
            {numRSVPs} RSVPs (max capacity {session.Capacity})
          </span>
        </div>
        <div className="flex gap-1">
          <ClockIcon className="h-4 w-4" />
          <span>
            {DateTime.fromISO(session["Start time"])
              .setZone("America/Los_Angeles")
              .toFormat("h:mm a")}{" "}
            -{" "}
            {DateTime.fromISO(session["End time"])
              .setZone("America/Los_Angeles")
              .toFormat("h:mm a")}
          </span>
        </div>
      </div>
    </>
  );
  return (
    <Tooltip
      content={onMobile ? undefined : <SessionInfoDisplay />}
      className={`row-span-${numHalfHours} my-0.5 overflow-hidden group`}
    >
      <CurrentUserModal
        close={() => setRsvpModalOpen(false)}
        open={rsvpModalOpen}
        rsvp={async () => {
          if (!currentUser) return;
          await updateRsvp(currentUser, session.ID, rsvpd);
        }}
        guests={guests}
        rsvpd={rsvpd}
        sessionInfoDisplay={<SessionInfoDisplay />}
      />
      <button
        className={clsx(
          "py-1 px-1 rounded font-roboto h-full min-h-10 cursor-pointer flex flex-col relative w-full",
          lowerOpacity
            ? `bg-${location.Color}-${200} border-2 border-${
                location.Color
              }-${400}`
            : `bg-${location.Color}-${500} border-2 border-${
                location.Color
              }-${600}`,
          !lowerOpacity && "text-white"
        )}
        onClick={() => void handleClick()}
        disabled={isRsvping}
      >
        <p
          className={clsx(
            "font-medium text-xs leading-[1.15] text-left",
            numHalfHours > 1 ? "line-clamp-2" : "line-clamp-1"
          )}
        >
          {session.Title}
        </p>
        <p
          className={clsx(
            "text-[10px] leading-tight text-left ",
            numHalfHours > 2
              ? "line-clamp-3"
              : numHalfHours > 1
              ? "line-clamp-2"
              : "line-clamp-1"
          )}
        >
          {formattedHostNames}
        </p>
        {hostStatus && (
          <PencilSquareIcon
            onClick={onClickEdit}
            className={clsx(
              "absolute h-5 w-5 top-0 right-0",
              "text-gray-600 hover:text-black",
              "cursor-pointer"
            )}
          />
        )}
        <div
          className={clsx(
            "absolute py-[1px] px-1 rounded-tl text-[10px] bottom-0 right-0 flex gap-0.5 items-center",
            `bg-${location.Color}-400`
          )}
        >
          <UserIcon className="h-.5 w-2.5" />
          {numRSVPs}
        </div>
      </button>
    </Tooltip>
  );
}
