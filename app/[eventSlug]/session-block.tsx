import clsx from "clsx";
import { ClockIcon, PlusIcon } from "@heroicons/react/24/outline";
import { UserIcon, AcademicCapIcon } from "@heroicons/react/24/solid";
import { Session } from "@/db/sessions";
import { Day } from "@/db/days";
import { Location } from "@/db/locations";
import { Guest } from "@/db/guests";
import { Tooltip } from "./tooltip";
import { DateTime } from "luxon";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useContext, useState } from "react";
import { CurrentUserModal, ConfirmationModal } from "../modals";
import { UserContext, EventContext } from "../context";
import { sessionsOverlap } from "../session_utils";
import { eventNameToSlug, getEndTimeMinusBreak } from "@/utils/utils";
import { LockIcon } from "../lock-icon";

export function SessionBlock(props: {
  eventName: string;
  session: Session;
  location: Location;
  day: Day;
  guests: Guest[];
}) {
  const { eventName, session, location, day, guests } = props;
  const eventSlug = eventNameToSlug(eventName);
  const { rsvpdForSession } = useContext(EventContext);
  const { user } = useContext(UserContext);
  const rsvpd = rsvpdForSession(session.ID + (user ? "" : ""));

  const startTime = new Date(session["Start time"]).getTime();
  const endTime = new Date(session["End time"]).getTime();
  const sessionLength = endTime - startTime;
  const numHalfHours = sessionLength / 1000 / 60 / 30;

  const isBlank = !session.Title;
  const isBookable =
    !!isBlank &&
    !!location.Bookable &&
    startTime > new Date().getTime() &&
    (!day.StartBookings ||
      startTime >= new Date(day.StartBookings as Date | string).getTime()) &&
    (!day.EndBookings ||
      startTime < new Date(day.EndBookings as Date | string).getTime()) &&
    !session.Blocker;
  return isBookable ? (
    <BookableSessionCard
      eventSlug={eventSlug}
      session={session}
      location={location}
      numHalfHours={numHalfHours}
    />
  ) : (
    <>
      {session.Blocker ? (
        <BlockerSessionCard
          title={session.Title || "Blocked"}
          numHalfHours={numHalfHours}
        />
      ) : isBlank ? (
        <BlankSessionCard numHalfHours={numHalfHours} />
      ) : (
        <RealSessionCard
          eventSlug={eventSlug}
          session={session}
          location={location}
          numHalfHours={numHalfHours}
          guests={guests}
          rsvpd={rsvpd}
        />
      )}
    </>
  );
}

export function BookableSessionCard(props: {
  location: Location;
  session: Session;
  numHalfHours: number;
  eventSlug: string;
}) {
  const { numHalfHours, session, location, eventSlug } = props;
  const dayParam = DateTime.fromISO(session["Start time"])
    .setZone("Europe/Berlin")
    .toFormat("MM-dd");
  const timeParam = DateTime.fromISO(session["Start time"])
    .setZone("Europe/Berlin")
    .toFormat("HH:mm");
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

function BlockerSessionCard(props: { title: string; numHalfHours: number }) {
  const { title, numHalfHours } = props;
  return (
    <div className={`row-span-${numHalfHours} my-0.5 overflow-hidden`}>
      <div className="py-1 px-1 rounded font-roboto h-full min-h-10 flex flex-col justify-center bg-gray-300 border-2 border-gray-400 text-black">
        <p
          className={clsx(
            "font-medium text-xs leading-[1.15] text-center",
            numHalfHours > 1 ? "line-clamp-2" : "line-clamp-1"
          )}
        >
          {title}
        </p>
      </div>
    </div>
  );
}

export function RealSessionCard(props: {
  eventSlug: string;
  session: Session;
  numHalfHours: number;
  location: Location;
  guests: Guest[];
  rsvpd: boolean;
}) {
  const { eventSlug, session, numHalfHours, location, guests, rsvpd } = props;
  const { user: currentUser } = useContext(UserContext);
  const { localSessions, updateRsvp, userBusySessions } =
    useContext(EventContext);
  const router = useRouter();
  const [isRsvping, setIsRsvping] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [clashingSession, setClashingSession] = useState<Session | null>(null);
  const [confirmRSVPModalOpen, setConfirmRSVPModalOpen] = useState(false);

  const hostStatus = currentUser && session.Hosts?.includes(currentUser);
  const lowerOpacity = !rsvpd && !hostStatus;
  const formattedHostNames = session["Host name"]?.join(", ") ?? "No hosts";

  const handleClick = () => {
    // Preserve current search parameters including view
    const searchParams = new URLSearchParams(window.location.search);
    const url = `/${eventSlug}/view-session?sessionID=${session.ID}&${searchParams.toString()}`;
    router.push(url);
  };

  const handleRSVP = (event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent opening the session modal

    if (!currentUser) {
      setUserModalOpen(true);
      return;
    }

    if (isRsvping) return;

    const currentSession =
      localSessions.find((s) => s.ID === session.ID) ?? session;

    if (currentSession.Hosts?.includes(currentUser)) {
      // Can't RSVP to your own session
      return;
    }

    // Check for scheduling conflicts when RSVPing
    if (!rsvpd) {
      const clashing = userBusySessions().find((busySession: Session) =>
        sessionsOverlap(currentSession, busySession)
      );

      if (clashing) {
        setClashingSession(clashing);
        setConfirmRSVPModalOpen(true);
        return;
      }
    }

    void doRsvp();
  };

  const doRsvp = async () => {
    if (!currentUser || isRsvping) return;

    setIsRsvping(true);

    // Get the current RSVP status at the time of the action
    const currentRsvpStatus = rsvpd;

    try {
      const result = await updateRsvp(
        currentUser,
        session.ID,
        currentRsvpStatus
      );
      if (!result) {
        console.error("Failed to update RSVP");
      }
    } finally {
      setIsRsvping(false);
    }
  };

  const handleConfirmRSVP = () => {
    setConfirmRSVPModalOpen(false);
    setClashingSession(null);
    void doRsvp();
  };

  // Get the current number of RSVPs from the context
  const numRSVPs = localSessions.find((ses) => ses.ID == session.ID)![
    "Num RSVPs"
  ];

  const SessionInfoDisplay = () => (
    <>
      <h1 className="text-lg font-bold leading-tight flex items-center gap-1">
        {session.Closed && (
          <LockIcon className="h-4 w-4 text-gray-600 flex-shrink-0" />
        )}
        {session.Title}
      </h1>
      <p className="text-xs text-gray-500 mb-2 mt-1">
        Hosted by {formattedHostNames}
      </p>
      <p className="text-sm whitespace-pre-line">
        {session.Description?.length > 210
          ? session.Description.substring(0, 200) + "..."
          : session.Description}
      </p>
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
              .setZone("Europe/Berlin")
              .toFormat("HH:mm")}{" "}
            -{" "}
            {getEndTimeMinusBreak(session)
              .setZone("Europe/Berlin")
              .toFormat("HH:mm")}
          </span>
        </div>
      </div>
    </>
  );
  return (
    <Tooltip
      content={<SessionInfoDisplay />}
      className={`row-span-${numHalfHours} my-0.5 overflow-hidden group`}
    >
      <button
        className={clsx(
          "py-1 px-1 rounded font-roboto h-full min-h-10 cursor-pointer flex flex-col relative w-full group",
          lowerOpacity
            ? `bg-${location.Color}-${200} border-2 border-${
                location.Color
              }-${400}`
            : `bg-${location.Color}-${500} border-2 border-${
                location.Color
              }-${600}`,
          !lowerOpacity && "text-white"
        )}
        onClick={handleClick}
      >
        <p
          className={clsx(
            "font-medium text-xs leading-[1.15] text-left flex items-start gap-1",
            numHalfHours >= 3 ? "line-clamp-2" : "line-clamp-1"
          )}
        >
          {session.Closed && (
            <LockIcon className="h-3 w-3 flex-shrink-0 mt-0" />
          )}
          <span className="flex-1">{session.Title}</span>
        </p>
        {numHalfHours > 1 && (
          <p
            className={clsx(
              "text-[10px] leading-tight text-left",
              numHalfHours >= 4
                ? "line-clamp-3"
                : numHalfHours >= 3
                  ? "line-clamp-2"
                  : "line-clamp-1"
            )}
          >
            {formattedHostNames}
          </p>
        )}
        <div className="absolute bottom-0 right-0 flex gap-1 items-end">
          {hostStatus && (
            <div
              className="py-[2px] flex items-center"
              title="You are hosting this session"
            >
              <AcademicCapIcon className="h-3 w-3 text-white" />
            </div>
          )}
          <div
            className={clsx(
              "py-[1px] px-1 rounded-tl text-[10px] flex gap-0.5 items-center cursor-pointer hover:opacity-80",
              `bg-${location.Color}-400`
            )}
            onClick={handleRSVP}
          >
            <UserIcon className="h-.5 w-2.5" />
            {numRSVPs}
          </div>
        </div>
      </button>

      {/* Modals for RSVP functionality */}
      <CurrentUserModal
        open={userModalOpen}
        close={() => setUserModalOpen(false)}
        guests={guests}
        hosts={session["Host name"] || []}
        rsvp={() => void doRsvp()}
        rsvpd={rsvpd}
        portal={true}
      />

      <ConfirmationModal
        open={confirmRSVPModalOpen}
        close={() => setConfirmRSVPModalOpen(false)}
        message={
          clashingSession
            ? `This session conflicts with "${clashingSession.Title}". Do you want to RSVP anyway?`
            : "This session conflicts with another session you're attending. Do you want to RSVP anyway?"
        }
        confirm={handleConfirmRSVP}
        portal={true}
      />
    </Tooltip>
  );
}
