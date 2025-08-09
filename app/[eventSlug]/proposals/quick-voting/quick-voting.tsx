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
        <>
          <Proposal
            eventSlug={eventSlug}
            proposal={proposal}
            guests={guests}
            showBackBtn={false}
          />
          <p className="mt-6">
            <button
              type="button"
              className="ml-4 rounded-md border border-black shadow-sm px-6 py-2 bg-white font-medium text-black hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200"
              onClick={() => void vote(proposal.id, VoteChoice.interested)}
            >
              ❤️ Interested
            </button>
            <button
              type="button"
              className="ml-4 rounded-md border border-black shadow-sm px-6 py-2 bg-white font-medium text-black hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200"
              onClick={() => void vote(proposal.id, VoteChoice.maybe)}
            >
              ⭐ Maybe
            </button>
            <button
              type="button"
              className="ml-4 rounded-md border border-black shadow-sm px-6 py-2 bg-white font-medium text-black hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200"
              onClick={() => void vote(proposal.id, VoteChoice.skip)}
            >
              👋🏽 Skip
            </button>
          </p>
        </>
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
    <div className="max-w-2xl mx-auto pb-24">
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
    </div>
  );
}
