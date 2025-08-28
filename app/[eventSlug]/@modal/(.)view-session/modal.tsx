"use client";

import { createPortal } from "react-dom";
import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

import type { Event } from "@/db/events";
import type { Guest } from "@/db/guests";
import type { Session } from "@/db/sessions";
import type { RSVP } from "@/db/rsvps";
import { ViewSession } from "../../view-session/view-session";

export function SessionModal(props: {
  session: Session;
  guests: Guest[];
  rsvps: RSVP[];
  eventSlug: string;
  event: Event;
}) {
  const { session, guests, rsvps, eventSlug, event } = props;

  const router = useRouter();

  const onDismiss = useCallback(() => {
    router.back();
  }, [router]);

  useEffect(() => {
    // Disable body scroll when modal is open
    document.body.style.overflow = "hidden";

    // Handle Esc key press
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onDismiss();
      }
    };

    document.addEventListener("keydown", handleEscapeKey);

    return () => {
      document.body.style.overflow = "unset";
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [onDismiss]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Session details"
    >
      <div
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onDismiss}
      />
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <ViewSession
          session={session}
          guests={guests}
          rsvps={rsvps}
          eventSlug={eventSlug}
          event={event}
          showBackBtn={false}
          isInModal={true}
          onCloseModal={onDismiss}
        />
      </div>
    </div>,
    document.getElementById("modal-root")!
  );
}
