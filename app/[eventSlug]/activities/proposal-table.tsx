"use client";

import { useState, useContext } from "react";
import Link from "next/link";
import { UserContext } from "@/app/context";
import type { SessionProposal } from "@/db/sessionProposals";
import type { Guest } from "@/db/guests";
import { PencilIcon, ClockIcon } from "@heroicons/react/24/outline";
import { searchProposals } from "./actions";
import { useTransition } from "react";

export function ProposalTable({
  guests,
  proposals: initialProposals,
  eventSlug,
}: {
  guests: Guest[];
  proposals: SessionProposal[];
  eventSlug: string;
}) {
  const [proposals, setProposals] = useState(initialProposals);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const { user: currentUserId } = useContext(UserContext);

  const handleSearch = (query: string) => {
    setSearchQuery(query);

    if (query.trim()) {
      startTransition(async () => {
        const result = await searchProposals(eventSlug, query);
        if (result.success) {
          setProposals(result.data);
        }
      });
    } else {
      setProposals(initialProposals);
    }
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return "1 hour";
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours}h${hours > 1 ? "s" : ""} ${remainingMinutes}m`
      : `${hours}h${hours > 1 ? "s" : ""}`;
  };

  const formatDescription = (description: string | undefined) => {
    if (description && description.length >= 100) {
      return description.substring(0, 100) + "...";
    } else {
      return description;
    }
  };

  const canEdit = (hosts: string[]) => {
    if (hosts.length === 0) {
      return true;
    } else {
      return currentUserId && hosts.includes(currentUserId);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="text"
          placeholder="Search proposals..."
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-rose-400 focus:border-transparent"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />
        {isPending && (
          <div className="absolute right-3 top-2.5">
            <div className="animate-spin h-5 w-5 border-2 border-rose-400 rounded-full border-t-transparent"></div>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Title
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Host(s)
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Description
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Duration
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {proposals.map((proposal) => (
              <tr key={proposal.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {proposal.title}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {proposal.hosts
                    .map(
                      (host) =>
                        guests.find((g) => g.ID === host)?.Name || "Deleted"
                    )
                    .join(", ") || "No hosts"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDescription(proposal.description)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1 text-gray-400" />
                    <span className="text-sm text-gray-500">
                      {formatDuration(proposal.durationMinutes)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {canEdit(proposal.hosts) && (
                    <Link
                      href={`/${eventSlug}/activities/${proposal.id}`}
                      className="text-rose-400 hover:text-rose-500 inline-flex items-center"
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Edit
                    </Link>
                  )}
                </td>
              </tr>
            ))}
            {proposals.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  No proposals found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
