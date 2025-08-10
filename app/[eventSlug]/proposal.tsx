"use client";

import Link from "next/link";

import type { Guest } from "@/db/guests";
import type { SessionProposal } from "@/db/sessionProposals";

export function displayDuration(duration: number) {
  if (duration === 30) {
    return "30 minutes";
  } else {
    const numHours = duration / 60;
    const hoursStr = numHours === 1 ? "hour" : "hours";
    return `${numHours} ${hoursStr}`;
  }
}

export function Proposal(props: {
  eventSlug: string;
  proposal: SessionProposal;
  guests: Guest[];
  showBackBtn: boolean;
  titleId?: string;
}) {
  const { eventSlug, proposal, guests, showBackBtn, titleId } = props;
  return (
    <>
      {showBackBtn && (
        <Link
          className="bg-rose-400 text-white font-semibold py-2 px-4 rounded shadow hover:bg-rose-500 active:bg-rose-500 w-fit px-12"
          href={`/${eventSlug}/proposals`}
        >
          Back to Proposals
        </Link>
      )}
      <h2 className="text-xl font-semibold mb-2 mt-5" id={titleId}>
        {proposal.title}
      </h2>
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
