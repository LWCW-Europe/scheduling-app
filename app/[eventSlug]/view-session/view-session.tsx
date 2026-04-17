"use client";

import Link from "next/link";
import { DateTime } from "luxon";
import { useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PencilIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon, AcademicCapIcon } from "@heroicons/react/24/solid";

import type { Event, Guest, Session, Rsvp } from "@/db/repositories/interfaces";
import { getEndTimeMinusBreak } from "@/utils/utils";
import { UserContext, EventContext } from "../../context";
import { CurrentUserModal, ConfirmationModal } from "../../modals";
import { sessionsOverlap } from "../../session_utils";
import { LockIcon } from "../../lock-icon";
import { LocationTag } from "../session-text";

export function ViewSession(props: {
  session: Session;
  guests: Guest[];
  rsvps: Rsvp[];
  eventSlug: string;
  event: Event;
  showBackBtn: boolean;
  isInModal?: boolean;
  onCloseModal?: () => void;
}) {
  const {
    session,
    guests,
    rsvps,
    eventSlug,
    event,
    showBackBtn,
    isInModal = false,
    onCloseModal,
  } = props;

  const { user: currentUser } = useContext(UserContext);
  const {
    rsvpdForSession,
    updateRsvp,
    userBusySessions,
    rsvps: userRsvps,
    locations,
  } = useContext(EventContext);

  const [optimisticRsvps, setOptimisticRsvps] = useState<Rsvp[]>(rsvps);

  useEffect(() => {
    if (currentUser) {
      const userRsvpForThisSession = userRsvps.find(
        (rsvp) => rsvp.sessionId === session.id
      );

      if (userRsvpForThisSession) {
        setOptimisticRsvps((prev) => {
          const withoutUserRsvp = prev.filter(
            (rsvp) => rsvp.guestId !== currentUser
          );
          return [...withoutUserRsvp, userRsvpForThisSession];
        });
      } else {
        setOptimisticRsvps((prev) =>
          prev.filter((rsvp) => rsvp.guestId !== currentUser)
        );
      }
    }
  }, [userRsvps, currentUser, session.id]);

  const router = useRouter();
  const [isRsvping, setIsRsvping] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [clashingSession, setClashingSession] = useState<Session | null>(null);
  const [confirmRSVPModalOpen, setConfirmRSVPModalOpen] = useState(false);

  const rsvpd = currentUser ? rsvpdForSession(session.id) : false;
  const isHost = currentUser && session.hosts.some((h) => h.id === currentUser);
  const isEditable = !!isHost && session.attendeeScheduled;

  const attendeeIds = optimisticRsvps.map((rsvp) => rsvp.guestId);
  const guestMap = new Map(guests.map((guest) => [guest.id, guest.name]));

  const attendeeNames = attendeeIds
    .map((id) => guestMap.get(id))
    .filter((name): name is string => name !== undefined)
    .sort();

  const location = locations.find((loc) => loc.id === session.locations[0]?.id);

  const handleRsvp = () => {
    if (!currentUser) {
      setUserModalOpen(true);
      return;
    }

    if (!rsvpd) {
      const overlappingSession = userBusySessions().find((ses) =>
        sessionsOverlap(session, ses)
      );
      if (overlappingSession) {
        setClashingSession(overlappingSession);
        setConfirmRSVPModalOpen(true);
        return;
      }
    }

    doRsvp();
  };

  const doRsvp = () => {
    if (!currentUser) {
      return;
    }

    setIsRsvping(true);

    const currentRsvpStatus = rsvpdForSession(session.id);

    void updateRsvp(currentUser, session.id, currentRsvpStatus)
      .then((result) => {
        if (!result) {
          console.error("Failed to update RSVP");
        }
      })
      .finally(() => {
        setIsRsvping(false);
      });
  };

  const handleEditClick = (e: React.MouseEvent) => {
    if (isInModal && onCloseModal) {
      e.preventDefault();
      onCloseModal();
      setTimeout(() => {
        router.push(`/${eventSlug}/edit-session?sessionID=${session.id}`);
      }, 100);
    }
  };

  const hostNames = session.hosts.map((h) => h.name).join(", ");

  return (
    <div
      className={`${isInModal ? "w-full p-6" : "max-w-2xl mx-auto"} pb-12 break-words overflow-hidden`}
    >
      <CurrentUserModal
        close={() => setUserModalOpen(false)}
        open={userModalOpen}
        rsvp={handleRsvp}
        guests={guests}
        hosts={session.hosts.map((h) => h.name)}
        rsvpd={rsvpd}
        zIndex="z-[100]"
        portal={true}
        sessionInfoDisplay={
          <div>
            <h1 className="text-lg font-bold leading-tight flex items-center gap-1">
              {session.closed && (
                <LockIcon className="h-4 w-4 text-gray-600 flex-shrink-0" />
              )}
              {session.title}
            </h1>
            <p className="text-xs text-gray-500 mb-2 mt-1">
              Hosted by {hostNames}
            </p>
          </div>
        }
      />
      <ConfirmationModal
        open={confirmRSVPModalOpen}
        close={() => setConfirmRSVPModalOpen(false)}
        confirm={doRsvp}
        zIndex="z-[100]"
        portal={true}
        message={
          `Warning: that session clashes with ${clashingSession?.title}, which you ` +
          `are ${clashingSession?.hosts.some((h) => h.id === (currentUser || "")) ? "hosting" : "attending"}. ` +
          "Are you sure you want to proceed?"
        }
      />
      {showBackBtn && (
        <Link
          className="bg-rose-400 text-white font-semibold py-2 px-4 rounded shadow hover:bg-rose-500 active:bg-rose-500 w-fit px-12 mt-4 mb-2 block"
          href={`/${eventSlug}`}
        >
          Back to {event.name}
        </Link>
      )}
      <div className="flex items-start gap-2 mb-2 mt-5">
        <p
          className="text-xl font-semibold flex-1 flex items-center gap-2"
          id="title"
        >
          {session.closed && (
            <LockIcon className="h-5 w-5 text-gray-600 flex-shrink-0" />
          )}
          {session.title}
        </p>
        <div className="flex gap-1">
          {isHost && (
            <div
              className="flex items-center"
              title="You are hosting this session"
            >
              <AcademicCapIcon className="h-5 w-5" />
            </div>
          )}
          {rsvpd && (
            <div
              className="flex items-center"
              title="You have RSVP'd to this session"
            >
              <CheckCircleIcon className="h-5 w-5" />
            </div>
          )}
        </div>
      </div>
      {session.closed && (
        <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-sm text-yellow-800">
          <div className="flex items-center gap-2 font-medium mb-1">
            <LockIcon className="h-4 w-4" />
            Closed Session
          </div>
          <p>
            This is a closed session, meaning you can at most arrive 5 minutes
            late. If you arrive later you may not join and please do not knock
            or otherwise disrupt the session.
          </p>
        </div>
      )}
      <div className="mt-2 mb-6 flex gap-2 flex-wrap">
        {!isHost && (
          <button
            onClick={handleRsvp}
            disabled={isRsvping}
            className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-md border border-rose-400 text-rose-400 hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-400 transition-colors disabled:opacity-50"
          >
            {isRsvping ? "..." : rsvpd ? "Un-RSVP" : "RSVP"}
          </button>
        )}

        {isEditable && (
          <Link
            href={`/${eventSlug}/edit-session?sessionID=${session.id}`}
            className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-md border border-rose-400 text-rose-400 hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-400 transition-colors"
            onClick={handleEditClick}
          >
            <PencilIcon className="h-3 w-3 mr-1" />
            Edit
          </Link>
        )}
      </div>
      <div className="space-y-2 mb-6 text-sm text-gray-700">
        <div className="flex gap-2">
          <span className="font-medium">Hosts(s):</span>
          <span>{hostNames}</span>
        </div>
        <div className="flex gap-2">
          <span className="font-medium">Location:</span>
          <span>{location && LocationTag({ location })}</span>
        </div>
        <div className="flex gap-2">
          <span className="font-medium">Time:</span>
          <span>
            {DateTime.fromJSDate(session.startTime ?? new Date())
              .setZone("America/Los_Angeles")
              .toFormat("EEEE h:mm a")}{" "}
            -{" "}
            {getEndTimeMinusBreak(session)
              .setZone("America/Los_Angeles")
              .toFormat("h:mm a")}
          </span>
        </div>
        <div className="flex gap-2">
          <span className="font-medium">
            Attendees ({attendeeNames.length}):
          </span>
          <span>
            {attendeeNames.length === 0
              ? "No attendees yet"
              : `${attendeeNames.join(", ")}`}
          </span>
        </div>
      </div>
      <div className="mb-6">
        <h3 className="font-semibold mb-2">Description</h3>
        <p className="whitespace-pre-line">{session.description}</p>
      </div>
      {session.proposalId && (
        <p className="text-sm text-gray-600">
          This session was scheduled from a proposal. See it{" "}
          <a
            href={`/${eventSlug}/proposals/${session.proposalId}/view`}
            className="text-rose-500 underline hover:text-rose-600 transition-colors"
          >
            here
          </a>
          .
        </p>
      )}
    </div>
  );
}
