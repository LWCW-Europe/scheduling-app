"use client";

import { createPortal } from "react-dom";
import { type ElementRef, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import type { SessionProposal } from "@/db/sessionProposals";
import type { Event } from "@/db/events";
import type { Guest } from "@/db/guests";
import { ViewProposal } from "@/app/[eventSlug]/proposals/[proposalId]/view-proposal";

export function ProposalModal(props: {
  proposal: SessionProposal;
  guests: Guest[];
  eventSlug: string;
  event: Event;
}) {
  const { proposal, guests, eventSlug, event } = props;

  const router = useRouter();
  const dialogRef = useRef<ElementRef<"dialog">>(null);

  useEffect(() => {
    if (!dialogRef.current?.open) {
      dialogRef.current?.showModal();
    }
  }, []);

  function onDismiss() {
    router.back();
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onDismiss} />
      <dialog
        ref={dialogRef}
        className="relative z-10 max-h-[85vh] w-fit max-w-[90vw] overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
        onClose={onDismiss}
      >
        <div className="w-full">
          <ViewProposal
            proposal={proposal}
            guests={guests}
            eventSlug={eventSlug}
            event={event}
            includeBackButtons={false}
          />
        </div>
        <button
          onClick={onDismiss}
          className="absolute right-4 top-4 rounded-full bg-gray-100 p-2 hover:bg-gray-200"
        >
          ✕
        </button>
      </dialog>
    </div>,
    document.getElementById("modal-root")!
  );
}
