"use client";

import { createPortal } from "react-dom";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import type { SessionProposal } from "@/db/sessionProposals";
import type { Event } from "@/db/events";
import type { Guest } from "@/db/guests";
import { ViewProposal } from "@/app/[eventSlug]/proposals/[proposalId]/view/view-proposal";
import { VoteChoice } from "@/app/votes";

export function ProposalModal(props: {
  proposal: SessionProposal;
  guests: Guest[];
  eventSlug: string;
  event: Event;
  vote: VoteChoice | null;
}) {
  const { proposal, guests, eventSlug, event, vote } = props;

  const router = useRouter();

  useEffect(() => {
    // Disable body scroll when modal is open
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  function onDismiss() {
    router.back();
  }

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/50" onClick={onDismiss}>
      <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className="relative max-h-[95vh] sm:max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 sm:p-6">
            <ViewProposal
              proposal={proposal}
              guests={guests}
              eventSlug={eventSlug}
              event={event}
              showBackBtn={false}
              vote={vote}
              titleId="modal-title"
              isInModal={true}
              onCloseModal={onDismiss}
            />
          </div>
          <button
            onClick={onDismiss}
            className="absolute right-2 top-2 sm:right-4 sm:top-4 rounded-full bg-gray-100 p-2 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
