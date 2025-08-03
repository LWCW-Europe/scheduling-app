"use client";

import { useContext } from "react";
import Link from "next/link";
import { PencilIcon, CalendarIcon } from "@heroicons/react/24/outline";

import { UserContext } from "@/app/context";
import { Proposal } from "@/app/[eventSlug]/proposal";
import type { Guest } from "@/db/guests";
import type { SessionProposal } from "@/db/sessionProposals";

export function ViewProposal(props: {
  proposal: SessionProposal;
  guests: Guest[];
  eventSlug: string;
}) {
  const { proposal, guests, eventSlug } = props;
  const { user: currentUserId } = useContext(UserContext);
  const canEdit = () => {
    if (proposal.hosts.length === 0) {
      return true;
    } else {
      return currentUserId && proposal.hosts.includes(currentUserId);
    }
  };

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
          <div className="relative inline-block group">
            <button
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-md border border-rose-400 text-rose-400 opacity-50 cursor-not-allowed"
              disabled
            >
              <CalendarIcon className="h-3 w-3 mr-1" />
              Schedule
            </button>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-sm text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              Scheduling is not yet enabled
            </div>
          </div>
        </div>
      )}

      {/* Voting buttons section */}
      <div className="mt-6 flex gap-3 flex-wrap">
        <div className="relative inline-block group">
          <button
            type="button"
            className="opacity-50 cursor-not-allowed rounded-md border border-black shadow-sm w-20 h-20 bg-white font-medium text-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 grayscale flex flex-col items-center justify-center"
            disabled
          >
            <div className="text-lg mb-1">❤️</div>
            <div className="text-xs">Interested</div>
          </button>
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-sm text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
            Voting is not yet enabled
          </div>
        </div>
        <div className="relative inline-block group">
          <button
            type="button"
            className="opacity-50 cursor-not-allowed rounded-md border border-black shadow-sm w-20 h-20 bg-white font-medium text-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 grayscale flex flex-col items-center justify-center"
            disabled
          >
            <div className="text-lg mb-1">⭐</div>
            <div className="text-xs">Maybe</div>
          </button>
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-sm text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
            Voting is not yet enabled
          </div>
        </div>
        <div className="relative inline-block group">
          <button
            type="button"
            className="opacity-50 cursor-not-allowed rounded-md border border-black shadow-sm w-20 h-20 bg-white font-medium text-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 grayscale flex flex-col items-center justify-center"
            disabled
          >
            <div className="text-lg mb-1">👋🏽</div>
            <div className="text-xs">Skip</div>
          </button>
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-sm text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
            Voting is not yet enabled
          </div>
        </div>
      </div>
    </div>
  );
}
