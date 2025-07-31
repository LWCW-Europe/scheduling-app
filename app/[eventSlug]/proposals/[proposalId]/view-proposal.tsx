"use client";

import { useContext } from "react";
import Link from "next/link";
import { PencilIcon } from "@heroicons/react/24/outline";

import { UserContext } from "@/app/context";
import { Proposal } from "@/app/[eventSlug]/proposal";
import type { Guest } from "@/db/guests";
import type { SessionProposal } from "@/db/sessionProposals";

export function ViewProposal(props: {
  proposal: SessionProposal;
  guests: Guest[];
  eventSlug: string;
}) {
  const { proposal, guests, eventSlug } = props;
  const { user: currentUserId } = useContext(UserContext);
  const canEdit = () => {
    if (proposal.hosts.length === 0) {
      return true;
    } else {
      return currentUserId && proposal.hosts.includes(currentUserId);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Proposal proposal={proposal} guests={guests} />
      {canEdit() && (
        <Link
          href={`/${eventSlug}/proposals/${proposal.id}/edit`}
          className="text-rose-400 hover:text-rose-500 inline-flex items-center"
        >
          <PencilIcon className="h-4 w-4 mr-1" />
          Edit
        </Link>
      )}
    </div>
  );
}
