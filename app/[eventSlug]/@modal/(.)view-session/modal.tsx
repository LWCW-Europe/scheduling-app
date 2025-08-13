"use client";

import { createPortal } from "react-dom";
import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

import type { Event } from "@/db/events";
import type { Guest } from "@/db/guests";
import type { Session } from "@/db/sessions";
import { ViewSession } from "../../view-session/view-session";

export function SessionModal(props: {
  session: Session;
  guests: Guest[];
  eventSlug: string;
  event: Event;
}) {
  const { session, guests, eventSlug, event } = props;

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
    <div className="fixed inset-0 z-50 bg-black/50" onClick={onDismiss}>
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <ViewSession
              session={session}
              guests={guests}
              eventSlug={eventSlug}
              event={event}
              showBackBtn={false}
            />
          </div>
          <button
            onClick={onDismiss}
            className="absolute right-4 top-4 rounded-full bg-gray-100 p-2 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
      </div>
    </div>,
    document.getElementById("modal-root")!
  );
}
