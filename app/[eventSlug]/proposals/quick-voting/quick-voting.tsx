"use client";
import { useState } from "react";
import Link from "next/link";

import { Proposal } from "@/app/[eventSlug]/proposal";
import { Vote, VoteChoice } from "@/app/votes";
import type { SessionProposal } from "@/db/sessionProposals";
import type { Guest } from "@/db/guests";

export function QuickVoting(props: {
  proposals: SessionProposal[];
  guests: Guest[];
  currentUser: string;
  initialVotes: Vote[];
  eventSlug: string;
}) {
  const { proposals, guests, currentUser, initialVotes, eventSlug } = props;
  const [votes, setVotes] = useState(initialVotes);

  const totalProposals = proposals.length;
  const currentUserName = guests.find((g) => g.ID === currentUser)?.Name;
  const eligibleProposals = proposals
    .filter((pr) => !votes.some((vote) => vote.proposal === pr.id))
    .sort((a, b) => a.votesCount - b.votesCount);
  const proposal = eligibleProposals.at(0);

  // update votes optimistically
  async function vote(proposal: string, choice: VoteChoice) {
    try {
      const newVote: Vote = {
        proposal,
        guest: currentUser,
        choice: choice,
      };
      setVotes((prevVotes) => [...prevVotes, newVote]);

      const response = await fetch("/api/add-vote", {
        method: "POST",
        body: JSON.stringify(newVote),
      });

      if (!response.ok) {
        // Revert optimistic update on failure
        setVotes(initialVotes);
      }
      return response.ok;
    } catch (error: unknown) {
      // Revert optimistic update on error
      console.error("Error updating vote:", error);
      setVotes(initialVotes);
      return false;
    }
  }

  function showNextProposal() {
    if (proposal) {
      return (
        <Proposal
          eventSlug={eventSlug}
          proposal={proposal}
          guests={guests}
          showBackBtn={false}
        />
      );
    } else {
      return (
        <p>
          You have voted on all proposals. Go to the overview to change your
          votes.
        </p>
      );
    }
  }

  return (
    <div className="max-w-2xl mx-auto pb-32 relative">
      <Link
        className="bg-rose-400 text-white font-semibold py-2 px-4 rounded shadow hover:bg-rose-500 active:bg-rose-500 w-fit px-12"
        href={`/${eventSlug}/proposals`}
      >
        Back to Proposals
      </Link>
      <p className="text-2xl font-bold mt-4 mb-4">LWCW 2025 Quick Voting</p>
      <div className="flex justify-between mb-6">
        <div className="text-gray-600">
          You have voted on {votes.length} / {totalProposals} proposals
        </div>
        <div className="text-gray-600">You are: {currentUserName}</div>
      </div>

      {showNextProposal()}

      {/* Fixed voting buttons - only show when there's a proposal to vote on */}
      {proposal && (
        <div className="fixed bottom-4 sm:bottom-16 left-1/2 transform -translate-x-1/2 z-30 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-3 sm:p-4">
          <div className="flex gap-2 sm:gap-3 justify-center">
            <button
              type="button"
              className="rounded-md border border-black shadow-sm w-16 h-16 sm:w-20 sm:h-20 bg-white font-medium text-black hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 active:bg-gray-300 flex flex-col items-center justify-center"
              onClick={() => void vote(proposal.id, VoteChoice.interested)}
            >
              <div className="text-lg sm:text-xl mb-1">❤️</div>
              <div className="text-[10px] sm:text-xs">Interested</div>
            </button>
            <button
              type="button"
              className="rounded-md border border-black shadow-sm w-16 h-16 sm:w-20 sm:h-20 bg-white font-medium text-black hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 active:bg-gray-300 flex flex-col items-center justify-center"
              onClick={() => void vote(proposal.id, VoteChoice.maybe)}
            >
              <div className="text-lg sm:text-xl mb-1">⭐</div>
              <div className="text-[10px] sm:text-xs">Maybe</div>
            </button>
            <button
              type="button"
              className="rounded-md border border-black shadow-sm w-16 h-16 sm:w-20 sm:h-20 bg-white font-medium text-black hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 active:bg-gray-300 flex flex-col items-center justify-center"
              onClick={() => void vote(proposal.id, VoteChoice.skip)}
            >
              <div className="text-lg sm:text-xl mb-1">👋🏽</div>
              <div className="text-[10px] sm:text-xs">Skip</div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
