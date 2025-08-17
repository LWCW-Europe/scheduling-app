"use client";

import { useContext } from "react";
import Link from "next/link";
import {
  PlusIcon,
  ChartBarIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";

import HoverTooltip from "@/app/hover-tooltip";
import {
  inVotingPhase,
  inSchedPhase,
  dateStartDescription,
  inProposalPhase,
} from "@/app/utils/events";
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

  let votingDisabledText = "";
  if (inSchedPhase(event)) {
    votingDisabledText = `The voting phase is over`;
  } else if (inProposalPhase(event)) {
    votingDisabledText = `Voting ${dateStartDescription(event.votingPhaseStart)}`;
  } else if (!currentUserId) {
    votingDisabledText = "Select a user first";
  }

  const schedEnabled = inSchedPhase(event);
  const schedDisabledText = `Scheduling ${dateStartDescription(event.schedulingPhaseStart)}`;

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center mb-6">
      <HoverTooltip
        text="Proposal and voting phases are over"
        visible={inSchedPhase(event)}
      >
        <Link
          href={`/${eventSlug}/proposals/new`}
          className={`bg-rose-400 hover:bg-rose-500 transition-colors text-white px-4 py-2 rounded-md flex items-center gap-2 ${
            inSchedPhase(event) ? "opacity-50 cursor-not-allowed" : ""
          }`}
          {...(inSchedPhase(event) && { onClick: (e) => e.preventDefault() })}
        >
          <PlusIcon className="h-5 w-5" />
          <span>Add Proposal</span>
        </Link>
      </HoverTooltip>
      <HoverTooltip text={votingDisabledText} visible={!votingEnabled}>
        <Link
          href={votingEnabled ? `/${eventSlug}/proposals/quick-voting` : "#"}
          className={`bg-rose-400 hover:bg-rose-500 transition-colors text-white px-4 py-2 rounded-md flex items-center gap-2 ${
            votingEnabled ? "" : "opacity-50 cursor-not-allowed"
          }`}
          {...(!votingEnabled && { onClick: (e) => e.preventDefault() })}
        >
          <ChartBarIcon className="h-5 w-5" />
          <span>Go to Quick Voting!</span>
        </Link>
      </HoverTooltip>
      <HoverTooltip text={schedDisabledText} visible={!schedEnabled}>
        <Link
          href={schedEnabled ? `/${eventSlug}` : "#"}
          className={`bg-rose-400 hover:bg-rose-500 transition-colors text-white px-4 py-2 rounded-md flex items-center gap-2 ${
            schedEnabled ? "" : "opacity-50 cursor-not-allowed"
          }`}
          {...(!schedEnabled && { onClick: (e) => e.preventDefault() })}
        >
          <CalendarDaysIcon className="h-5 w-5" />
          <span>View Schedule</span>
        </Link>
      </HoverTooltip>
    </div>
  );
}
