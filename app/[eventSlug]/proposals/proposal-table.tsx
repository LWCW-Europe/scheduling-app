"use client";

import { useState, useEffect, useContext } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";

import { UserContext } from "@/app/context";
import type { SessionProposal } from "@/db/sessionProposals";
import type { Guest } from "@/db/guests";
import { PencilIcon, ClockIcon } from "@heroicons/react/24/outline";

const ITEMS_PER_PAGE = 10;

export function ProposalTable({
  guests,
  proposals: paramProposals,
  eventSlug,
}: {
  guests: Guest[];
  proposals: SessionProposal[];
  eventSlug: string;
}) {
  const initialProposals = paramProposals.map((proposal) => {
    const hostNames = proposal.hosts.map(
      (h) => guests.find((g) => g.ID === h)?.Name || ""
    );
    return { ...proposal, hostNames };
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [myProposals, setMyProposals] = useState(false);
  const { user: currentUserId } = useContext(UserContext);
  const router = useRouter();
  const filteredProposals = initialProposals.filter((pr) => {
    if (myProposals && currentUserId) {
      if (!pr.hosts.includes(currentUserId)) {
        return false;
      }
    }
    return true;
  });
  const totalPages = Math.ceil(filteredProposals.length / ITEMS_PER_PAGE);
  function updateMyProposals(newValue: boolean) {
    setPage(1);
    setMyProposals(newValue);
  }
  useEffect(() => {
    if (!currentUserId) {
      setMyProposals(false);
    }
  }, [currentUserId]);
  const fuse = new Fuse(filteredProposals, {
    keys: [
      {
        name: "title",
        weight: 0.6,
      },
      {
        name: "hostNames",
        weight: 0.25,
      },
      {
        name: "description",
        weight: 0.15,
      },
    ],
  });
  const searchResults = searchQuery.trim()
    ? fuse.search(searchQuery).map((res) => res.item)
    : filteredProposals;

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      setPage(1);
    }
  };

  const getPageNumbers = () => {
    const arrowCss =
      "px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed";
    const currentPageNumCss = "bg-blue-600 text-white";
    const otherPageNumCss =
      "text-gray-700 bg-white border border-gray-300 hover:bg-gray-200";
    const pages = [
      { display: "<<", toPage: 1, css: arrowCss },
      { display: "<", toPage: Math.max(page - 1, 1), css: arrowCss },
    ];
    for (
      let i = Math.max(1, page - 2);
      i <= Math.min(page + 2, totalPages);
      i++
    ) {
      const css = i === page ? currentPageNumCss : otherPageNumCss;
      pages.push({
        display: i.toString(),
        toPage: i,
        css,
      });
    }
    pages.push({
      display: ">",
      toPage: Math.min(page + 1, totalPages),
      css: arrowCss,
    });
    pages.push({ display: ">>", toPage: totalPages, css: arrowCss });
    return pages;
  };

  const currentPageProposals = searchResults.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

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
        className={`text-white px-3 py-2 rounded-md items-center ${
          myProposals
            ? "bg-blue-600 hover:bg-blue-700"
            : "bg-gray-400 hover:bg-gray-500"
        }`}
        onClick={() => updateMyProposals(!myProposals)}
        disabled={!currentUserId}
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
        <table className="table-fixed w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="w-[20%] truncate text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Title
              </th>
              <th
                scope="col"
                className="w-[20%] truncate px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Host(s)
              </th>
              <th
                scope="col"
                className="w-[40%] truncate px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Description
              </th>
              <th
                scope="col"
                className="w-[10%] truncate px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Duration
              </th>
              <th
                scope="col"
                className="w-[10%] truncate px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentPageProposals.map((proposal) => (
              <tr
                key={proposal.id}
                className="hover:bg-gray-200 cursor-pointer"
                onClick={() => visitViewPage(proposal)}
              >
                <td className="truncate px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {proposal.title}
                  </div>
                </td>
                <td className="truncate px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {proposal.hosts
                    .map(
                      (host) =>
                        guests.find((g) => g.ID === host)?.Name || "Deleted"
                    )
                    .join(", ") || "-"}
                </td>
                <td className="truncate px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {proposal.description}
                </td>
                <td className="truncate px-6 py-4 whitespace-nowrap">
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
                <td className="truncate px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
            {searchResults.length === 0 && (
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
      {searchResults.length > ITEMS_PER_PAGE && (
        <div className="flex items-center gap-1">
          {getPageNumbers().map(({ display, toPage, css }) => (
            <button
              key={display}
              onClick={() => setPage(toPage)}
              disabled={page == toPage}
              className={"px-3 py-2 text-sm font-medium rounded-md " + css}
            >
              {display}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
