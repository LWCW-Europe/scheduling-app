"use client";

import { useContext } from "react";
import Link from "next/link";
import { PencilIcon, CalendarIcon } from "@heroicons/react/24/outline";

import {
  inVotingPhase,
  inSchedPhase,
  dateStartDescription,
} from "@/app/utils/events";
import HoverTooltip from "@/app/hover-tooltip";
import { UserContext } from "@/app/context";
import { Proposal } from "@/app/[eventSlug]/proposal";
import type { Event } from "@/db/events";
import type { Guest } from "@/db/guests";
import type { SessionProposal } from "@/db/sessionProposals";

export function ViewProposal(props: {
  proposal: SessionProposal;
  guests: Guest[];
  eventSlug: string;
  event: Event;
}) {
  const { proposal, guests, eventSlug, event } = props;
  const { user: currentUserId } = useContext(UserContext);
  const canEdit = () => {
    if (proposal.hosts.length === 0) {
      return true;
    } else {
      return currentUserId && proposal.hosts.includes(currentUserId);
    }
  };

  const votingEnabled = inVotingPhase(event);
  const schedEnabled = inSchedPhase(event);
  const votingDisabledText = `Voting ${dateStartDescription(event.votingPhaseStart)}`;
  const schedDisabledText = `Scheduling ${dateStartDescription(event.schedulingPhaseStart)}`;

  return (
    <div className="max-w-2xl mx-auto pb-24">
      <Proposal proposal={proposal} guests={guests} />

      {canEdit() && (
        <div className="mt-6 flex gap-2 flex-wrap">
          <div className="relative inline-block group">
            <Link
              href={`/${eventSlug}/proposals/${proposal.id}/edit`}
              className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-md border border-rose-400 text-rose-400 hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-400 transition-colors"
            >
              <PencilIcon className="h-3 w-3 mr-1" />
              Edit
            </Link>
          </div>
          <HoverTooltip text={schedDisabledText} visible={!schedEnabled}>
            <button
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-md border border-rose-400 text-rose-400 opacity-50 cursor-not-allowed"
              disabled
            >
              <CalendarIcon className="h-3 w-3 mr-1" />
              Schedule
            </button>
          </HoverTooltip>
        </div>
      )}

      {/* Voting buttons section */}
      {!canEdit() && (
        <div className="mt-6 flex gap-3 flex-wrap">
          <HoverTooltip text={votingDisabledText} visible={!votingEnabled}>
            <button
              type="button"
              className="opacity-50 cursor-not-allowed rounded-md border border-black shadow-sm w-20 h-20 bg-white font-medium text-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 grayscale flex flex-col items-center justify-center"
              disabled
            >
              <div className="text-lg mb-1">❤️</div>
              <div className="text-xs">Interested</div>
            </button>
          </HoverTooltip>
          <HoverTooltip text={votingDisabledText} visible={!votingEnabled}>
            <button
              type="button"
              className="opacity-50 cursor-not-allowed rounded-md border border-black shadow-sm w-20 h-20 bg-white font-medium text-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 grayscale flex flex-col items-center justify-center"
              disabled
            >
              <div className="text-lg mb-1">⭐</div>
              <div className="text-xs">Maybe</div>
            </button>
          </HoverTooltip>
          <HoverTooltip text={votingDisabledText} visible={!votingEnabled}>
            <button
              type="button"
              className="opacity-50 cursor-not-allowed rounded-md border border-black shadow-sm w-20 h-20 bg-white font-medium text-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 grayscale flex flex-col items-center justify-center"
              disabled
            >
              <div className="text-lg mb-1">👋🏽</div>
              <div className="text-xs">Skip</div>
            </button>
          </HoverTooltip>
        </div>
      )}
    </div>
  );
}
