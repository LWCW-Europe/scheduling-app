import clsx from "clsx";
import { ClockIcon, PlusIcon } from "@heroicons/react/24/outline";
import { UserIcon, PencilSquareIcon } from "@heroicons/react/24/solid";
import { Session } from "@/db/sessions";
import { Day } from "@/db/days";
import { Location } from "@/db/locations";
import { Guest } from "@/db/guests";
import { RSVP } from "@/db/rsvps";
import { Tooltip } from "./tooltip";
import { DateTime } from "luxon";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useContext, useState, useRef, useMemo } from "react";
import { CurrentUserModal, ConfirmationModal } from "../modals";
import { UserContext } from "../context";
import { useScreenWidth } from "@/utils/hooks";

export function SessionBlock(props: {
  eventName: string;
  session: Session;
  location: Location;
  day: Day;
  guests: Guest[];
  rsvpsForEvent: RSVP[];
  busySessions: Session[];
  setRSVP: (guestId: string, sessionId: string, newState: boolean) => void;
}) {
  const { eventName, session, location, day, guests, rsvpsForEvent, busySessions, setRSVP } = props;
  const startTime = new Date(session["Start time"]).getTime();
  const endTime = new Date(session["End time"]).getTime();
  const sessionLength = endTime - startTime;
  const numHalfHours = sessionLength / 1000 / 60 / 30;
  const rsvpdForEvent = rsvpsForEvent.length > 0;
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
          rsvpd={rsvpdForEvent}
          busySessions={busySessions}
          setRSVP={setRSVP}
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

async function rsvp(guestId: string, sessionId: string, remove = false) {
  await fetch("/api/toggle-rsvp", {
    method: "POST",
    body: JSON.stringify({
      guestId,
      sessionId,
      remove,
    }),
  });
}

export function RealSessionCard(props: {
  eventName: string;
  session: Session;
  numHalfHours: number;
  location: Location;
  guests: Guest[];
  rsvpd: boolean;
  busySessions: Session[];
  setRSVP: (guestId: string, sessionId: string, newState: boolean) => void;
}) {
  const { eventName, session, numHalfHours, location, guests, rsvpd, busySessions, setRSVP } = props;
  // const initialRSVPd = useRef(rsvpd).current;
  const initialRSVPd = useMemo(() => rsvpd, []);
  const { user: currentUser } = useContext(UserContext);
  const router = useRouter();
  const hostStatus = currentUser && session.Hosts?.includes(currentUser);
  const lowerOpacity = !rsvpd && !hostStatus;
  const formattedHostNames = session["Host name"]?.join(", ") ?? "No hosts";
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [confirmRSVPModalOpen, setConfirmRSVPModalOpen] = useState(false);
  const screenWidth = useScreenWidth();
  const onMobile = screenWidth < 640;

  const handleClick = () => {
    if (hostStatus) {
      return;
    }
    if (currentUser && !onMobile) {
      const isBusy = busySessions.some(ses => {
        if (session.ID == ses.ID) {
          return false;
        }
        const startSes1 = new Date(ses["Start time"]).getTime();
        const endSes1 = new Date(ses["End time"]).getTime();
        const startSes2 = new Date(session["Start time"]).getTime();
        const endSes2 = new Date(session["End time"]).getTime();
        const maxStart = Math.max(startSes1, startSes2);
        const minEnd = Math.min(endSes1, endSes2);
        return maxStart < minEnd;
      });
      if (!rsvpd && isBusy) {
        setConfirmRSVPModalOpen(true);
      } else {
        doRsvp();
      }
    } else {
      setUserModalOpen(true);
    }
  };
  const doRsvp = async () => {
    if (!currentUser) {
      return;
    }
    await rsvp(currentUser, session.ID, rsvpd);
    setRSVP(currentUser, session.ID, !rsvpd);
  };
  const onClickEdit = () => {
    const url = `/${eventName.replace(/ /g, "-")}/edit-session?sessionID=${
      session.ID
    }`;
    router.push(url);
  };

  let numRSVPs = session["Num RSVPs"];
  if (rsvpd != initialRSVPd) {
    if (initialRSVPd) {
      numRSVPs -= 1;
    } else {
      numRSVPs += 1;
    }
  }
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
      initialRSVPd = {initialRSVPd.toString()}
      <CurrentUserModal
        close={() => setUserModalOpen(false)}
        open={userModalOpen}
        rsvp={doRsvp}
        guests={guests}
        rsvpd={rsvpd}
        sessionInfoDisplay={<SessionInfoDisplay />}
      />
      <ConfirmationModal
        open={confirmRSVPModalOpen}
        close={() => setConfirmRSVPModalOpen(false)}
        confirm={doRsvp}
        message={"Warning: you are already booked during that session. Are you sure you want to proceed?"}
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
