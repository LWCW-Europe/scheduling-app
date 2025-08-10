"use client";

import { useContext, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { VoteChoice } from "@/app/votes";

export function ViewProposal(props: {
  proposal: SessionProposal;
  guests: Guest[];
  eventSlug: string;
  event: Event;
  showBackBtn: boolean;
  vote: VoteChoice | null;
  titleId?: string;
  isInModal?: boolean;
  onCloseModal?: () => void;
}) {
  const {
    proposal,
    guests,
    eventSlug,
    event,
    showBackBtn,
    vote: initialVote,
    titleId,
    isInModal = false,
    onCloseModal,
  } = props;
  const { user: currentUserId } = useContext(UserContext);
  const [vote, setVote] = useState(initialVote);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const onClickVote = async (choice: VoteChoice) => {
    if (!votingEnabled) {
      return;
    }
    setIsLoading(true);
    const previousVote = vote;
    const newChoice = vote === choice ? null : choice;

    let response: Response;
    if (newChoice === null) {
      response = await fetch("/api/delete-vote", {
        method: "POST",
        body: JSON.stringify({
          proposalId: proposal.id,
          guestId: currentUserId,
        }),
      });
    } else {
      response = await fetch("/api/add-vote", {
        method: "POST",
        body: JSON.stringify({
          proposal: proposal.id,
          guest: currentUserId,
          choice: newChoice,
        }),
      });
    }
    if (response.ok) {
      setVote(newChoice);
    } else {
      setVote(previousVote);
    }
    if (isInModal) {
      window.dispatchEvent(
        new CustomEvent("proposalVoted", {
          detail: {
            proposalId: proposal.id,
            choice: newChoice,
          },
        })
      );
    }
    setIsLoading(false);
  };

  const canEdit = () => {
    if (proposal.hosts.length === 0) {
      return true;
    } else {
      return currentUserId && proposal.hosts.includes(currentUserId);
    }
  };

  const isHost = () => {
    return currentUserId && proposal.hosts.includes(currentUserId);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    if (isInModal && onCloseModal) {
      e.preventDefault();
      onCloseModal();
      // Small delay to allow modal to close before navigation
      setTimeout(() => {
        router.push(`/${eventSlug}/proposals/${proposal.id}/edit`);
      }, 100);
    }
    // If not in modal, let the Link component handle the navigation normally
  };

  const votingEnabled = !!currentUserId && inVotingPhase(event) && !isLoading;
  const schedEnabled = inSchedPhase(event);
  let votingDisabledText = "";
  if (!inVotingPhase(event)) {
    votingDisabledText = `Voting ${dateStartDescription(event.votingPhaseStart)}`;
  } else if (!currentUserId) {
    votingDisabledText = "Select a user first";
  } else if (isLoading) {
    votingDisabledText = "Loading...";
  }
  const schedDisabledText = `Scheduling ${dateStartDescription(event.schedulingPhaseStart)}`;

  return (
    <div className="max-w-2xl mx-auto pb-24 break-words">
      <Proposal
        eventSlug={eventSlug}
        proposal={proposal}
        guests={guests}
        showBackBtn={showBackBtn}
        titleId={titleId}
      />

      {canEdit() && (
        <div className="mt-6 flex gap-2 flex-wrap">
          <div className="relative inline-block group">
            <Link
              href={`/${eventSlug}/proposals/${proposal.id}/edit`}
              className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-md border border-rose-400 text-rose-400 hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-400 transition-colors"
              onClick={handleEditClick}
            >
              <PencilIcon className="h-3 w-3 mr-1" />
              Edit
            </Link>
          </div>
          <HoverTooltip text={schedDisabledText} visible={!schedEnabled}>
            <button
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-md border border-rose-400 text-rose-400 opacity-50 cursor-not-allowed"
              disabled={!schedEnabled}
            >
              <CalendarIcon className="h-3 w-3 mr-1" />
              Schedule
            </button>
          </HoverTooltip>
        </div>
      )}

      {/* Voting buttons section */}
      {!isHost() && (
        <div className="mt-6 flex gap-3 flex-wrap">
          <HoverTooltip text={votingDisabledText} visible={!votingEnabled}>
            <button
              type="button"
              className={`rounded-md border border-black shadow-sm w-20 h-20 font-medium focus:ring-2 focus:ring-offset-2 text-black focus:outline-none flex flex-col items-center justify-center
                ${votingEnabled ? "" : "opacity-50 cursor-not-allowed grayscale focus:ring-gray-200"}
                ${vote === VoteChoice.interested ? "bg-blue-200" : "bg-white"}`}
              disabled={!votingEnabled}
              onClick={() => void onClickVote(VoteChoice.interested)}
            >
              <div className="text-lg mb-1">❤️</div>
              <div className="text-xs">Interested</div>
            </button>
          </HoverTooltip>
          <HoverTooltip text={votingDisabledText} visible={!votingEnabled}>
            <button
              type="button"
              className={`rounded-md border border-black shadow-sm w-20 h-20 font-medium focus:ring-2 focus:ring-offset-2 text-black focus:outline-none flex flex-col items-center justify-center
                ${votingEnabled ? "" : "opacity-50 cursor-not-allowed grayscale focus:ring-gray-200"}
                ${vote === VoteChoice.maybe ? "bg-blue-200" : "bg-white"}`}
              disabled={!votingEnabled}
              onClick={() => void onClickVote(VoteChoice.maybe)}
            >
              <div className="text-lg mb-1">⭐</div>
              <div className="text-xs">Maybe</div>
            </button>
          </HoverTooltip>
          <HoverTooltip text={votingDisabledText} visible={!votingEnabled}>
            <button
              type="button"
              className={`rounded-md border border-black shadow-sm w-20 h-20 font-medium focus:ring-2 focus:ring-offset-2 text-black focus:outline-none flex flex-col items-center justify-center
                ${votingEnabled ? "" : "opacity-50 cursor-not-allowed grayscale focus:ring-gray-200"}
                ${vote === VoteChoice.skip ? "bg-blue-200" : "bg-white"}`}
              disabled={!votingEnabled}
              onClick={() => void onClickVote(VoteChoice.skip)}
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
