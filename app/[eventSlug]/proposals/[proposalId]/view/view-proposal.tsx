"use client";

import { useContext } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PencilIcon, CalendarIcon } from "@heroicons/react/24/outline";

import {
  inVotingPhase,
  inSchedPhase,
  dateStartDescription,
} from "@/app/utils/events";
import HoverTooltip from "@/app/hover-tooltip";
import { UserContext, VotesContext } from "@/app/context";
import { Proposal } from "@/app/[eventSlug]/proposal";
import type { Event } from "@/db/events";
import type { Guest } from "@/db/guests";
import type { SessionProposal } from "@/db/sessionProposals";
import type { Session } from "@/db/sessions";
import { VotingButtons } from "@/app/[eventSlug]/proposals/voting-buttons";
import { VoteChoice } from "@/app/votes";
import { DateTime } from "luxon";

export function ViewProposal(props: {
  proposal: SessionProposal;
  guests: Guest[];
  sessions: Session[];
  eventSlug: string;
  event: Event;
  showBackBtn: boolean;
  titleId?: string;
  isInModal?: boolean;
  onCloseModal?: () => void;
}) {
  const {
    proposal,
    guests,
    eventSlug,
    event,
    sessions: allSessions,
    showBackBtn,
    titleId,
    isInModal = false,
    onCloseModal,
  } = props;
  const { user: currentUserId } = useContext(UserContext);
  const { proposalVoteEmoji, votes } = useContext(VotesContext);
  const router = useRouter();

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

  const votingEnabled = !!currentUserId && inVotingPhase(event);
  const schedEnabled = inSchedPhase(event);
  let votingDisabledText = "";
  if (!inVotingPhase(event)) {
    votingDisabledText = `Voting ${dateStartDescription(event.votingPhaseStart)}`;
  } else if (!currentUserId) {
    votingDisabledText = "Select a user first";
  }
  const schedDisabledText = `Scheduling ${dateStartDescription(event.schedulingPhaseStart)}`;

  const sessions = (proposal.sessions || []).map(
    (ses) => allSessions.find((s) => s.ID === ses)!
  );

  return (
    <div
      className={`${isInModal ? "w-full p-6" : "max-w-2xl mx-auto"} pb-12 break-words overflow-hidden`}
    >
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
      {!isHost() && !schedEnabled && (
        <div className="mt-6 flex gap-2 sm:gap-3 flex-wrap justify-center sm:justify-start">
          <VotingButtons
            proposalId={proposal.id}
            votingEnabled={votingEnabled}
            votingDisabledText={votingDisabledText}
            large={true}
          />
        </div>
      )}
      {schedEnabled && (
        <div className="mt-6 space-y-3">
          {!isHost() && (
            <div className="text-sm text-gray-700">
              Your vote:
              <span
                title={(() => {
                  const vote = votes.find(
                    (v) =>
                      v.proposal === proposal.id && v.guest === currentUserId
                  );
                  if (!vote) return "No vote";
                  switch (vote.choice) {
                    case VoteChoice.interested:
                      return "Interested";
                    case VoteChoice.maybe:
                      return "Maybe";
                    case VoteChoice.skip:
                      return "Skip";
                    default:
                      return "No vote";
                  }
                })()}
                className="ml-1"
              >
                {proposalVoteEmoji(proposal.id)}
              </span>
            </div>
          )}
          <div className="text-sm text-gray-700">
            Total votes:
            <span className="ml-2 inline-flex items-center gap-3">
              <span
                title={`${proposal.interestedVotesCount} interested vote${proposal.interestedVotesCount !== 1 ? "s" : ""}`}
                className="inline-flex items-center gap-1 text-sm text-gray-500"
              >
                ❤️&nbsp;{proposal.interestedVotesCount}
              </span>
              <span
                title={`${proposal.maybeVotesCount} maybe vote${proposal.maybeVotesCount !== 1 ? "s" : ""}`}
                className="inline-flex items-center gap-1 text-sm text-gray-500"
              >
                ⭐&nbsp;{proposal.maybeVotesCount}
              </span>
            </span>
          </div>
        </div>
      )}
      {schedEnabled && (
        <div className="mt-6 text-sm text-gray-600">
          {sessions.length === 0 ? (
            <p>This proposal has not been scheduled yet.</p>
          ) : sessions.length === 1 ? (
            <p>
              This proposal was scheduled on{" "}
              <Link
                href={`/${eventSlug}/view-session?sessionID=${sessions[0].ID}`}
                className="text-rose-500 underline hover:text-rose-600 transition-colors"
              >
                {DateTime.fromISO(sessions[0]["Start time"])
                  .setZone("Europe/Berlin")
                  .toFormat("EEEE")}{" "}
                at{" "}
                {DateTime.fromISO(sessions[0]["Start time"])
                  .setZone("Europe/Berlin")
                  .toFormat("HH:mm")}{" "}
                in {sessions[0]["Location name"]}
              </Link>
              .
            </p>
          ) : (
            <div>
              <p>This proposal was scheduled several times:</p>
              <ul className="mt-2 space-y-1 ml-4">
                {sessions.map((session) => (
                  <li key={session.ID}>
                    <Link
                      href={`/${eventSlug}/view-session?sessionID=${session.ID}`}
                      className="text-rose-500 underline hover:text-rose-600 transition-colors"
                    >
                      {DateTime.fromISO(session["Start time"])
                        .setZone("Europe/Berlin")
                        .toFormat("EEEE HH:mm")}{" "}
                      in {session["Location name"]}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
