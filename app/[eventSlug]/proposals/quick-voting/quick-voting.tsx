"use client";
import { useContext, useState } from "react";
import Link from "next/link";

import { Proposal } from "@/app/[eventSlug]/proposal";
import { Vote, VoteChoice } from "@/app/votes";
import type { SessionProposal } from "@/db/sessionProposals";
import type { Guest } from "@/db/guests";
import { VotingButtons } from "@/app/[eventSlug]/proposals/voting-buttons";
import { VotesContext } from "@/app/context";

export function QuickVoting(props: {
  proposals: SessionProposal[];
  guests: Guest[];
  currentUser: string;
  initialVotes: Vote[];
  eventSlug: string;
}) {
  const { proposals, guests, currentUser, initialVotes, eventSlug } = props;
  const [votes, setVotes] = useState(initialVotes);
  const { addVote, removeVote, updateVote, getVote } = useContext(VotesContext);

  const totalProposals = proposals.length;
  const currentUserName = guests.find((g) => g.ID === currentUser)?.Name;
  const eligibleProposals = proposals
    .filter((pr) => !votes.some((vote) => vote.proposal === pr.id))
    .sort((a, b) => a.votesCount - b.votesCount);
  const proposal = eligibleProposals.at(0);

  // Custom vote handler for quick voting
  async function handleVote(proposalId: string, choice: VoteChoice) {
    const previousVote = getVote(proposalId);
    const optimisticVote: Vote = {
      proposal: proposalId,
      guest: currentUser,
      choice,
    };

    try {
      // Optimistic local state for next-proposal selection
      setVotes((prevVotes) => {
        const existingIndex = prevVotes.findIndex(
          (v) => v.proposal === proposalId && v.guest === currentUser
        );
        if (existingIndex >= 0) {
          const updated = [...prevVotes];
          updated[existingIndex] = optimisticVote;
          return updated;
        }
        return [...prevVotes, optimisticVote];
      });

      // Optimistic global context update for overview/UI highlight
      if (previousVote) {
        updateVote(proposalId, choice);
      } else {
        addVote(optimisticVote);
      }

      const response = await fetch("/api/add-vote", {
        method: "POST",
        body: JSON.stringify(optimisticVote),
      });

      if (!response.ok) {
        // Revert both local and global on failure
        setVotes((prevVotes) => {
          // revert to previous choice if existed, else remove
          if (previousVote) {
            const idx = prevVotes.findIndex(
              (v) => v.proposal === proposalId && v.guest === currentUser
            );
            if (idx >= 0) {
              const reverted = [...prevVotes];
              reverted[idx] = previousVote;
              return reverted;
            }
          }
          return prevVotes.filter(
            (v) => !(v.proposal === proposalId && v.guest === currentUser)
          );
        });

        if (previousVote) {
          updateVote(proposalId, previousVote.choice);
        } else {
          removeVote(proposalId);
        }
      }
      return response.ok;
    } catch (error: unknown) {
      // Revert both local and global on error
      console.error("Error updating vote:", error);
      setVotes((prevVotes) => {
        if (previousVote) {
          const idx = prevVotes.findIndex(
            (v) => v.proposal === proposalId && v.guest === currentUser
          );
          if (idx >= 0) {
            const reverted = [...prevVotes];
            reverted[idx] = previousVote;
            return reverted;
          }
        }
        return prevVotes.filter(
          (v) => !(v.proposal === proposalId && v.guest === currentUser)
        );
      });

      if (previousVote) {
        updateVote(proposalId, previousVote.choice);
      } else {
        removeVote(proposalId);
      }
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
          <VotingButtons
            proposalId={proposal.id}
            votingEnabled={true}
            votingDisabledText=""
            large={true}
            onVote={handleVote}
          />
        </div>
      )}
    </div>
  );
}
