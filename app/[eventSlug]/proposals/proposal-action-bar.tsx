"use client";

import { useContext } from "react";
import Link from "next/link";
import { PlusIcon, ChartBarIcon } from "@heroicons/react/24/outline";

import HoverTooltip from "@/app/hover-tooltip";
import { inVotingPhase, dateStartDescription } from "@/app/utils/events";
import { UserContext } from "@/app/context";
import type { Event } from "@/db/events";

export function ProposalActionBar({
  eventSlug,
  event,
}: {
  eventSlug: string;
  event: Event;
}) {
  const { user: currentUserId } = useContext(UserContext);
  const votingEnabled = !!currentUserId && inVotingPhase(event);
  const votingDisabledText = !inVotingPhase(event)
    ? `Voting ${dateStartDescription(event.votingPhaseStart)}`
    : "Select a user first";

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center mb-6">
      <Link
        href={`/${eventSlug}/proposals/new`}
        className="bg-rose-400 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-rose-500 transition-colors"
      >
        <PlusIcon className="h-5 w-5" />
        <span>Add Proposal</span>
      </Link>
      <HoverTooltip text={votingDisabledText} visible={!votingEnabled}>
        <Link
          href={votingEnabled ? `/${eventSlug}/proposals/quick-voting` : "#"}
          className={`bg-rose-400 text-white px-4 py-2 rounded-md flex items-center gap-2 ${
            votingEnabled
              ? "hover:bg-rose-500 transition-colors"
              : "opacity-50 cursor-not-allowed"
          }`}
          {...(!votingEnabled && { onClick: (e) => e.preventDefault() })}
        >
          <ChartBarIcon className="h-5 w-5" />
          <span>Go to Quick Voting!</span>
        </Link>
      </HoverTooltip>
    </div>
  );
}
