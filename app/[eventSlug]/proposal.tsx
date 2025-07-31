"use client";

import type { Guest } from "@/db/guests";
import type { SessionProposal } from "@/db/sessionProposals";

export function Proposal(props: {
  proposal: SessionProposal;
  guests: Guest[];
}) {
  const { proposal, guests } = props;
  const displayDuration = (duration: number) => {
    if (duration === 30) {
      return "30 minutes";
    } else {
      const numHours = duration / 60;
      const hoursStr = numHours === 1 ? "hour" : "hours";
      return `${numHours} ${hoursStr}`;
    }
  };
  return (
    <>
      <p className="text-xl font-semibold mb-2">{proposal.title}</p>
      <p className="text-lg font-medium text-gray-700 mb-4">
        {proposal.hosts
          .map((h) => guests.find((g) => g.ID === h))
          .map((g) => g?.Name)
          .join(", ")}
      </p>
      <p className="mb-3 whitespace-pre-line">{proposal.description}</p>
      {proposal.durationMinutes && (
        <p className="text-sm text-gray-600 mb-4">
          Duration: {displayDuration(proposal.durationMinutes)}
        </p>
      )}
    </>
  );
}
