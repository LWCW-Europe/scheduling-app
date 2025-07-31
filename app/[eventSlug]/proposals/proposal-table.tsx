"use client";

import { useState, useContext } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";

import { UserContext } from "@/app/context";
import type { SessionProposal } from "@/db/sessionProposals";
import type { Guest } from "@/db/guests";
import { PencilIcon, ClockIcon } from "@heroicons/react/24/outline";

const ITEMS_PER_PAGE = 20;

export function ProposalTable({
  guests,
  proposals: initialProposals,
  eventSlug,
}: {
  guests: Guest[];
  proposals: SessionProposal[];
  eventSlug: string;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [myProposals, setMyProposals] = useState(false);
  const { user: currentUserId } = useContext(UserContext);
  const router = useRouter();
  const filteredProposals = () => {
    let res = initialProposals;
    if (myProposals) {
      res = res.filter((pr) => pr.hosts.includes(currentUserId || ""));
    }
    if (searchQuery.trim()) {
      res = res.filter((pr) => pr.title.includes(searchQuery));
    }
    return res;
  };
  const totalPages = Math.ceil(filteredProposals().length / ITEMS_PER_PAGE);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      setPage(1);
    }
  };

  const getPageNumbers = () => {
    const pages = [
      { display: "<<", toPage: 1 },
      { display: "<", toPage: Math.max(page - 1, 1) },
    ];
    for (
      let i = Math.max(1, page - 2);
      i <= Math.min(page + 2, totalPages);
      i++
    ) {
      pages.push({
        display: i.toString(),
        toPage: i,
      });
    }
    pages.push({ display: ">", toPage: Math.min(page + 1, totalPages) });
    pages.push({ display: ">>", toPage: totalPages });
    return pages;
  };

  const pageCssClass = (display: string) => {
    if (+display === page) {
      return "bg-blue-600 text-white";
    } else if (!isNaN(+display)) {
      return "text-gray-700 bg-white border border-gray-300 hover:bg-gray-200";
    } else {
      return "px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed";
    }
  };

  const currentPageProposals = () => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredProposals().slice(start, start + ITEMS_PER_PAGE);
  };

  const visitViewPage = (proposal: SessionProposal) => {
    router.push(`/${eventSlug}/proposals/${proposal.id}`);
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return "";
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`;
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
      <button
        className={clsx(
          "text-white px-3 py-2 rounded-md items-center",
          myProposals
            ? "bg-blue-600 hover:bg-blue-700"
            : "bg-gray-400 hover:bg-gray-500"
        )}
        onClick={() => setMyProposals(!myProposals)}
      >
        My proposals
      </button>
      <div className="relative">
        <input
          type="text"
          placeholder="Search proposals..."
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-rose-400 focus:border-transparent"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />
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
            {currentPageProposals().map((proposal) => (
              <tr
                key={proposal.id}
                className="hover:bg-gray-200 cursor-pointer"
                onClick={() => visitViewPage(proposal)}
              >
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
                    {proposal.durationMinutes && (
                      <>
                        <ClockIcon className="h-4 w-4 mr-1 text-gray-400" />
                        <span className="text-sm text-gray-500">
                          {formatDuration(proposal.durationMinutes)}
                        </span>
                      </>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {canEdit(proposal.hosts) && (
                    <Link
                      href={`/${eventSlug}/proposals/${proposal.id}/edit`}
                      className="text-rose-400 hover:text-rose-500 inline-flex items-center text-base"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Edit
                    </Link>
                  )}
                </td>
              </tr>
            ))}
            {filteredProposals().length === 0 && (
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
      {filteredProposals().length > ITEMS_PER_PAGE && (
        <div className="flex items-center gap-1">
          {getPageNumbers().map(({ display, toPage }) => (
            <button
              key={display}
              onClick={() => setPage(toPage)}
              disabled={page == toPage}
              className={clsx(
                "px-3 py-2 text-sm font-medium rounded-md",
                pageCssClass(display)
              )}
            >
              {display}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
