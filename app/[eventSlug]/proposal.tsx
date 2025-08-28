"use client";

import Link from "next/link";

import type { Guest } from "@/db/guests";
import type { SessionProposal } from "@/db/sessionProposals";
import { formatDuration, subtractBreakFromDuration } from "@/utils/utils";

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
          className="bg-rose-400 text-white font-semibold py-2 px-4 rounded shadow hover:bg-rose-500 active:bg-rose-500 w-fit px-12 mt-4 mb-2 block"
          href={`/${eventSlug}/proposals`}
        >
          Back to Proposals
        </Link>
      )}
      <h1 className="text-xl font-semibold mb-2 mt-5" id={titleId}>
        {proposal.title}
      </h1>
      <p className="text-lg font-medium text-gray-700 mb-4">
        {proposal.hosts
          .map((h) => guests.find((g) => g.ID === h))
          .map((g) => g?.Name)
          .join(", ")}
      </p>
      <p className="mb-3 whitespace-pre-line">{proposal.description}</p>
      {proposal.durationMinutes && (
        <p className="text-sm text-gray-600 mb-4">
          Duration:{" "}
          {formatDuration(
            subtractBreakFromDuration(proposal.durationMinutes),
            true
          )}
        </p>
      )}
    </>
  );
}
