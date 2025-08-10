import { useContext } from "react";
import { VoteChoice, type Vote } from "@/app/votes";
import HoverTooltip from "@/app/hover-tooltip";
import { UserContext, VotesContext } from "@/app/context";

interface VotingButtonsProps {
  proposalId: string;
  votingEnabled: boolean;
  votingDisabledText: string;
  large?: boolean;
  onVote?: (proposalId: string, choice: VoteChoice) => Promise<boolean>;
}

export function VotingButtons({
  proposalId,
  votingEnabled,
  votingDisabledText,
  large = false,
  onVote,
}: VotingButtonsProps) {
  const { user: currentUserId } = useContext(UserContext);
  const { votes, addVote, removeVote, updateVote } = useContext(VotesContext);

  // update votes optimistically
  async function vote(proposalId: string, choice: VoteChoice) {
    if (!votingEnabled || !currentUserId) {
      return;
    }

    // If custom vote handler is provided, use it. This is needed for quick voting.
    // TODO: quite ugly, should be refactored
    if (onVote) {
      return onVote(proposalId, choice);
    }

    const existingVote = votes.find(
      (v) => v.proposal === proposalId && v.guest === currentUserId
    );
    if (existingVote?.choice === choice) {
      return deleteVote(proposalId);
    }

    try {
      const newVote: Vote = {
        proposal: proposalId,
        guest: currentUserId,
        choice: choice,
      };

      // Optimistic update
      if (existingVote) {
        updateVote(proposalId, choice);
      } else {
        addVote(newVote);
      }

      const response = await fetch("/api/add-vote", {
        method: "POST",
        body: JSON.stringify(newVote),
      });

      if (!response.ok) {
        // Revert optimistic update on failure
        if (existingVote) {
          updateVote(proposalId, existingVote.choice);
        } else {
          removeVote(proposalId);
        }
      }
      return response.ok;
    } catch (error: unknown) {
      // Revert optimistic update on error
      console.error("Error updating vote: ", error);
      if (existingVote) {
        updateVote(proposalId, existingVote.choice);
      } else {
        removeVote(proposalId);
      }
      return false;
    }
  }

  async function deleteVote(proposalId: string) {
    // Store the previous vote state for reversion
    const existingVote = votes.find(
      (v) => v.proposal === proposalId && v.guest === currentUserId
    );

    try {
      // Optimistic update
      removeVote(proposalId);

      const response = await fetch("/api/delete-vote", {
        method: "POST",
        body: JSON.stringify({
          proposalId,
          guestId: currentUserId,
        }),
      });

      if (!response.ok) {
        // Revert optimistic update on failure
        if (existingVote) {
          addVote(existingVote);
        }
        console.error("Failed to delete vote");
      }
      return response.ok;
    } catch (error: unknown) {
      // Revert optimistic update on error
      if (existingVote) {
        addVote(existingVote);
      }
      console.error("Error deleting vote: ", error);
      return false;
    }
  }

  const handleVote = (choice: VoteChoice, e: React.MouseEvent) => {
    void vote(proposalId, choice);
    e.stopPropagation();
  };

  return (
    <div
      className={`flex gap-1 ${large ? "gap-2 sm:gap-3 justify-center" : "flex-row"}`}
    >
      <HoverTooltip
        text={votingEnabled ? "Interested" : votingDisabledText}
        visible={true}
      >
        <button
          type="button"
          className={`rounded-md border border-black shadow-sm font-medium focus:ring-2 focus:ring-offset-2 text-black focus:outline-none
            ${large ? "w-16 h-16 sm:w-20 sm:h-20 flex flex-col items-center justify-center" : "px-1 py-1"}
            ${votingEnabled ? "" : "opacity-50 cursor-not-allowed grayscale"}
            ${votes.some((vote) => vote.proposal === proposalId && vote.choice === VoteChoice.interested && vote.guest === currentUserId) ? "bg-blue-200" : "bg-white"}`}
          disabled={!votingEnabled}
          onClick={(e) => handleVote(VoteChoice.interested, e)}
        >
          <div className={large ? "text-sm sm:text-lg mb-1" : ""}>❤️</div>
          {large && <div className="text-[10px] sm:text-xs">Interested</div>}
        </button>
      </HoverTooltip>
      <HoverTooltip
        text={votingEnabled ? "Maybe" : votingDisabledText}
        visible={true}
      >
        <button
          type="button"
          className={`rounded-md border border-black shadow-sm font-medium focus:ring-2 focus:ring-offset-2 text-black focus:outline-none
            ${large ? "w-16 h-16 sm:w-20 sm:h-20 flex flex-col items-center justify-center" : "px-1 py-1"}
            ${votingEnabled ? "" : "opacity-50 cursor-not-allowed grayscale"}
            ${votes.some((vote) => vote.proposal === proposalId && vote.choice === VoteChoice.maybe && vote.guest === currentUserId) ? "bg-blue-200" : "bg-white"}`}
          disabled={!votingEnabled}
          onClick={(e) => handleVote(VoteChoice.maybe, e)}
        >
          <div className={large ? "text-sm sm:text-lg mb-1" : ""}>⭐</div>
          {large && <div className="text-[10px] sm:text-xs">Maybe</div>}
        </button>
      </HoverTooltip>
      <HoverTooltip
        text={votingEnabled ? "Skip" : votingDisabledText}
        visible={true}
      >
        <button
          type="button"
          className={`rounded-md border border-black shadow-sm font-medium focus:ring-2 focus:ring-offset-2 text-black focus:outline-none
            ${large ? "w-16 h-16 sm:w-20 sm:h-20 flex flex-col items-center justify-center" : "px-1 py-1"}
            ${votingEnabled ? "" : "opacity-50 cursor-not-allowed grayscale"}
            ${votes.some((vote) => vote.proposal === proposalId && vote.choice === VoteChoice.skip && vote.guest === currentUserId) ? "bg-blue-200" : "bg-white"}`}
          disabled={!votingEnabled}
          onClick={(e) => handleVote(VoteChoice.skip, e)}
        >
          <div className={large ? "text-sm sm:text-lg mb-1" : ""}>👋🏽</div>
          {large && <div className="text-[10px] sm:text-xs">Skip</div>}
        </button>
      </HoverTooltip>
    </div>
  );
}
