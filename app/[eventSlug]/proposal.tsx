"use client";

import { useContext } from "react";
import Link from "next/link";
import { PencilIcon } from "@heroicons/react/24/outline";

import { UserContext } from "@/app/context";
import type { Guest } from "@/db/guests";
import type { SessionProposal } from "@/db/sessionProposals";

export function ViewProposal(props: {
  proposal: SessionProposal;
  guests: Guest[];
  eventSlug: string;
}) {
  const { proposal, guests, eventSlug } = props;
  const { user: currentUserId } = useContext(UserContext);
  const displayDuration = (duration: number) => {
    if (duration === 30) {
      return "30 minutes";
    } else {
      const numHours = duration / 60;
      const hoursStr = numHours === 1 ? "hour" : "hours";
      return `${numHours} ${hoursStr}`;
    }
  };
  const canEdit = () => {
    if (proposal.hosts.length === 0) {
      return true;
    } else {
      return currentUserId && proposal.hosts.includes(currentUserId);
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
      {canEdit() && (
        <Link
          href={`/${eventSlug}/proposals/${proposal.id}/edit`}
          className="text-rose-400 hover:text-rose-500 inline-flex items-center"
        >
          <PencilIcon className="h-4 w-4 mr-1" />
          Edit
        </Link>
      )}
    </>
  );
}
