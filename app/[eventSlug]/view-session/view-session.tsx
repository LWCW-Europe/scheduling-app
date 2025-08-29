"use client";

import Link from "next/link";
import { DateTime } from "luxon";
import { useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PencilIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon, AcademicCapIcon } from "@heroicons/react/24/solid";

import type { Event } from "@/db/events";
import type { Guest } from "@/db/guests";
import type { Session } from "@/db/sessions";
import type { RSVP } from "@/db/rsvps";
import { getEndTimeMinusBreak } from "@/utils/utils";
import { UserContext, EventContext } from "../../context";
import { CurrentUserModal, ConfirmationModal } from "../../modals";
import { sessionsOverlap } from "../../session_utils";
import { LockIcon } from "../../lock-icon";
import { LocationTag } from "../session-text";

export function ViewSession(props: {
  session: Session;
  guests: Guest[];
  rsvps: RSVP[];
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

  // Merge server RSVPs with user's optimistic updates
  // If user has an RSVP in context, use that; otherwise use server data
  const [optimisticRsvps, setOptimisticRsvps] = useState<RSVP[]>(rsvps);

  useEffect(() => {
    // When context RSVPs change, update our optimistic state
    if (currentUser) {
      const userRsvpForThisSession = userRsvps.find(
        (rsvp) => rsvp.Session && rsvp.Session.includes(session.ID)
      );

      if (userRsvpForThisSession) {
        // User has RSVP'd - add/update their RSVP in the list
        setOptimisticRsvps((prev) => {
          const withoutUserRsvp = prev.filter(
            (rsvp) => !rsvp.Guest || !rsvp.Guest.includes(currentUser)
          );
          return [...withoutUserRsvp, userRsvpForThisSession];
        });
      } else {
        // User has un-RSVP'd - remove their RSVP from the list
        setOptimisticRsvps((prev) =>
          prev.filter(
            (rsvp) => !rsvp.Guest || !rsvp.Guest.includes(currentUser)
          )
        );
      }
    }
  }, [userRsvps, currentUser, session.ID]);
  const router = useRouter();
  const [isRsvping, setIsRsvping] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [clashingSession, setClashingSession] = useState<Session | null>(null);
  const [confirmRSVPModalOpen, setConfirmRSVPModalOpen] = useState(false);

  // Determine user status for this session
  const rsvpd = currentUser ? rsvpdForSession(session.ID + "") : false;
  const isHost = currentUser && session.Hosts?.includes(currentUser);
  const isEditable = !!isHost && session["Attendee scheduled"];

  // Get attendee names from optimistic RSVPs - updates in real-time
  const attendeeIds = optimisticRsvps.flatMap((rsvp: RSVP) => rsvp.Guest);
  const guestMap = new Map(guests.map((guest) => [guest.ID, guest.Name]));

  const attendeeNames = attendeeIds
    .map((id: string) => guestMap.get(id))
    .filter((name): name is string => name !== undefined)
    .sort();

  const location = locations.find(
    (loc) => loc.Name === session["Location name"]?.[0]
  );

  const handleRsvp = () => {
    if (!currentUser) {
      setUserModalOpen(true);
      return;
    }

    // Check for clashing sessions only when RSVPing (not when un-RSVPing)
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

    // Get the current RSVP status at the time of the action
    const currentRsvpStatus = rsvpdForSession(session.ID + "");

    void updateRsvp(currentUser, session.ID, currentRsvpStatus)
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
      // Small delay to allow modal to close before navigation
      setTimeout(() => {
        router.push(`/${eventSlug}/edit-session?sessionID=${session.ID}`);
      }, 100);
    }
    // If not in modal, let the Link component handle the navigation normally
  };

  return (
    <div
      className={`${isInModal ? "w-full p-6" : "max-w-2xl mx-auto"} pb-12 break-words overflow-hidden`}
    >
      <CurrentUserModal
        close={() => setUserModalOpen(false)}
        open={userModalOpen}
        rsvp={handleRsvp}
        guests={guests}
        hosts={session.Hosts || []}
        rsvpd={rsvpd}
        zIndex="z-[100]"
        portal={true} // Explicitly portal this modal to escape the session modal
        sessionInfoDisplay={
          <div>
            <h1 className="text-lg font-bold leading-tight flex items-center gap-1">
              {session.Closed && (
                <LockIcon className="h-4 w-4 text-gray-600 flex-shrink-0" />
              )}
              {session.Title}
            </h1>
            <p className="text-xs text-gray-500 mb-2 mt-1">
              Hosted by{" "}
              {session
                .Hosts!.map((h) => guests.find((g) => g.ID === h))
                .map((g) => g?.Name)
                .join(", ")}
            </p>
          </div>
        }
      />
      <ConfirmationModal
        open={confirmRSVPModalOpen}
        close={() => setConfirmRSVPModalOpen(false)}
        confirm={doRsvp}
        zIndex="z-[100]"
        portal={true} // Explicitly portal this modal to escape the session modal
        message={
          `Warning: that session clashes with ${clashingSession?.Title}, which you ` +
          `are ${clashingSession?.Hosts?.includes(currentUser || "") ? "hosting" : "attending"}. ` +
          "Are you sure you want to proceed?"
        }
      />
      {showBackBtn && (
        <Link
          className="bg-rose-400 text-white font-semibold py-2 px-4 rounded shadow hover:bg-rose-500 active:bg-rose-500 w-fit px-12 mt-4 mb-2 block"
          href={`/${eventSlug}`}
        >
          Back to {event.Name}
        </Link>
      )}
      {/* Title with status indicators */}
      <div className="flex items-start gap-2 mb-2 mt-5">
        <p
          className="text-xl font-semibold flex-1 flex items-center gap-2"
          id="title"
        >
          {session.Closed && (
            <LockIcon className="h-5 w-5 text-gray-600 flex-shrink-0" />
          )}
          {session.Title}
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
      {/* Closed session information */}
      {session.Closed && (
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
      {/* Action buttons */}
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
            href={`/${eventSlug}/edit-session?sessionID=${session.ID}`}
            className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-md border border-rose-400 text-rose-400 hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-400 transition-colors"
            onClick={handleEditClick}
          >
            <PencilIcon className="h-3 w-3 mr-1" />
            Edit
          </Link>
        )}
      </div>{" "}
      {/* Session details */}
      <div className="space-y-2 mb-6 text-sm text-gray-700">
        <div className="flex gap-2">
          <span className="font-medium">Hosts(s):</span>
          <span>
            {session
              .Hosts!.map((h) => guests.find((g) => g.ID === h))
              .map((g) => g?.Name)
              .join(", ")}
          </span>
        </div>
        <div className="flex gap-2">
          <span className="font-medium">Location:</span>
          <span>{location && LocationTag({ location })}</span>
        </div>
        <div className="flex gap-2">
          <span className="font-medium">Time:</span>
          <span>
            {DateTime.fromISO(session["Start time"])
              .setZone("Europe/Berlin")
              .toFormat("EEEE HH:mm")}{" "}
            -{" "}
            {getEndTimeMinusBreak(session)
              .setZone("Europe/Berlin")
              .toFormat("HH:mm")}
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
      {/* Description (potentially long) */}
      <div className="mb-6">
        <h3 className="font-semibold mb-2">Description</h3>
        <p className="whitespace-pre-line">{session.Description}</p>
      </div>
      {/* Link to proposal (if exists) */}
      {session.proposal && (
        <p className="text-sm text-gray-600">
          This session was scheduled from a proposal. See it{" "}
          <a
            href={`/${eventSlug}/proposals/${session.proposal[0]}/view`}
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
